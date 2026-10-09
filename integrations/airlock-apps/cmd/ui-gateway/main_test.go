package main

import (
	"agent/bridgeauth"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// focused integration; expected<1s/max5s. A legacy owner login cookie must not
// replace signed Oleg, while CSRF/preferences cookies and binary API data survive.
func TestGatewayPersonalPrincipalWinsOverOwnerCookies(t *testing.T) {
	var seen []http.Header
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = append(seen, r.Header.Clone())
		w.Header().Set("Content-Type", "application/octet-stream")
		w.Write([]byte{0, 1, 255})
	}))
	defer backend.Close()
	g := &gateway{targets: map[string]targetConfig{"universal-userio": {AppID: "userio-app", URL: backend.URL, Mode: "userio", Principals: map[string]string{"oleg": "oleg@example.com"}}}, keys: map[string]string{"universal-userio": "fixture-ui-key"}, userTokens: map[string]map[string]string{"universal-userio": {"oleg": "own-oleg-fixture-token"}}}
	claim := bridgeauth.Claims{AppID: "userio-app", UserID: "oleg", Email: "oleg@example.com", Role: "admin", Host: "universal-userio.airlock.bezrabotnyi.com", Method: "GET", URI: "/v1/accounts", Expires: time.Now().Add(30 * time.Second).Unix()}
	signed, _ := bridgeauth.Sign(claim, "fixture-ui-key")
	r := httptest.NewRequest("GET", "http://private/universal-userio/v1/accounts", nil)
	r.Header.Set(bridgeauth.Header, signed)
	r.Header.Set("Cookie", "userio_web_session=old-owner; gptadmin_auth=old-sso-owner; csrf=csrf-fixture; theme=dark")
	r.Header.Set("Authorization", "Bearer caller-owned-foreign-token")
	w := httptest.NewRecorder()
	g.ServeHTTP(w, r)
	if w.Code != 200 || len(w.Body.Bytes()) != 3 || len(seen) != 1 {
		t.Fatal("binary response or original API lost")
	}
	if seen[0].Get("Authorization") != "Bearer own-oleg-fixture-token" {
		t.Fatal("owner/caller token replaced signed Oleg")
	}
	if strings.Contains(seen[0].Get("Cookie"), "owner") || !strings.Contains(seen[0].Get("Cookie"), "csrf=csrf-fixture") {
		t.Fatal("legacy login retained or functional CSRF cookie lost")
	}
	r = httptest.NewRequest("GET", "http://private/universal-userio/v1/accounts", nil)
	r.Header.Set(bridgeauth.Header, "forged")
	w = httptest.NewRecorder()
	g.ServeHTTP(w, r)
	if w.Code != 401 || len(seen) != 1 {
		t.Fatal("invalid identity reached backend")
	}
}
