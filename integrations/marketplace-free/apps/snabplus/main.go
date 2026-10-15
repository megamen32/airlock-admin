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
	a := agentsdk.New(agentsdk.Config{Description: "Демонстрационные закупки SNABZHENETS+: чтение реальной заявки из отдельного пробного портала без отправки поставщикам."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "snabplus", Name: "SNABZHENETS+", BaseURL: "https://airlock-demo.snabplus.com", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "X-API-Key"}, Headers: map[string]string{"Accept": "application/json"}, Description: "Только чтение закупок отдельного демонстрационного портала.", SetupInstructions: "Администратор сохраняет ключ с единственным scope purchase_requisitions.read. Пробный доступ портала24часа, истекает16октября2026; карта и продление не подключены. Гостям только procurement_summary.", Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("procurement_summary").Description("Прочитать демонстрационные закупки из настоящего API SNABZHENETS+: номер, описание, статус. Не отправляет заявки, не закупает товары и не меняет данные.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. На вопросы о закупках/SNABZHENETS+ вызови procurement_summary. Используй только его данные. Запись AIRLOCK-DEMO-001 создана специально для показа API; реальная покупка не планируется. status draft означает черновик, заказ поставщику не отправлялся. plannedTotal=null не означает нулевую стоимость; сумму не придумывай. Если ready=false, объясни проблему без выдуманных закупок и нулей. Доступ портала пробный24часа до16октября2026; не называй его бессрочно бесплатным. Запись, изменения, контакты, платежи и отправка поставщикам закрыты."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Демонстрационные закупки"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Прочитать закупки SNABZHENETS+"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
