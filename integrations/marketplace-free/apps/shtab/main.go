package main

import (
	"agent/handlers"
	"agent/summary"
	"agent/views"
	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
)

func main() { newAgent().Serve() }
func newAgent() *agentsdk.Agent {
	a := agentsdk.New(agentsdk.Config{Description: "Сводка незавершённых задач отдельной демо-команды Shtab через настоящий MCP."})
	m := a.RegisterMCP(&agentsdk.MCP{Slug: "shtab", Name: "Shtab", Description: "Только фиксированная статистика задач демо-команды", URL: "https://my.shtab.app/api/mcp/rpc", AuthMode: agentsdk.MCPAuthToken})
	s := summary.New(m, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("team_tasks").Description("Получить реальное число незавершённых задач демо-команды Shtab. Не список и не изменение задач.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. При вопросах о задачах вызови team_tasks и опирайся только на настоящий результат. Инструмент показывает количество незавершённых задач, а не их названия. Не придумывай названия или статистику. Изменение задач не поддерживается. Указывай время актуальности кэша."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Сводка задач Shtab"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Прочитать реальное количество задач"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
