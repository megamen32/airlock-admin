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
	a := agentsdk.New(agentsdk.Config{Description: "Учебное оборудование отдельного пространства ToolKeeper через настоящий API."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "toolkeeper", Name: "ToolKeeper", Description: "Только чтение учебного оборудования отдельного пространства ToolKeeper.", BaseURL: "https://toolkeeper.io", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectBearer}, Headers: map[string]string{"Accept": "application/json"}, SetupInstructions: "Администратор сохраняет отдельный API-ключ с items:read и workspaces:read, ограниченный учебным пространством. Пробное демо до 22 октября 2026 года, без оплаты. Гости используют только equipment_catalog.", Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("equipment_catalog").Description("Показать настоящий список учебных инструментов ToolKeeper: названия, статусы и ответственного. Только чтение отдельного демо-пространства.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. На вопросы об оборудовании, инструментах, имуществе и ответственном вызови equipment_catalog. Используй только его фактические данные: количество, названия, статусы, ответственных. Это два учебных инструмента отдельного демо-пространства, а не имущество реальной компании. При ready=false объясни ограничение, не выдумывай результат. Доступ только на чтение; передачи, удаление, изменение имущества и сотрудников не выполняются. Пробный доступ до 22 октября 2026 года. Веб-форма: https://d88-toolkeeper-equipment.demo.airlockrun.ru/."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Учебное оборудование — ToolKeeper"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Показать учебное оборудование"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
