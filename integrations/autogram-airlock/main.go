package main

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
	"net/http"
	"net/url"
	"regexp"
	"time"
)

const appOrigin = "https://autogram-airlock.airlock.bezrabotnyi.com"
const audience = "airlock:autogram:cabinet:208"

var codePattern = regexp.MustCompile(`^[A-Za-z0-9_-]{32,256}$`)

func admitted(ctx context.Context) (string, error) {
	c := agentsdk.CallerFromContext(ctx)
	u, ok := c.User()
	if !ok || !u.PlatformMember || (c.Access() != agentsdk.AccessAdmin && c.Access() != agentsdk.AccessUser) {
		return "", errors.New("Требуется вход в Airlock")
	}
	switch u.ID {
	case "5e438326-6339-4ac8-a328-59dae1d6241f", "98daa037-a87d-49b1-ba07-cd9e6f451864":
		return u.ID, nil
	default:
		return "", errors.New("Доступ к кабинету не предоставлен")
	}
}
func validHandoff(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Host != "new.auto-gram.ru" || u.User != nil || u.Path != "/cabinet/handoff" || u.RawPath != "" || u.RawQuery != "" {
		return false
	}
	f, err := url.ParseQuery(u.Fragment)
	return err == nil && len(f) == 1 && len(f["code"]) == 1 && codePattern.MatchString(f.Get("code"))
}

type app struct {
	issue func(context.Context, string) ([]byte, error)
}

func (a *app) home(w http.ResponseWriter, r *http.Request) error {
	if _, err := admitted(r.Context()); err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; form-action 'self' https://new.auto-gram.ru; frame-ancestors 'self' https://airlock.bezrabotnyi.com; base-uri 'none'")
	_, err := w.Write([]byte(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Автограмм · AirLock</title><main><h1>Автограмм · AirLock</h1><p>Общий кабинет для Room Hacker и Олега.</p><form action="/open" method="post" target="_blank" rel="noopener noreferrer"><button type="submit">Открыть кабинет Автограмм</button></form></main></html>`))
	return err
}
func (a *app) open(w http.ResponseWriter, r *http.Request) error {
	id, err := admitted(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	if r.Method != "POST" || r.Header.Get("Origin") != appOrigin || r.Header.Get("Sec-Fetch-Site") == "cross-site" {
		http.Error(w, "Запрос с другого сайта отклонён", 403)
		return nil
	}
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	data, err := a.issue(ctx, id)
	if err != nil {
		http.Error(w, "Вход в Автограмм временно недоступен", 502)
		return nil
	}
	var out struct {
		URL     string `json:"url"`
		Expires int    `json:"expires_in"`
	}
	if json.Unmarshal(data, &out) != nil || !validHandoff(out.URL) || out.Expires <= 0 || out.Expires > 60 {
		http.Error(w, "Автограмм вернул некорректный ответ входа", 502)
		return nil
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	http.Redirect(w, r, out.URL, http.StatusSeeOther)
	return nil
}
func newAgent() *agentsdk.Agent {
	a := agentsdk.New(agentsdk.Config{Description: "Общий кабинет Автограмм AirLock", Emoji: "🔎"})
	mcp := a.RegisterMCP(&agentsdk.MCP{Slug: "autogram", Name: "Автограмм AirLock", URL: "https://new.auto-gram.ru/api/cabinet-mcp", AuthMode: agentsdk.MCPAuthToken, BindingMode: agentsdk.BindingShared})
	connection := a.RegisterConnection(&agentsdk.Connection{Slug: "handoff", Name: "Вход в Автограмм AirLock", Description: "Одноразовый вход в общий кабинет AirLock", BaseURL: "https://new.auto-gram.ru", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectBearer}, BindingMode: agentsdk.BindingShared})
	application := &app{issue: func(ctx context.Context, id string) ([]byte, error) {
		return connection.Request(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/api/cabinet-handoff/issue", Body: map[string]string{"audience": audience, "caller_id": id}})
	}}
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Access: agentsdk.AccessUser, Description: "Общий кабинет Автограмм", Handler: application.home})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/open", Access: agentsdk.AccessUser, Description: "Войти в общий кабинет Автограмм", Handler: application.open})
	a.RegisterTool(tool.Typed[struct{}, *agentsdk.MCPToolCallResponse]("cabinet_profile").Description("Прочитать профиль общего кабинета AirLock").Execute(func(ctx context.Context, _ struct{}) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		return mcp.CallTool(ctx, "cabinet_profile", map[string]any{})
	}).Build(), agentsdk.AccessUser)
	return a
}
func main() { newAgent().Serve() }
