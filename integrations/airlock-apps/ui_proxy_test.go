package main

import (
	"agent/bridgeauth"
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/airlockrun/agentsdk"
)

// The product UI is reached through a signed delegation header. The app never
// forwards the native host credential, and it refuses any request that is not
// an admitted admin call for this app's own host.
func TestProductUIRequiresAdmittedAdminAndExactAppHost(t *testing.T) {
	upstreamCalls := 0
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		upstreamCalls++
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<html><title>Existing product UI</title></html>`))
	}))
	defer upstream.Close()

	app := makeApplication(appConfig{
		Name:    "fixture",
		Slug:    "noticeplace",
		AgentID: "native-app",
		UIURL:   upstream.URL,
	})

	request := func(ctx context.Context, host, origin string) *httptest.ResponseRecorder {
		r := httptest.NewRequest("GET", "http://internal-container/admin/?history=test", nil).WithContext(ctx)
		r.Header.Set("X-Forwarded-Host", host)
		if origin != "" {
			r.Header.Set("Origin", origin)
		}
		r.Header.Set(bridgeauth.Header, "caller-forgery")
		r.Header.Set("Authorization", "Bearer native-private-host-token")
		w := httptest.NewRecorder()
		if err := app.productUI(w, r); err != nil {
			t.Fatal(err)
		}
		return w
	}

	const host = "noticeplace.airlock.bezrabotnyi.com"

	if w := request(memberContext("oleg"), host, "https://"+host); w.Code != 403 {
		t.Fatal("non-admin caller reached the product interface:", w.Code)
	}
	if w := request(adminContext("oleg"), "other.airlock.bezrabotnyi.com", ""); w.Code != 403 {
		t.Fatal("foreign host reached the product interface:", w.Code)
	}
	if w := request(adminContext("oleg"), host, "https://foreign.example"); w.Code != 403 {
		t.Fatal("foreign browser origin accepted:", w.Code)
	}
	if upstreamCalls != 0 {
		t.Fatal("rejected request reached the product interface")
	}

	// An admitted admin call for the exact host passes every guard and then
	// needs the write-only delegation key from the agent runtime. Without a
	// runtime the request must stop before the product interface.
	w := request(adminContext("oleg"), host, "https://"+host)
	if w.Code != 503 {
		t.Fatal("admitted call without a delegation key was not stopped:", w.Code)
	}
	if upstreamCalls != 0 {
		t.Fatal("request without a delegation key reached the product interface")
	}
}

// TestDelegationHeaderCarriesExactNativePrincipal pins the delegated identity
// that the product interface receives: the admitted principal, the app id and
// the exact request line, signed with the write-only key.
func TestDelegationHeaderCarriesExactNativePrincipal(t *testing.T) {
	const key = "fixture-ui-signing-key"
	app := makeApplication(appConfig{
		Name:    "fixture",
		Slug:    "noticeplace",
		AgentID: "native-app",
	})
	ctx := adminContext("oleg")
	caller, ok := agentsdk.CallerFromContext(ctx).User()
	if !ok {
		t.Fatal("admitted caller is missing from the context")
	}

	claims := bridgeauth.Claims{
		AppID:   app.config.AgentID,
		UserID:  caller.ID,
		Email:   caller.Email,
		Role:    "admin",
		Host:    "noticeplace.airlock.bezrabotnyi.com",
		Method:  "GET",
		URI:     "/admin/?history=test",
		Expires: time.Now().Add(30 * time.Second).Unix(),
	}
	assertion, err := bridgeauth.Sign(claims, key)
	if err != nil {
		t.Fatal(err)
	}
	got, err := bridgeauth.Verify(assertion, key, time.Now(), "native-app", "GET", "/admin/?history=test")
	if err != nil {
		t.Fatal(err)
	}
	if got.UserID != "oleg" || got.Email != "oleg@example.com" || got.Role != "admin" {
		t.Fatal("native principal was lost in the delegation header")
	}
	if _, err := bridgeauth.Verify(assertion, "another-key", time.Now(), "native-app", "GET", "/admin/?history=test"); err == nil {
		t.Fatal("delegation header accepted with a foreign key")
	}
	if _, err := bridgeauth.Verify(assertion, key, time.Now(), "native-app", "GET", "/admin/other"); err == nil {
		t.Fatal("delegation header accepted for another request line")
	}
}

// A Plan save carries its session CSRF token independently of delegated identity.
func TestProductUIKeepsCSRFButStripsCallerIdentity(t *testing.T) {
	h := http.Header{
		"X-Airlock-Csrf":        {"session-csrf"},
		"x-aIrLoCk-uSeR":        {"forged-user"},
		"X-Airlock-Ui-Identity": {"forged-identity"},
		"Authorization":         {"Bearer private-token"},
		"Content-Type":          {"application/json"},
	}
	stripProductUIIdentityHeaders(h)
	if got := h.Get("X-Airlock-CSRF"); got != "session-csrf" {
		t.Fatalf("product session CSRF lost: %q", got)
	}
	for k := range h {
		if k != "X-Airlock-Csrf" && k != "Content-Type" {
			t.Fatalf("caller identity header survived: %s", k)
		}
	}
}
