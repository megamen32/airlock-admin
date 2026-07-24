package hub

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestActivationTelemetryIsOptInAggregatedAndPersistent(t *testing.T) {
	configDir := t.TempDir()
	s := New(Config{ConfigDir: configDir, CtlToken: "ctl"})
	request := func(server *Server, method, path, body string) *httptest.ResponseRecorder {
		req := httptest.NewRequest(method, path, strings.NewReader(body))
		req.Header.Set("Authorization", "Bearer ctl")
		if body != "" {
			req.Header.Set("Content-Type", "application/json")
		}
		w := httptest.NewRecorder()
		server.Handler().ServeHTTP(w, req)
		return w
	}

	initial := request(s, http.MethodGet, "/admin/api/telemetry", "")
	if initial.Code != http.StatusOK || !strings.Contains(initial.Body.String(), `"enabled":false`) {
		t.Fatalf("initial telemetry status=%d body=%s", initial.Code, initial.Body.String())
	}
	if event := request(s, http.MethodPost, "/admin/api/telemetry/event", `{"event":"client_connected","token":"must-not-persist"}`); event.Code != http.StatusForbidden {
		t.Fatalf("disabled telemetry accepted event: status=%d body=%s", event.Code, event.Body.String())
	}
	enabled := request(s, http.MethodPut, "/admin/api/telemetry", `{"enabled":true}`)
	if enabled.Code != http.StatusOK || !strings.Contains(enabled.Body.String(), `"enabled":true`) {
		t.Fatalf("enable telemetry status=%d body=%s", enabled.Code, enabled.Body.String())
	}
	for _, eventName := range []string{"client_connected", "client_connected", "first_tool", "failure"} {
		event := request(s, http.MethodPost, "/admin/api/telemetry/event", `{"event":"`+eventName+`","args":"must-not-persist"}`)
		if event.Code != http.StatusAccepted {
			t.Fatalf("telemetry event %q status=%d body=%s", eventName, event.Code, event.Body.String())
		}
	}
	state := request(s, http.MethodGet, "/admin/api/telemetry", "")
	if !strings.Contains(state.Body.String(), `"client_connected":2`) || !strings.Contains(state.Body.String(), `"first_tool":1`) || !strings.Contains(state.Body.String(), `"failure":1`) {
		t.Fatalf("aggregated telemetry counters missing: %s", state.Body.String())
	}
	if strings.Contains(state.Body.String(), "must-not-persist") {
		t.Fatalf("telemetry response exposed event payload: %s", state.Body.String())
	}
	restarted := New(Config{ConfigDir: configDir, CtlToken: "ctl"})
	persisted := request(restarted, http.MethodGet, "/admin/api/telemetry", "")
	if persisted.Code != http.StatusOK || !strings.Contains(persisted.Body.String(), `"client_connected":2`) {
		t.Fatalf("telemetry did not survive restart: status=%d body=%s", persisted.Code, persisted.Body.String())
	}
}
