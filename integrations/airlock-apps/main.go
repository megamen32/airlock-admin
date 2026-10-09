package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"html/template"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
)

// Every uploaded app has its own non-secret manifest. Credentials stay in
// encrypted Airlock resources; requests use SDK callbacks, never direct HTTP.
//
//go:embed app.json page.html app.js
var files embed.FS

type binding struct {
	Slug      string   `json:"slug"`
	URL       string   `json:"url"`
	AuthMode  string   `json:"auth_mode"`
	Principal string   `json:"principal,omitempty"`
	AuthURL   string   `json:"auth_url,omitempty"`
	TokenURL  string   `json:"token_url,omitempty"`
	Scopes    []string `json:"scopes,omitempty"`
}
type operation struct {
	Tool     string         `json:"tool"`
	Title    string         `json:"title"`
	Args     map[string]any `json:"args"`
	Mutation bool           `json:"mutation,omitempty"`
}
type appConfig struct {
	Name       string      `json:"name"`
	Slug       string      `json:"slug"`
	AgentID    string      `json:"agent_id"`
	ProductURL string      `json:"product_url,omitempty"`
	Bindings   []binding   `json:"bindings"`
	Operations []operation `json:"operations"`
}
type callInput struct {
	Tool    string         `json:"tool"`
	Args    map[string]any `json:"args"`
	Confirm bool           `json:"confirm,omitempty"`
}
type application struct {
	agent  *agentsdk.Agent
	config appConfig
	mcp    map[string]*agentsdk.MCPHandle
}

func (c appConfig) bindingFor(principal string) (binding, error) {
	for _, b := range c.Bindings {
		if b.Principal == principal {
			return b, nil
		}
	}
	if len(c.Bindings) == 1 && c.Bindings[0].Principal == "" {
		return c.Bindings[0], nil
	}
	return binding{}, errors.New("Личное подключение для вашей учётной записи не настроено")
}

func newAgent() *agentsdk.Agent {
	var c appConfig
	data, _ := files.ReadFile("app.json")
	if err := json.Unmarshal(data, &c); err != nil {
		panic("invalid integration manifest")
	}
	return makeApplication(c).agent
}

func makeApplication(c appConfig) *application {
	a := agentsdk.New(agentsdk.Config{Description: c.Name + ": управление существующим сервисом через Airlock", Emoji: "🔐"})
	app := &application{agent: a, config: c, mcp: map[string]*agentsdk.MCPHandle{}}
	for _, b := range c.Bindings {
		app.mcp[b.Slug] = a.RegisterMCP(&agentsdk.MCP{Slug: b.Slug, Name: c.Name, URL: b.URL, AuthMode: agentsdk.MCPAuth(b.AuthMode), AuthURL: b.AuthURL, TokenURL: b.TokenURL, Scopes: b.Scopes})
	}
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Access: agentsdk.AccessAdmin, Description: "Управление " + c.Name, Handler: app.home})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/api/operations", Access: agentsdk.AccessAdmin, Description: "Доступные операции", Handler: app.operations})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/api/call", Access: agentsdk.AccessAdmin, Description: "Выполнить операцию в исходном сервисе", Handler: app.invoke})
	js, _ := files.ReadFile("app.js")
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: "app.js", ContentType: "text/javascript; charset=utf-8", Data: js})
	a.RegisterTool(tool.Typed[callInput, *agentsdk.MCPToolCallResponse]("service_read").Description("Read an allowlisted service operation. Mutations are available only in the authenticated app page with explicit confirmation.").Execute(func(ctx context.Context, in callInput) (*agentsdk.MCPToolCallResponse, error) {
		for _, op := range c.Operations {
			if op.Tool == in.Tool && op.Mutation {
				return nil, errors.New("Изменения требуют подтверждения в приложении")
			}
		}
		return app.call(ctx, in)
	}).Build(), agentsdk.AccessAdmin)
	return app
}

func requireAdmin(ctx context.Context) (string, error) {
	c := agentsdk.CallerFromContext(ctx)
	u, ok := c.User()
	if !ok || u.ID == "" || c.Access() != agentsdk.AccessAdmin {
		return "", errors.New("Требуется вход с правами администратора приложения")
	}
	return u.ID, nil
}

func (a *application) call(ctx context.Context, in callInput) (*agentsdk.MCPToolCallResponse, error) {
	principal, err := requireAdmin(ctx)
	if err != nil {
		return nil, err
	}
	b, err := a.config.bindingFor(principal)
	if err != nil {
		return nil, err
	}
	var selected *operation
	for i := range a.config.Operations {
		if a.config.Operations[i].Tool == in.Tool {
			selected = &a.config.Operations[i]
			break
		}
	}
	if selected == nil {
		return nil, errors.New("Операция отсутствует в контракте приложения")
	}
	if selected.Mutation && !in.Confirm {
		return nil, errors.New("Подтвердите точную операцию и её параметры")
	}
	ctx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()
	result, err := a.mcp[b.Slug].CallTool(ctx, in.Tool, in.Args)
	if err != nil {
		return nil, errors.New("Сервис недоступен или подключение требует авторизации; проверьте настройки Airlock")
	}
	if result.IsError {
		return nil, errors.New("Исходный сервис отклонил операцию; результат не подтверждён")
	}
	return result, nil
}

func (a *application) home(w http.ResponseWriter, r *http.Request) error {
	if _, err := requireAdmin(r.Context()); err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	page, _ := files.ReadFile("page.html")
	return template.Must(template.New("page").Parse(string(page))).Execute(w, a.config)
}
func (a *application) operations(w http.ResponseWriter, r *http.Request) error {
	if _, err := requireAdmin(r.Context()); err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(a.config.Operations)
}
func (a *application) invoke(w http.ResponseWriter, r *http.Request) error {
	w.Header().Set("Cache-Control", "no-store")
	if origin := r.Header.Get("Origin"); origin != "" {
		u, err := url.Parse(origin)
		// The native SubdomainProxy rewrites Host to the container. Its Rewrite
		// sets X-Forwarded-Host to the original public request host; the app is
		// reached only through the authenticated SDK host boundary.
		host := r.Header.Get("X-Forwarded-Host")
		if host == "" {
			host = r.Host
		}
		if err != nil || !strings.EqualFold(u.Host, host) || u.Scheme != "https" {
			http.Error(w, "Запрос с другого сайта отклонён", 403)
			return nil
		}
	}
	var in callInput
	d := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10))
	d.DisallowUnknownFields()
	if err := d.Decode(&in); err != nil {
		http.Error(w, "Некорректные параметры операции", 400)
		return nil
	}
	result, err := a.call(r.Context(), in)
	if err != nil {
		http.Error(w, err.Error(), 403)
		return nil
	}
	data, err := json.Marshal(result)
	if err != nil {
		return err
	}
	if len(data) > 2<<20 {
		http.Error(w, "Ответ слишком большой; сузьте запрос", 502)
		return nil
	}
	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(data)
	return err
}
func main() { newAgent().Serve() }
