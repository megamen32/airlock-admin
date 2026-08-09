package hub

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestAccessModeTreatsWriteScopeAsFull(t *testing.T) {
	for _, scope := range []string{"gptadmin.exec", "gptadmin.write"} {
		r := httptest.NewRequest(http.MethodPost, "/mcp-relay/call", nil)
		r = requestWithAuthClaims(r, map[string]any{"scope": "gptadmin.read " + scope})
		if got := requestAccessMode(r); got != accessModeFull {
			t.Fatalf("scope %q: access mode = %q, want %q", scope, got, accessModeFull)
		}
	}
}

func TestRequestAccessModeDoesNotTreatReadOnlyScopeAsFull(t *testing.T) {
	r := httptest.NewRequest(http.MethodPost, "/mcp-relay/call", nil)
	r = requestWithAuthClaims(r, map[string]any{"scope": "gptadmin.read"})
	if got := requestAccessMode(r); got != accessModeReadonly {
		t.Fatalf("read-only scope: access mode = %q, want %q", got, accessModeReadonly)
	}
}
