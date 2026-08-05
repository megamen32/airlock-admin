package hub

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
)

func TestWebhookHubToolsProvideSecretSafeCRUDAndJobParity(t *testing.T) {
	configPath := filepath.Join(t.TempDir(), "webhooks.json")
	s := New(Config{CtlToken: "ctl", WebhookConfigFile: configPath})
	route := map[string]any{
		"id":                "repair-mac",
		"hmac_secret":       "write-only-secret",
		"signature_version": "v2",
		"action": map[string]any{
			"kind": "shell", "target": "shell:mac", "command": "fixed-helper repair_mac",
		},
	}

	created, status := s.callWebhookHubTool("webhook_route_create", map[string]any{"route": route})
	if status != http.StatusCreated || created["id"] != "repair-mac" {
		t.Fatalf("create status=%d response=%v", status, created)
	}
	if encoded, _ := json.Marshal(created); string(encoded) == "" || containsSecret(string(encoded), "write-only-secret") {
		t.Fatalf("create response exposed route secret: %s", encoded)
	}

	listed, status := s.callWebhookHubTool("webhook_routes_list", nil)
	if status != http.StatusOK || len(anySlice(listed["routes"])) != 1 {
		t.Fatalf("list status=%d response=%v", status, listed)
	}

	replacement := cloneMap(route)
	replacement["action"] = map[string]any{"kind": "shell", "target": "shell:mac-2", "command": "fixed-helper repair_mac"}
	replaced, status := s.callWebhookHubTool("webhook_route_replace", map[string]any{"id": "repair-mac", "route": replacement})
	if status != http.StatusOK || replaced["target"] != "shell:mac-2" {
		t.Fatalf("replace status=%d response=%v", status, replaced)
	}

	s.mu.Lock()
	s.webhookJobs["job-1"] = &webhookJob{ID: "job-1", RouteID: "repair-mac", Status: "completed"}
	s.mu.Unlock()
	job, status := s.callWebhookHubTool("webhook_job_get", map[string]any{"id": "job-1"})
	if status != http.StatusOK || job["job_id"] != "job-1" || job["status"] != "completed" {
		t.Fatalf("job status=%d response=%v", status, job)
	}

	if _, status := s.callWebhookHubTool("webhook_route_delete", map[string]any{"id": "repair-mac"}); status != http.StatusBadRequest {
		t.Fatalf("delete without confirmation status=%d, want 400", status)
	}
	deleted, status := s.callWebhookHubTool("webhook_route_delete", map[string]any{"id": "repair-mac", "confirm": true})
	if status != http.StatusOK || deleted["deleted"] != true {
		t.Fatalf("delete status=%d response=%v", status, deleted)
	}
}

func TestWebhookParityToolsAreAdvertisedAndReadPolicyIsNarrow(t *testing.T) {
	for _, tools := range [][]map[string]any{hubTools(), appsSDKTools()} {
		for _, name := range []string{"webhook_routes_list", "webhook_route_create", "webhook_route_replace", "webhook_route_delete", "webhook_job_get"} {
			if !toolListContains(tools, name) {
				t.Fatalf("tool list does not advertise %q", name)
			}
		}
	}
	encodedSchema, _ := json.Marshal(webhookRouteInputSchema())
	for _, required := range []string{`"signature_version"`, `"max_skew_seconds"`, `"approval_mode"`, `"arguments"`, `"callback"`, `"writeOnly":true`} {
		if !containsSecret(string(encodedSchema), required) {
			t.Fatalf("MCP route schema is missing UI field %s: %s", required, encodedSchema)
		}
	}
	request := requestWithAuthClaims(httptest.NewRequest(http.MethodPost, "/mcp", nil), map[string]any{
		"scope": "gptadmin.read", "access_mode": accessModeReadonly,
	})
	for _, name := range []string{"webhook_routes_list", "webhook_job_get"} {
		if err := authorizeFacadeCall(request, name, nil); err != nil {
			t.Fatalf("read-only parity tool %q denied: %v", name, err)
		}
	}
	for _, name := range []string{"webhook_route_create", "webhook_route_replace", "webhook_route_delete"} {
		if err := authorizeFacadeCall(request, name, nil); err == nil {
			t.Fatalf("write parity tool %q allowed to read-only client", name)
		}
	}
}

func TestAdminWebhookJobEndpointUsesOperatorAuthentication(t *testing.T) {
	s := New(Config{CtlToken: "ctl"})
	s.mu.Lock()
	s.webhookJobs["job-admin"] = &webhookJob{ID: "job-admin", RouteID: "route", Status: "failed", Error: "safe failure"}
	s.mu.Unlock()

	request := httptest.NewRequest(http.MethodGet, "/admin/api/webhook-jobs/job-admin", nil)
	request.Header.Set("Authorization", "Bearer ctl")
	record := httptest.NewRecorder()
	s.Handler().ServeHTTP(record, request)
	if record.Code != http.StatusOK || !containsSecret(record.Body.String(), `"job_id":"job-admin"`) {
		t.Fatalf("admin job status=%d body=%s", record.Code, record.Body.String())
	}
}

func TestActionsOpenAPIAdvertisesWebhookManagementParity(t *testing.T) {
	s := New(Config{PublicOrigin: "https://hub.example"})
	request := httptest.NewRequest(http.MethodGet, "/actions/openapi.yaml", nil)
	record := httptest.NewRecorder()
	s.Handler().ServeHTTP(record, request)
	if record.Code != http.StatusOK {
		t.Fatalf("openapi status=%d body=%s", record.Code, record.Body.String())
	}
	for _, operationID := range []string{"listWebhookRoutes", "createWebhookRoute", "replaceWebhookRoute", "deleteWebhookRoute", "getAdminWebhookJob"} {
		if !containsSecret(record.Body.String(), "operationId: "+operationID) {
			t.Fatalf("OpenAPI does not advertise %s", operationID)
		}
	}
}

func TestWebhookRouteLifecycleIsCallableThroughMCP(t *testing.T) {
	s := New(Config{CtlToken: "ctl", WebhookConfigFile: filepath.Join(t.TempDir(), "webhooks.json")})
	created := postMCPRPC(t, s, `{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"webhook_route_create","arguments":{"route":{"id":"mcp-route","token":"mcp-write-only","action":{"kind":"mcp","target":"hub","tool":"status"}}}}}`)
	if containsSecret(string(mustJSON(t, created)), "mcp-write-only") {
		t.Fatalf("MCP create response exposed a route secret: %v", created)
	}
	s.mu.Lock()
	_, exists := s.webhookRoutes["mcp-route"]
	s.mu.Unlock()
	if !exists {
		t.Fatal("MCP create did not persist the route")
	}
	listed := postMCPRPC(t, s, `{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"webhook_routes_list","arguments":{}}}`)
	if !containsSecret(string(mustJSON(t, listed)), "mcp-route") || containsSecret(string(mustJSON(t, listed)), "mcp-write-only") {
		t.Fatalf("MCP list is incomplete or exposed a secret: %v", listed)
	}
}

func mustJSON(t *testing.T, value any) []byte {
	t.Helper()
	encoded, err := json.Marshal(value)
	if err != nil {
		t.Fatal(err)
	}
	return encoded
}

func containsSecret(value, needle string) bool {
	return len(needle) > 0 && len(value) >= len(needle) && stringContains(value, needle)
}

func stringContains(value, needle string) bool {
	for index := 0; index+len(needle) <= len(value); index++ {
		if value[index:index+len(needle)] == needle {
			return true
		}
	}
	return false
}

func anySlice(value any) []any {
	items, _ := value.([]any)
	if items != nil {
		return items
	}
	if typed, ok := value.([]webhookRouteSummary); ok {
		items = make([]any, len(typed))
		for index := range typed {
			items[index] = typed[index]
		}
	}
	return items
}

func toolListContains(tools []map[string]any, name string) bool {
	for _, tool := range tools {
		if tool["name"] == name {
			return true
		}
	}
	return false
}
