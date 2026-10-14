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
	a := agentsdk.New(agentsdk.Config{Description: "Чтение каталога и статуса API отдельной демо-кампании Priceva. Пока API не разрешит чтение, цены не показываются."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "priceva", Name: "Priceva", Description: "Демо-кампания мониторинга цен, только фиксированные методы чтения", BaseURL: "https://api.priceva.com", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "Apikey"}, Headers: map[string]string{"Content-Type": "application/json", "Accept": "application/json"}, Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("price_monitor").Description("Проверить реальный доступ Priceva и число товаров/источников/отчётов. Никогда не изменяет цены и не выдаёт придуманные данные.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. На запрос о Priceva вызови price_monitor. Если ready=false, честно скажи, что API ещё не разрешил чтение и цены не получены. Не придумывай товары, цены или дату проверки. Инструмент пока возвращает только реальные размеры каталога, источников и отчётов; цены будут добавлены после проверки настоящей структуры ответа. Изменение цен и платные действия не поддерживаются."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Статус чтения данных Priceva"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Получить реальный ответ API Priceva"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
