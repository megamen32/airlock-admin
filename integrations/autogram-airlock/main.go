package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
	"html"
	"net/http"
	"net/url"
	"regexp"
	"time"
)

const appOrigin = "https://autogram-airlock.airlock.bezrabotnyi.com"
const audience = "airlock:autogram:cabinet:208"
const embedProfile = "airlock_embed"

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
	issue func(context.Context, handoffRequest) ([]byte, error)
}

type handoffRequest struct {
	Audience       string `json:"audience"`
	CallerID       string `json:"caller_id"`
	BrowserProfile string `json:"browser_profile,omitempty"`
}

type handoffResponse struct {
	URL            string `json:"url"`
	Expires        int    `json:"expires_in"`
	BrowserProfile string `json:"browser_profile"`
}

func (a *app) home(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Cache-Control", "no-store")
	id, err := admitted(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	handoffURL, err := a.handoff(r.Context(), id, embedProfile)
	if err != nil {
		http.Error(w, err.Error(), 502)
		return nil
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Referrer-Policy", "same-origin")
	w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-src https://new.auto-gram.ru; style-src 'sha256-HSTRxTwnYLlrdNVtud5mZTo9wGQXOred7C9RQuDL3kY='; frame-ancestors 'self' https://*.bezrabotnyi.com; base-uri 'none'; form-action 'none'")
	_, err = fmt.Fprintf(w, `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="same-origin"><title>Автограмм · AirLock</title><style>html,body{height:100%%;margin:0}body{display:flex;flex-direction:column;font:16px system-ui,sans-serif}nav{display:flex;align-items:center;gap:16px;padding:10px 14px;background:#f5f6fa;border-bottom:1px solid #d6dbe5}nav a{font-weight:700;color:#174ea6}nav span{font-size:13px;color:#454c59}iframe{display:block;width:100%%;flex:1;min-height:0;border:0}</style><nav aria-label="Разделы кабинета"><a href="https://new.auto-gram.ru/clients?cabinet=208#source-unit-drafts" target="autogram-cabinet">Черновики</a><span>Сохранённые тексты · без отправки</span></nav><iframe name="autogram-cabinet" title="Кабинет Автограмм AirLock" src="%s" referrerpolicy="same-origin"></iframe></html>`, html.EscapeString(handoffURL))
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
	handoffURL, err := a.handoff(r.Context(), id, "")
	if err != nil {
		http.Error(w, err.Error(), 502)
		return nil
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Referrer-Policy", "no-referrer")
	http.Redirect(w, r, handoffURL, http.StatusSeeOther)
	return nil
}

func (a *app) handoff(ctx context.Context, id, profile string) (string, error) {
	ctx, cancel := context.WithTimeout(ctx, 15*time.Second)
	defer cancel()
	data, err := a.issue(ctx, handoffRequest{Audience: audience, CallerID: id, BrowserProfile: profile})
	if err != nil {
		return "", errors.New("Вход в Автограмм временно недоступен")
	}
	var out handoffResponse
	if json.Unmarshal(data, &out) != nil || !validHandoff(out.URL) || out.Expires <= 0 || out.Expires > 60 {
		return "", errors.New("Автограмм вернул некорректный ответ входа")
	}
	if profile == embedProfile && out.BrowserProfile != embedProfile {
		return "", errors.New("Встроенный вход в Автограмм ещё не готов. Повторите после обновления сервиса.")
	}
	if profile == "" && out.BrowserProfile != "" && out.BrowserProfile != "top_level" {
		return "", errors.New("Автограмм вернул некорректный профиль входа")
	}
	return out.URL, nil
}

// Inputs mirror the owner-scoped AFC READ contract; omitted fields retain backend defaults.
type draftListRequest struct {
	ProjectKey    string `json:"project_key,omitempty" pattern:"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"`
	PlanProjectID string `json:"plan_project_id,omitempty" pattern:"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"`
	SourceUnitID  string `json:"source_unit_id,omitempty" pattern:"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,511}$"`
	Status        string `json:"status,omitempty" enum:"generating,ready,edited,cancelled,failed,unknown"`
	AfterDraftID  string `json:"after_draft_id,omitempty" pattern:"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"`
	Limit         *int   `json:"limit,omitempty" minimum:"1" maximum:"100"`
}
type draftGetRequest struct {
	DraftID string `json:"draft_id" pattern:"^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$"`
}

func draftListTool(call func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool {
	return tool.Typed[draftListRequest, *agentsdk.MCPToolCallResponse]("list_source_unit_drafts").Description("Прочитать сохранённые несендящие черновики общего кабинета; модель не запускается").Execute(func(ctx context.Context, in draftListRequest) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		return call(ctx, "list_source_unit_drafts", in)
	}).Build()
}
func draftGetTool(call func(context.Context, string, any) (*agentsdk.MCPToolCallResponse, error)) tool.Tool {
	return tool.Typed[draftGetRequest, *agentsdk.MCPToolCallResponse]("get_source_unit_draft").Description("Прочитать один сохранённый черновик общего кабинета по draft_id").Execute(func(ctx context.Context, in draftGetRequest) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		return call(ctx, "get_source_unit_draft", in)
	}).Build()
}

func newAgent() *agentsdk.Agent {
	a := agentsdk.New(agentsdk.Config{Description: "Общий кабинет Автограмм AirLock", Emoji: "🔎"})
	mcp := a.RegisterMCP(&agentsdk.MCP{Slug: "autogram", Name: "Автограмм AirLock", URL: "https://new.auto-gram.ru/api/cabinet-mcp", AuthMode: agentsdk.MCPAuthToken, BindingMode: agentsdk.BindingShared})
	connection := a.RegisterConnection(&agentsdk.Connection{Slug: "handoff", Name: "Вход в Автограмм AirLock", Description: "Одноразовый вход в общий кабинет AirLock", BaseURL: "https://new.auto-gram.ru", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectBearer}, BindingMode: agentsdk.BindingShared})
	application := &app{issue: func(ctx context.Context, request handoffRequest) ([]byte, error) {
		return connection.Request(ctx, agentsdk.RequestOpts{Method: "POST", Path: "/api/cabinet-handoff/issue", Body: request})
	}}
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Access: agentsdk.AccessUser, Description: "Общий кабинет Автограмм", Handler: application.home})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/open", Access: agentsdk.AccessUser, Description: "Войти в общий кабинет Автограмм", Handler: application.open})
	a.RegisterTool(tool.Typed[struct{}, *agentsdk.MCPToolCallResponse]("cabinet_profile").Description("Прочитать профиль общего кабинета AirLock").Execute(func(ctx context.Context, _ struct{}) (*agentsdk.MCPToolCallResponse, error) {
		if _, err := admitted(ctx); err != nil {
			return nil, err
		}
		return mcp.CallTool(ctx, "cabinet_profile", map[string]any{})
	}).Build(), agentsdk.AccessUser)
	a.RegisterTool(draftListTool(mcp.CallTool), agentsdk.AccessUser)
	a.RegisterTool(draftGetTool(mcp.CallTool), agentsdk.AccessUser)
	return a
}
func main() { newAgent().Serve() }
