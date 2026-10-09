package main

import (
	"context"
	"embed"
	"encoding/json"
	"errors"
	"time"

	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
)

// Every uploaded app has its own non-secret manifest. Credentials stay in
// encrypted Airlock resources; requests use SDK callbacks, never direct HTTP.
//
//go:embed app.json
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
	UIURL      string      `json:"ui_url,omitempty"`
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
	uiKey  *agentsdk.EnvVarHandle
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
	app.uiKey = a.RegisterEnvVar(&agentsdk.EnvVar{Slug: "ui_gateway_key", Description: "Write-only key for caller-bound original product UI access", Secret: true})
	// Go's native GET route also serves HEAD; a separate catch-all HEAD
	// conflicts with the SDK's more specific GET asset routes.
	for _, method := range []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"} {
		a.RegisterRoute(&agentsdk.Route{Method: method, Path: "/{path...}", Access: agentsdk.AccessAdmin, Description: "Existing " + c.Name + " interface", Handler: app.productUI})
	}
	a.RegisterTool(tool.Typed[callInput, *agentsdk.MCPToolCallResponse]("service_read").Description("Read an allowlisted service operation; changes use the existing product interface.").Execute(func(ctx context.Context, in callInput) (*agentsdk.MCPToolCallResponse, error) {
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
	if err := a.ensureRuntimeBudget(ctx); err != nil {
		return nil, err
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

func main() { newAgent().Serve() }
