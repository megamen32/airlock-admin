package main

import (
	"context"
	"strings"
	"testing"

	"github.com/airlockrun/agentsdk/testutil"
	"github.com/airlockrun/agentsdk/wire"
)

// callerContext builds the direct domain/handler fixture the SDK 0.8 exposes
// for offline tests: no local host, no runtime, no credential lookup.
func callerContext(id string, access wire.Access) context.Context {
	user := wire.CallerUser{ID: id, Email: id + "@example.com", PlatformMember: true}
	return testutil.WithCaller(context.Background(), wire.Caller{
		Kind:      "user",
		Access:    access,
		User:      &user,
		Initiator: &wire.CallerUser{ID: user.ID, Email: user.Email, PlatformMember: user.PlatformMember},
		Origin:    wire.CallerOrigin{Interface: "http", Execution: "request"},
	})
}

func adminContext(id string) context.Context  { return callerContext(id, wire.AccessAdmin) }
func memberContext(id string) context.Context { return callerContext(id, wire.AccessUser) }

func TestPrivateCredentialsAreSelectedByPrincipal(t *testing.T) {
	c := appConfig{Bindings: []binding{{Slug: "owner", Principal: "alice"}, {Slug: "oleg", Principal: "bob"}}}
	if b, err := c.bindingFor("bob"); err != nil || b.Slug != "oleg" {
		t.Fatal("wrong private credential selected")
	}
	if _, err := c.bindingFor("third-admin"); err == nil {
		t.Fatal("admin borrowed another person's credentials")
	}
}

// TestGuardsRejectUnsafeCallsBeforeAnyUpstreamCall covers the allowlist and
// confirmation guards. Every rejected call must fail before the app touches the
// MCP proxy or the runtime budget, so no upstream request can happen.
func TestGuardsRejectUnsafeCallsBeforeAnyUpstreamCall(t *testing.T) {
	c := appConfig{
		Name: "fixture",
		Bindings: []binding{
			{Slug: "owner", URL: "https://example.com/mcp", AuthMode: "none", Principal: "alice"},
			{Slug: "oleg", URL: "https://example.com/mcp", AuthMode: "none", Principal: "bob"},
		},
		Operations: []operation{
			{Tool: "read", Title: "Read"},
			{Tool: "write", Title: "Write", Mutation: true},
		},
	}
	app := makeApplication(c)
	admin := adminContext("alice")

	if _, err := app.call(admin, callInput{Tool: "unknown"}); err == nil {
		t.Fatal("unknown tool accepted")
	} else if !strings.Contains(err.Error(), "Операция отсутствует") {
		t.Fatal("unexpected error for unknown tool:", err)
	}

	if _, err := app.call(admin, callInput{Tool: "write"}); err == nil {
		t.Fatal("mutation accepted without confirmation")
	} else if !strings.Contains(err.Error(), "Подтвердите") {
		t.Fatal("unexpected error for unconfirmed mutation:", err)
	}

	if _, err := app.call(memberContext("alice"), callInput{Tool: "read"}); err == nil {
		t.Fatal("non-admin accessed operations")
	} else if !strings.Contains(err.Error(), "Требуется вход") {
		t.Fatal("unexpected error for non-admin caller:", err)
	}

	// A confirmed mutation passes every guard and only then needs the agent
	// runtime (MCP proxy plus runtime budget), which is absent offline.
	if _, err := app.call(admin, callInput{Tool: "write", Confirm: true}); err == nil {
		t.Fatal("confirmed mutation was expected to need the runtime")
	} else if strings.Contains(err.Error(), "Подтвердите") {
		t.Fatal("confirmed mutation did not pass the confirmation guard:", err)
	}

	// A principal without a personal binding must not borrow another one.
	other := adminContext("third-admin")
	if _, err := app.call(other, callInput{Tool: "read"}); err == nil {
		t.Fatal("admin borrowed another person's credentials")
	} else if !strings.Contains(err.Error(), "Личное подключение") {
		t.Fatal("unexpected error for unbound principal:", err)
	}
}
