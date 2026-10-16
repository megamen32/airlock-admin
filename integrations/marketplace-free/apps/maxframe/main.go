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
	a := agentsdk.New(agentsdk.Config{Description: "Каталог и статистика публичных MAX-каналов из MaxFrame."})
	c := a.RegisterConnection(&agentsdk.Connection{Slug: "maxframe", Name: "MaxFrame", Description: "Только чтение публичного каталога и статистики MAX-каналов.", BaseURL: "https://maxframe.ru", AuthMode: agentsdk.ConnectionAuthToken, AuthInjection: agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "X-Api-Key"}, Headers: map[string]string{"Accept": "application/json"}, SetupInstructions: "Администратор сохраняет выделенный тестовый ключ MaxFrame. Проверить успешный ответ API до открытия гостям. Платные тарифы не подключать.", Access: agentsdk.AccessAdmin})
	s := summary.New(c, a.DB())
	h := handlers.New(s)
	a.RegisterTool(tool.Typed[summary.Input, summary.Result]("maxframe_snapshot").Description("Статистика публичного MAX-канала по полной ссылке https://max.ru/имя. Без ссылки — первые пять каналов каталога MaxFrame; это не поиск по теме и не рейтинг. Только чтение.").Execute(s.Tool).Build(), agentsdk.AccessUser)
	a.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. По вопросам о MAX-каналах и их статистике вызови maxframe_snapshot. Для конкретного канала передай публичную ссылку. Без ссылки можно показать первые пять записей каталога — не называй их тематической подборкой, рейтингом или результатами поиска. Используй только фактические данные, не заменяй отсутствующие метрики нулями, не придумывай даты или подписчиков. При ready=false объясни причину, не утверждай, что данные получены. Нет отправки сообщений, изменения каналов, покупки рекламы или выгрузки всей базы."})
	a.RegisterRoute(&agentsdk.Route{Method: "GET", Path: "/", Handler: h.Home, Access: agentsdk.AccessUser, Description: "Статистика MAX-каналов — MaxFrame"})
	a.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/summary", Handler: h.Refresh, Access: agentsdk.AccessUser, Description: "Получить статистику канала или начало каталога"})
	a.RegisterStaticAsset(&agentsdk.StaticAsset{Name: views.AppCSSName, ContentType: "text/css; charset=utf-8", Data: views.AppCSS})
	return a
}
