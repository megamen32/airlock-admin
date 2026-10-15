package main

import (
	"agent/views"
	"context"
	"encoding/json"
	"github.com/airlockrun/agentsdk"
	"net/http"
	"time"
)

func main() {
	a := agentsdk.New(agentsdk.Config{Description: "Подготовка read-only подключения Metrius OAuth; публичный доступ ещё не открыт."})
	m := a.RegisterMCP(&agentsdk.MCP{Slug: "metrius", Name: "Metrius", URL: "https://metrius.pro/mcp", AuthMode: agentsdk.MCPAuthOAuthDiscovery, Scopes: []string{"channels:read", "metrics:read", "limits:read"}, Access: agentsdk.AccessAdmin})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Access: agentsdk.AccessAdmin, Handler: func(w http.ResponseWriter, r *http.Request) error {
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		_, e := w.Write([]byte("Metrius: настройка чтения через OAuth. Демо пока не опубликовано."))
		return e
	}})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/probe", Access: agentsdk.AccessAdmin, Handler: func(w http.ResponseWriter, r *http.Request) error {
		ctx, cancel := context.WithTimeout(r.Context(), 20*time.Second)
		defer cancel()
		out, e := m.CallTool(ctx, "list_channels", map[string]any{})
		w.Header().Set("Content-Type", "application/json")
		if e != nil {
			w.WriteHeader(502)
			return json.NewEncoder(w).Encode(map[string]any{"ready": false})
		}
		return json.NewEncoder(w).Encode(out)
	}})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css", Data: views.AppCSS})
	a.Serve()
}
