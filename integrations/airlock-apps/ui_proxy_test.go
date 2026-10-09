package main

import (
	"agent/bridgeauth"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/agentsdk/agenttest"
)

// focused integration; expected8s/max45s. Detect losing native caller metadata
// or replacing the existing product page with a wrapper or owner identity.
func TestOriginalUIRequestCarriesExactNativePrincipal(t *testing.T) {
	const key = "fixture-ui-signing-key"
	var claims bridgeauth.Claims
	upstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var err error
		claims, err = bridgeauth.Verify(r.Header.Get(bridgeauth.Header), key, time.Now(), "native-app", "GET", "/admin/?history=test")
		if err != nil {
			t.Error(err)
		}
		if r.Header.Get("Authorization") != "" {
			t.Error("native host credential leaked")
		}
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<html><title>Existing product UI</title></html>`))
	}))
	defer upstream.Close()
	var app *application
	env := agenttest.New(t, func() *agentsdk.Agent {
		app = makeApplication(appConfig{Name: "fixture", Slug: "noticeplace", AgentID: "native-app", UIURL: upstream.URL})
		return app.agent
	})
	original := env.Airlock.Server.Config.Handler
	env.Airlock.Server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/agent/env-vars/ui_gateway_key" {
			json.NewEncoder(w).Encode(map[string]string{"value": key})
			return
		}
		original.ServeHTTP(w, r)
	})
	ctx := agenttest.WithCaller(context.Background(), agentsdk.User{ID: "oleg", Email: "oleg@example.com"}, agentsdk.AccessAdmin)
	r := httptest.NewRequest("GET", "http://internal-container/admin/?history=test", nil).WithContext(ctx)
	r.Header.Set("X-Forwarded-Host", "noticeplace.airlock.bezrabotnyi.com")
	r.Header.Set("Origin", "https://noticeplace.airlock.bezrabotnyi.com")
	r.Header.Set(bridgeauth.Header, "caller-forgery")
	r.Header.Set("Authorization", "Bearer native-private-host-token")
	w := httptest.NewRecorder()
	if err := app.productUI(w, r); err != nil {
		t.Fatal(err)
	}
	if w.Code != 200 || !strings.Contains(w.Body.String(), "Existing product UI") || claims.UserID != "oleg" {
		t.Fatal("existing UI or native principal was lost")
	}
	r.Header.Set("Origin", "https://foreign.example")
	w = httptest.NewRecorder()
	app.productUI(w, r)
	if w.Code != 403 {
		t.Fatal("foreign browser origin accepted")
	}
}
