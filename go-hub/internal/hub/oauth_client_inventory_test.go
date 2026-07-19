package hub

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
)

func TestDynamicOAuthClientInventorySurvivesRestartAndBindsIssuedToken(t *testing.T) {
	cfg := Config{
		CtlToken:                 "ctl",
		AdminPassword:            "admin-password",
		OAuthClientSecret:        "oauth-signing-secret",
		ConfigDir:                t.TempDir(),
		PublicOrigin:             "https://hub.example",
		MCPResource:              "https://hub.example",
		OAuthPermissiveRedirects: true,
		OAuthPermissiveResources: true,
	}

	first := New(cfg)
	registered := oauthInventoryRequest(t, first, http.MethodPost, "/register", "", map[string]any{
		"redirect_uris": []string{"https://client.example/callback"},
	})
	if registered.Code != http.StatusCreated {
		t.Fatalf("register status=%d body=%s", registered.Code, registered.Body.String())
	}
	var registration struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
	}
	if err := json.Unmarshal(registered.Body.Bytes(), &registration); err != nil {
		t.Fatal(err)
	}
	if registration.ClientID == "" || registration.ClientSecret == "" {
		t.Fatalf("registration missing client credentials: %s", registered.Body.String())
	}

	// Restart before any profile mutation: dynamic registration itself must be
	// durable and visible through the existing admin client inventory endpoint.
	restarted := New(cfg)
	clients := oauthInventoryRequest(t, restarted, http.MethodGet, "/admin/api/clients", cfg.CtlToken, nil)
	if clients.Code != http.StatusOK {
		t.Fatalf("client inventory status=%d body=%s", clients.Code, clients.Body.String())
	}
	if strings.Contains(clients.Body.String(), registration.ClientSecret) {
		t.Fatalf("client inventory leaked the raw OAuth client secret: %s", clients.Body.String())
	}
	var inventory struct {
		Clients []map[string]any `json:"clients"`
	}
	if err := json.Unmarshal(clients.Body.Bytes(), &inventory); err != nil {
		t.Fatal(err)
	}
	client := findOAuthInventoryClient(inventory.Clients, registration.ClientID)
	if client == nil {
		t.Fatalf("registered OAuth client %q is missing from inventory: %s", registration.ClientID, clients.Body.String())
	}
	if _, exposed := client["client_secret"]; exposed {
		t.Fatalf("client inventory exposed client_secret: %v", client)
	}

	profilePath := "/admin/api/access-profiles/oauth-profile"
	profile := oauthInventoryRequest(t, restarted, http.MethodPut, profilePath, cfg.CtlToken, map[string]any{
		"id":              "oauth-profile",
		"access_mode":     "readonly",
		"allowed_targets": []string{"hub"},
		"allowed_tools":   []string{"discover"},
	})
	if profile.Code != http.StatusOK {
		t.Fatalf("profile status=%d body=%s", profile.Code, profile.Body.String())
	}

	bindingPath := "/admin/api/client-bindings/" + url.PathEscape(registration.ClientID)
	binding := oauthInventoryRequest(t, restarted, http.MethodPut, bindingPath, cfg.CtlToken, map[string]any{
		"profile_id": "oauth-profile",
	})
	if binding.Code != http.StatusOK {
		t.Fatalf("client binding status=%d body=%s", binding.Code, binding.Body.String())
	}

	// The binding is keyed by OAuth client_id, not an in-memory token ID.
	restarted = New(cfg)
	clients = oauthInventoryRequest(t, restarted, http.MethodGet, "/admin/api/clients", cfg.CtlToken, nil)
	if clients.Code != http.StatusOK {
		t.Fatalf("restarted client inventory status=%d body=%s", clients.Code, clients.Body.String())
	}
	if strings.Contains(clients.Body.String(), registration.ClientSecret) {
		t.Fatalf("restarted client inventory leaked the raw OAuth client secret: %s", clients.Body.String())
	}
	if err := json.Unmarshal(clients.Body.Bytes(), &inventory); err != nil {
		t.Fatal(err)
	}
	client = findOAuthInventoryClient(inventory.Clients, registration.ClientID)
	if client == nil || client["profile_id"] != "oauth-profile" {
		t.Fatalf("OAuth client profile binding was not persisted: %v", client)
	}

	verifier := "oauth-inventory-pkce-verifier"
	redirectURI := "https://client.example/callback"
	authorizeForm := url.Values{
		"client_id":             {registration.ClientID},
		"redirect_uri":          {redirectURI},
		"resource":              {cfg.MCPResource},
		"scope":                 {"gptadmin.read"},
		"password":              {cfg.AdminPassword},
		"code_challenge":        {oauthInventoryPKCE(verifier)},
		"code_challenge_method": {"S256"},
		"state":                 {"inventory-test"},
	}
	authorized := oauthInventoryRequestBody(t, restarted, http.MethodPost, "/authorize", "", authorizeForm.Encode(), "application/x-www-form-urlencoded")
	if authorized.Code != http.StatusFound {
		t.Fatalf("authorize status=%d body=%s", authorized.Code, authorized.Body.String())
	}
	code := oauthInventoryRedirectCode(t, authorized.Header().Get("Location"))

	tokenForm := url.Values{
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"client_id":     {registration.ClientID},
		"redirect_uri":  {redirectURI},
		"resource":      {cfg.MCPResource},
		"code_verifier": {verifier},
	}
	tokenResponse := oauthInventoryRequestBody(t, restarted, http.MethodPost, "/token", "", tokenForm.Encode(), "application/x-www-form-urlencoded")
	if tokenResponse.Code != http.StatusOK {
		t.Fatalf("token status=%d body=%s", tokenResponse.Code, tokenResponse.Body.String())
	}
	var tokenBody struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(tokenResponse.Body.Bytes(), &tokenBody); err != nil {
		t.Fatal(err)
	}
	claims, err := restarted.verifyJWT(tokenBody.AccessToken)
	if err != nil {
		t.Fatalf("issued OAuth access token is invalid: %v", err)
	}
	if claims["client_id"] != registration.ClientID || claims["profile_id"] != "oauth-profile" {
		t.Fatalf("issued OAuth access token lost client/profile context: %v", claims)
	}
}

func oauthInventoryRequest(t *testing.T, server *Server, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	if body == nil {
		return oauthInventoryRequestBody(t, server, method, path, token, "", "")
	}
	encoded, err := json.Marshal(body)
	if err != nil {
		t.Fatal(err)
	}
	return oauthInventoryRequestBody(t, server, method, path, token, string(encoded), "application/json")
}

func oauthInventoryRequestBody(t *testing.T, server *Server, method, path, token, body, contentType string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, bytes.NewBufferString(body))
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	if method == http.MethodPut && strings.HasPrefix(path, "/admin/api/access-profiles/") {
		req.Header.Set("If-Match", "*")
	}
	recorder := httptest.NewRecorder()
	server.Handler().ServeHTTP(recorder, req)
	return recorder
}

func findOAuthInventoryClient(clients []map[string]any, clientID string) map[string]any {
	for _, client := range clients {
		if client["client_id"] == clientID {
			return client
		}
	}
	return nil
}

func oauthInventoryPKCE(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func oauthInventoryRedirectCode(t *testing.T, location string) string {
	t.Helper()
	parsed, err := url.Parse(location)
	if err != nil {
		t.Fatalf("parse authorize redirect: %v", err)
	}
	code := parsed.Query().Get("code")
	if code == "" {
		t.Fatalf("authorize redirect missing code: %s", location)
	}
	return code
}
