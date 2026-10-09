package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/agentsdk/agenttest"
	"github.com/airlockrun/agentsdk/wire"
)

func TestPrivateCredentialsAreSelectedByPrincipal(t *testing.T) {
	c := appConfig{Bindings: []binding{{Slug: "owner", Principal: "alice"}, {Slug: "oleg", Principal: "bob"}}}
	if b, err := c.bindingFor("bob"); err != nil || b.Slug != "oleg" {
		t.Fatal("wrong private credential selected")
	}
	if _, err := c.bindingFor("third-admin"); err == nil {
		t.Fatal("admin borrowed another person's credentials")
	}
}

func TestMutationNeedsConfirmationAndUnknownToolNeverReachesMCP(t *testing.T) {
	c := appConfig{Name: "fixture", Bindings: []binding{{Slug: "fixture", URL: "https://example.com/mcp", AuthMode: "none"}}, Operations: []operation{{Tool: "read", Title: "Read"}, {Tool: "write", Title: "Write", Mutation: true}}}
	var app *application
	env := agenttest.New(t, func() *agentsdk.Agent { app = makeApplication(c); return app.agent })
	base := env.Airlock.Server.Config.Handler
	var calls []string
	env.Airlock.Server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/agent/mcp/fixture/tools/call" {
			var req wire.MCPToolCallRequest
			json.NewDecoder(r.Body).Decode(&req)
			calls = append(calls, req.Tool)
			json.NewEncoder(w).Encode(wire.MCPToolCallResponse{Content: []wire.MCPContent{{Type: "text", Text: `{"ok":true}`}}})
			return
		}
		base.ServeHTTP(w, r)
	})
	ctx := agenttest.WithCaller(context.Background(), agentsdk.User{ID: "alice"}, agentsdk.AccessAdmin)
	for _, in := range []callInput{{Tool: "unknown"}, {Tool: "write"}} {
		if _, err := app.call(ctx, in); err == nil {
			t.Fatal("unsafe call accepted")
		}
	}
	if len(calls) != 0 {
		t.Fatal("rejected call reached upstream")
	}
	if _, err := app.call(agenttest.WithUser(context.Background(), agentsdk.User{ID: "alice"}), callInput{Tool: "read"}); err == nil {
		t.Fatal("non-admin accessed operations")
	}
	if _, err := app.call(ctx, callInput{Tool: "read"}); err != nil {
		t.Fatal(err)
	}
	if _, err := app.call(ctx, callInput{Tool: "write", Confirm: true}); err != nil {
		t.Fatal(err)
	}
	if len(calls) != 2 {
		t.Fatal("valid operations did not use native MCP proxy")
	}
	// Airlock rewrites Host to the container and supplies the original browser
	// host through X-Forwarded-Host. A valid same-origin browser must still work.
	for _, tc := range []struct {
		origin string
		status int
	}{
		{"https://fixture.airlock.bezrabotnyi.com", http.StatusOK},
		{"https://foreign.example", http.StatusForbidden},
	} {
		r := httptest.NewRequest("POST", "http://internal-container:8080/api/call", strings.NewReader(`{"tool":"read","args":{}}`)).WithContext(ctx)
		r.Header.Set("Origin", tc.origin)
		r.Header.Set("X-Forwarded-Host", "fixture.airlock.bezrabotnyi.com")
		w := httptest.NewRecorder()
		if err := app.invoke(w, r); err != nil {
			t.Fatal(err)
		}
		if w.Code != tc.status {
			t.Fatalf("browser origin %s: status %d, want %d", tc.origin, w.Code, tc.status)
		}
	}
	if len(calls) != 3 {
		t.Fatal("foreign origin reached service or valid browser did not")
	}
}
