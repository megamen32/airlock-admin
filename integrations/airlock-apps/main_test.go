package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
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
	budgetStatus := 204
	budget := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(budgetStatus) }))
	defer budget.Close()
	c := appConfig{Name: "fixture", Bindings: []binding{{Slug: "fixture", URL: "https://example.com/mcp", AuthMode: "none"}}, Operations: []operation{{Tool: "read", Title: "Read"}, {Tool: "write", Title: "Write", Mutation: true}}}
	var app *application
	c.UIURL = budget.URL
	env := agenttest.New(t, func() *agentsdk.Agent { app = makeApplication(c); return app.agent })
	base := env.Airlock.Server.Config.Handler
	var calls []string
	env.Airlock.Server.Config.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/agent/env-vars/ui_gateway_key" {
			json.NewEncoder(w).Encode(map[string]string{"value": "fixture-key"})
			return
		}
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
	budgetStatus = 503
	if _, err := app.call(ctx, callInput{Tool: "read"}); err == nil || len(calls) != 2 {
		t.Fatal("MCP call bypassed missing finite runtime budget")
	}
}
