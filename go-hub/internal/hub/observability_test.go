package hub

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequestTraceIDIsReturnedAndCorrelatesMCPAudit(t *testing.T) {
	s := New(Config{CtlToken: "ctl", DefaultTimeout: 1, PollMaxTimeout: 1})
	req := httptest.NewRequest(http.MethodPost, "/mcp", bytes.NewBufferString(`{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"demo","arguments":{}}}`))
	req.Header.Set("Authorization", "Bearer ctl")
	req.Header.Set("X-Request-ID", "trace-demo-123")
	w := httptest.NewRecorder()

	s.Handler().ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", w.Code, w.Body.String())
	}
	if got := w.Header().Get("X-Request-ID"); got != "trace-demo-123" {
		t.Fatalf("request id=%q, want trace-demo-123", got)
	}
	var response map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response["error"] != nil {
		t.Fatalf("unexpected MCP error: %v", response["error"])
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	for i := len(s.audit) - 1; i >= 0; i-- {
		if s.audit[i].Name != "tool_policy_decision" {
			continue
		}
		if got := s.audit[i].Fields["trace_id"]; got != "trace-demo-123" {
			t.Fatalf("audit trace_id=%v, want trace-demo-123", got)
		}
		return
	}
	t.Fatal("tool policy audit event was not recorded")
}

func TestRequestTraceIDFollowsQueuedMCPJobAndResultAudit(t *testing.T) {
	s := New(Config{CtlToken: "ctl", RelayAgentToken: "relay", DefaultTimeout: 1, PollMaxTimeout: 1})
	registerRelayAgent(t, s, "demo")

	req := httptest.NewRequest(http.MethodPost, "/mcp-relay/call", bytes.NewBufferString(`{"target":"demo","tool_name":"ping","arguments":{"value":"safe"},"background":true}`))
	req.Header.Set("Authorization", "Bearer ctl")
	req.Header.Set("X-Request-ID", "trace-job-456")
	w := httptest.NewRecorder()
	s.Handler().ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("queue status=%d body=%s", w.Code, w.Body.String())
	}
	var queued map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &queued); err != nil {
		t.Fatal(err)
	}
	jobID, _ := queued["job_id"].(string)
	if jobID == "" || queued["trace_id"] != "trace-job-456" {
		t.Fatalf("queued response=%v", queued)
	}

	poll := httptest.NewRequest(http.MethodGet, "/mcp-relay/poll/demo?timeout=1", nil)
	poll.Header.Set("Authorization", "Bearer relay")
	pollWriter := httptest.NewRecorder()
	s.Handler().ServeHTTP(pollWriter, poll)
	if pollWriter.Code != http.StatusOK {
		t.Fatalf("poll status=%d body=%s", pollWriter.Code, pollWriter.Body.String())
	}

	result := httptest.NewRequest(http.MethodPost, "/mcp-relay/result/demo", bytes.NewBufferString(`{"id":"`+jobID+`","ok":true,"result":{"ok":true}}`))
	result.Header.Set("Authorization", "Bearer relay")
	resultWriter := httptest.NewRecorder()
	s.Handler().ServeHTTP(resultWriter, result)
	if resultWriter.Code != http.StatusOK {
		t.Fatalf("result status=%d body=%s", resultWriter.Code, resultWriter.Body.String())
	}

	s.mu.Lock()
	defer s.mu.Unlock()
	seenEnqueue, seenResult := false, false
	for _, event := range s.audit {
		if event.Fields["trace_id"] != "trace-job-456" {
			continue
		}
		switch event.Name {
		case "mcp_enqueue":
			seenEnqueue = true
		case "mcp_result":
			seenResult = true
		}
	}
	if !seenEnqueue || !seenResult {
		t.Fatalf("trace was not retained across enqueue/result audit: enqueue=%v result=%v audit=%v", seenEnqueue, seenResult, s.audit)
	}
}
