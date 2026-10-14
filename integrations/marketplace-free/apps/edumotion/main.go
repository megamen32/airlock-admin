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
	a := agentsdk.New(agentsdk.Config{Description: "Каталог опубликованных учебных курсов демо-организации Edumotion через настоящий API."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "edumotion", Name: "Edumotion", Description: "Read-only каталог опубликованных курсов отдельной демо-организации.", BaseURL: "https://api.edumotion.ru", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "X-Api-Key"}, Headers: map[string]string{"Accept": "application/json"}, SetupInstructions: "Администратор сохраняет API-ключ организации Edumotion в encrypted credential. Пробный тариф14дней с15.10.2026, без карты. Гости используют только training_catalog.", Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("training_catalog").Description("Прочитать официальный каталог опубликованных курсов Edumotion. Только реальные названия и общее количество; без персональных данных и назначения обучения.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. На вопросы об обучении или курсах вызови training_catalog и используй только его результат. Пустой каталог новой демо-организации — настоящий результат, не придумывай курсы. Если ready=false, не называй количество. Укажи источник Edumotion и время кэша. Это14-дневный пробный API-доступ, не бессрочно бесплатный тариф. Создание курсов, назначение обучения и чтение пользователей не доступны гостям."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Каталог учебных курсов Edumotion"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Прочитать опубликованные курсы"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
