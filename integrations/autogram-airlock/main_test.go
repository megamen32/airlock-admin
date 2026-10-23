package main

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"github.com/airlockrun/agentsdk/testutil"
	"github.com/airlockrun/agentsdk/wire"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func caller(id string) context.Context {
	return testutil.WithCaller(context.Background(), wire.Caller{Kind: "user", Access: wire.AccessUser, User: &wire.CallerUser{ID: id, PlatformMember: true}, Initiator: &wire.CallerUser{ID: id, PlatformMember: true}, Origin: wire.CallerOrigin{Interface: "http", Execution: "request"}})
}
func TestAdmission(t *testing.T) {
	for _, id := range []string{"5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864"} {
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
	a := &app{issue: func(context.Context, string) ([]byte, error) {
		calls++
		return []byte(`{"url":"https://new.auto-gram.ru/cabinet/handoff#code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expires_in":60}`), nil
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
			a := &app{issue: func(_ context.Context, actual string) ([]byte, error) {
				calls++
				if actual != id {
					t.Fatal("caller attribution changed")
				}
				return []byte(`{"url":"https://new.auto-gram.ru/cabinet/handoff#code=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","expires_in":60}`), nil
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
		a := &app{issue: func(context.Context, string) ([]byte, error) { return []byte(response), nil }}
		w := httptest.NewRecorder()
		_ = a.home(w, httptest.NewRequest("GET", appOrigin+"/", nil).WithContext(caller("5e438326-6339-4ac8-a328-59dae1d6241f")))
		if w.Code != 502 || strings.Contains(w.Body.String(), "<iframe") {
			t.Fatal("invalid handoff embedded")
		}
	}
}
