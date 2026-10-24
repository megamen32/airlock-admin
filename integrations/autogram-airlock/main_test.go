package main

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/agentsdk/testutil"
	"github.com/airlockrun/agentsdk/wire"
	"github.com/airlockrun/goai/tool"
	"net/http"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"
	"time"
)

func TestLandingHandoffAllowsHostBudgetWithoutRetry(t *testing.T) {
	calls := 0
	a := &app{issue: func(ctx context.Context, request handoffRequest) ([]byte, error) {
		calls++
		deadline, ok := ctx.Deadline()
		remaining := time.Until(deadline)
		// The existing host transport permits 30s. Observed successful AFC
		// responses took 28s; the wrapper must not cancel that valid request at 15s.
		if !ok || remaining < 30*time.Second || remaining > 35*time.Second {
			t.Fatalf("handoff budget must cover bounded host transport: %v", remaining)
		}
		return json.Marshal(handoffResponse{URL: "https://new.auto-gram.ru/cabinet/handoff#code=" + strings.Repeat("a", 40), Expires: 60, BrowserProfile: request.BrowserProfile})
	}}
	w := httptest.NewRecorder()
	_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9")))
	if w.Code != http.StatusOK || calls != 1 {
		t.Fatalf("one successful issue required: status=%d calls=%d", w.Code, calls)
	}
}

func TestHandoffPreservesCallerDeadlineAndCancellation(t *testing.T) {
	parent, cancel := context.WithTimeout(caller("a6bd0a81-73c6-4478-911d-9ef53779a9f9"), time.Second)
	defer cancel()
	expected, _ := parent.Deadline()
	calls := 0
	a := &app{issue: func(ctx context.Context, _ handoffRequest) ([]byte, error) {
		calls++
		if got, _ := ctx.Deadline(); !got.Equal(expected) {
			t.Fatal("caller deadline must remain authoritative")
		}
		cancel()
		if ctx.Err() != context.Canceled {
			t.Fatal("caller cancellation was detached")
		}
		return nil, ctx.Err()
	}}
	w := httptest.NewRecorder()
	_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(parent))
	if w.Code != http.StatusBadGateway || calls != 1 {
		t.Fatalf("canceled issue must not retry: status=%d calls=%d", w.Code, calls)
	}
}

func caller(id string) context.Context {
	return testutil.WithCaller(context.Background(), wire.Caller{Kind: "user", Access: wire.AccessUser, User: &wire.CallerUser{ID: id, PlatformMember: true}, Initiator: &wire.CallerUser{ID: id, PlatformMember: true}, Origin: wire.CallerOrigin{Interface: "http", Execution: "request"}})
}
func TestAdmission(t *testing.T) {
	for _, id := range []string{"5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864", "a6bd0a81-73c6-4478-911d-9ef53779a9f9"} {
		if _, err := admitted(caller(id)); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := admitted(caller("third")); err == nil {
		t.Fatal("third admitted")
	}
}
func TestHandoffValidation(t *testing.T) {
	good := "https://new.auto-gram.ru/cabinet/handoff#code=" + strings.Repeat("a", 40)
	if !validHandoff(good) {
		t.Fatal("valid rejected")
	}
	for _, raw := range []string{"https://evil.test/cabinet/handoff#code=" + strings.Repeat("a", 40), good + "&extra=1", strings.Replace(good, "https:", "http:", 1), strings.Replace(good, "/cabinet/handoff", "/other", 1), good + "&code=other"} {
		if validHandoff(raw) {
			t.Fatal("unsafe accepted")
		}
	}
}
func TestUserLandingAndOrigin(t *testing.T) {
	calls := 0
	a := &app{issue: func(_ context.Context, request handoffRequest) ([]byte, error) {
		calls++
		return json.Marshal(handoffResponse{URL: "https://new.auto-gram.ru/cabinet/handoff#code=" + strings.Repeat("a", 40), Expires: 60, BrowserProfile: request.BrowserProfile})
	}}
	ctx := caller("98daa037-a87d-49b1-ba07-cd9e6f451864")
	r := httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(ctx)
	w := httptest.NewRecorder()
	_ = a.home(w, r)
	if !strings.Contains(w.Header().Get("Content-Security-Policy"), "frame-ancestors 'self' https://*.bezrabotnyi.com") {
		t.Fatal("native Airlock iframe blocked")
	}
	if w.Header().Get("Referrer-Policy") != "same-origin" || strings.Contains(w.Body.String(), "noreferrer") {
		t.Fatal("same-origin POST must retain its Origin header")
	}
	if !strings.Contains(w.Body.String(), `<iframe`) || !strings.Contains(w.Body.String(), `src="https://new.auto-gram.ru/cabinet/handoff#code=`) || !strings.Contains(w.Header().Get("Content-Security-Policy"), "frame-src https://new.auto-gram.ru") {
		t.Fatal("cabinet must open inline through the one-use handoff")
	}
	if strings.Contains(w.Body.String(), `<button`) || strings.Contains(w.Body.String(), `target="_blank"`) {
		t.Fatal("inline cabinet must not require a launch button or another tab")
	}
	if w.Code != 200 || calls != 1 {
		t.Fatal("authorized landing must issue exactly one handoff")
	}
	r = httptest.NewRequest("POST", appOrigin+"/open", nil).WithContext(ctx)
	w = httptest.NewRecorder()
	_ = a.open(w, r)
	if w.Code != 403 || calls != 1 {
		t.Fatal("origin bypass")
	}
	r.Header.Set("Origin", appOrigin)
	w = httptest.NewRecorder()
	_ = a.open(w, r)
	if w.Code != http.StatusSeeOther || calls != 2 {
		t.Fatal("open failed")
	}
	r = r.WithContext(caller("third"))
	w = httptest.NewRecorder()
	_ = a.open(w, r)
	if w.Code != 403 || calls != 2 {
		t.Fatal("third effect")
	}
}

func TestInlineHandoffBoundary(t *testing.T) {
	for _, id := range []string{"5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864", "third"} {
		t.Run(id, func(t *testing.T) {
			calls := 0
			a := &app{issue: func(_ context.Context, actual handoffRequest) ([]byte, error) {
				calls++
				if actual.CallerID != id || actual.Audience != audience || actual.BrowserProfile != embedProfile {
					t.Fatal("caller attribution changed")
				}
				return []byte(`{"url":"https://new.auto-gram.ru/cabinet/handoff#code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expires_in":60,"browser_profile":"airlock_embed"}`), nil
			}}
			w := httptest.NewRecorder()
			_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(caller(id)))
			if id == "third" {
				if w.Code != 403 || calls != 0 {
					t.Fatal("unauthorized handoff issued")
				}
				return
			}
			if w.Code != 200 || calls != 1 || w.Header().Get("Cache-Control") != "no-store" {
				t.Fatal("inline handoff missing or cacheable")
			}
			body := w.Body.String()
			start := strings.Index(body, "<style>") + len("<style>")
			end := strings.Index(body, "</style>")
			if start < len("<style>") || end < start {
				t.Fatal("missing viewport style")
			}
			hash := sha256.Sum256([]byte(body[start:end]))
			if !strings.Contains(w.Header().Get("Content-Security-Policy"), "'sha256-"+base64.StdEncoding.EncodeToString(hash[:])+"'") {
				t.Fatal("viewport style blocked by CSP")
			}
		})
	}
	for _, response := range []string{`{"url":"https://evil.test/","expires_in":60}`, `{"url":"https://new.auto-gram.ru/cabinet/handoff#code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expires_in":61}`} {
		a := &app{issue: func(context.Context, handoffRequest) ([]byte, error) { return []byte(response), nil }}
		w := httptest.NewRecorder()
		_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(caller("5e438326-6339-4ac8-a328-59dae1d6241f")))
		if w.Code != 502 || strings.Contains(w.Body.String(), "<iframe") {
			t.Fatal("invalid handoff embedded")
		}
	}
}

func TestInlineRequiresConfirmedEmbedProfile(t *testing.T) {
	for _, profile := range []string{"", "top_level", "unknown"} {
		a := &app{issue: func(context.Context, handoffRequest) ([]byte, error) {
			return []byte(`{"url":"https://new.auto-gram.ru/cabinet/handoff#code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expires_in":60,"browser_profile":"` + profile + `"}`), nil
		}}
		w := httptest.NewRecorder()
		_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(caller("5e438326-6339-4ac8-a328-59dae1d6241f")))
		if w.Code != 502 || strings.Contains(w.Body.String(), "<iframe") {
			t.Fatalf("unconfirmed embed profile %q accepted", profile)
		}
	}
}

func TestLegacyHandoffKeepsTopLevelProfile(t *testing.T) {
	for _, echoed := range []string{"", "top_level"} {
		a := &app{issue: func(_ context.Context, request handoffRequest) ([]byte, error) {
			wire, err := json.Marshal(request)
			if err != nil {
				t.Fatal(err)
			}
			if request.Audience != audience || request.CallerID != "5e438326-6339-4ac8-a328-59dae1d6241f" || strings.Contains(string(wire), "browser_profile") {
				t.Fatal("legacy request must omit embed profile")
			}
			return json.Marshal(handoffResponse{URL: "https://new.auto-gram.ru/cabinet/handoff#code=" + strings.Repeat("a", 40), Expires: 60, BrowserProfile: echoed})
		}}
		r := httptest.NewRequest("POST", appOrigin+"/open", nil).WithContext(caller("5e438326-6339-4ac8-a328-59dae1d6241f"))
		r.Header.Set("Origin", appOrigin)
		w := httptest.NewRecorder()
		_ = a.open(w, r)
		if w.Code != http.StatusSeeOther {
			t.Fatal("top-level compatibility failed")
		}
	}
}

func TestDraftReadManifest(t *testing.T) {
	raw, err := json.Marshal(newAgent().Manifest())
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{"list_source_unit_drafts", "get_source_unit_draft"} {
		if !strings.Contains(string(raw), `"name":"`+name+`"`) {
			t.Fatalf("missing native READ %s", name)
		}
	}
}

func TestDraftReadCallerAndArguments(t *testing.T) {
	for _, tc := range []struct {
		name, input string
		build       func(func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool
	}{
		{"list_source_unit_drafts", `{"plan_project_id":"I001","source_unit_id":"airlockplan:I001:/project/contact","status":"ready","limit":5}`, draftListTool},
		{"get_source_unit_draft", `{"draft_id":"draft_123"}`, draftGetTool},
	} {
		t.Run(tc.name, func(t *testing.T) {
			calls := 0
			read := tc.build(func(_ context.Context, name string, args any) (*agentsdk.MCPToolCallResponse, error) {
				calls++
				raw, _ := json.Marshal(args)
				var got, want any
				_ = json.Unmarshal(raw, &got)
				_ = json.Unmarshal([]byte(tc.input), &want)
				if name != tc.name || !reflect.DeepEqual(got, want) {
					t.Fatalf("forward changed: %s %s", name, raw)
				}
				return &agentsdk.MCPToolCallResponse{}, nil
			})
			if _, err := read.Execute(caller("third"), json.RawMessage(tc.input), tool.CallOptions{}); err == nil || calls != 0 {
				t.Fatal("denied caller reached backend")
			}
			for _, id := range []string{"5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864"} {
				if _, err := read.Execute(caller(id), json.RawMessage(tc.input), tool.CallOptions{}); err != nil {
					t.Fatal(err)
				}
			}
			if calls != 2 {
				t.Fatal(calls)
			}
		})
	}
}

func TestDraftReadSchemaAndDefaults(t *testing.T) {
	list := draftListTool(func(_ context.Context, _ string, args any) (*agentsdk.MCPToolCallResponse, error) {
		raw, _ := json.Marshal(args)
		if string(raw) != "{}" {
			t.Fatalf("backend defaults overridden: %s", raw)
		}
		return &agentsdk.MCPToolCallResponse{}, nil
	})
	if _, err := list.Execute(caller("98daa037-a87d-49b1-ba07-cd9e6f451864"), json.RawMessage(`{}`), tool.CallOptions{}); err != nil {
		t.Fatal(err)
	}
	var schema struct {
		Properties map[string]map[string]any `json:"properties"`
		Required   []string                  `json:"required"`
	}
	if err := json.Unmarshal(list.InputSchema, &schema); err != nil {
		t.Fatal(err)
	}
	if len(schema.Required) != 0 || schema.Properties["limit"]["minimum"] != float64(1) || schema.Properties["limit"]["maximum"] != float64(100) {
		t.Fatalf("list schema mismatch: %s", list.InputSchema)
	}
	get := draftGetTool(nil)
	if err := json.Unmarshal(get.InputSchema, &schema); err != nil {
		t.Fatal(err)
	}
	if len(schema.Required) != 1 || schema.Required[0] != "draft_id" {
		t.Fatalf("get schema mismatch: %s", get.InputSchema)
	}
}
