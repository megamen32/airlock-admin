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
	a := agentsdk.New(agentsdk.Config{Description: "Wikibot объясняет техническое устройство Airlock по публичному коду GitHub; сайт — дополнительный источник."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "wikibot", Name: "Wikibot", Description: "Изолированный FAQ-бот с публичной базой знаний Airlock.", BaseURL: "https://api.wikibot.pro", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "Authorization"}, Headers: map[string]string{"Accept": "application/json"}, SetupInstructions: "Администратор сохраняет ключ Wikibot без Bearer. Бесплатные кредиты ограничены; оплаченные пополнения не используются.", Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("airlock_faq").Description("Показать на примере docker-compose.yml, какие образы БД и reverse proxy использует публичный Airlock, со ссылкой на файл. База знаний — снимок публичного GitHub airlockrun/airlock и официальный сайт; код в приоритете. Кэш10мин; бесплатные кредиты ограничены.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. Для описания устройства Airlock вызови airlock_faq и используй только настоящий ответ Wikibot. Приоритет — публичные исходники GitHub, сайт — дополнительный контекст. Не путай публичную редакцию с приватным Airlock Internal. Это фиксированный демо-вопрос по публичной базе знаний, не произвольный чат с ботом. Если ready=false, сообщи недоступность. Бесплатный тариф использует ограниченные welcome-кредиты, не обещай бессрочную доступность. Не утверждай, что человек-оператор получил сообщение."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Ответы об Airlock — Wikibot"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Спросить Wikibot об Airlock"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
