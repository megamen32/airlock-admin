package main

import (
	"agent/company"
	"agent/handlers"
	"agent/views"

	"github.com/airlockrun/agentsdk"
	"github.com/airlockrun/goai/tool"
)

func main() {
	newAgent().Serve()
}

// newAgent defines the complete agent and wires late-bound SDK handles into its
// dependencies. It must not read runtime environment, query the database, make
// network calls, or start goroutines: Airlock also invokes this definition
// offline to obtain the manifest. agenttest.New starts the returned agent before
// tests use Agent.DB() or Agent.Handler(). Keep this function separate from main.
func newAgent() *agentsdk.Agent {
	agent := agentsdk.New(agentsdk.Config{
		Description: "Проверка российских компаний по ИНН или ОГРН через DaData.",
	})
	dadata := agent.RegisterConnection(&agentsdk.Connection{
		Slug: "dadata", Name: "DaData", Description: "Бесплатный поиск организации по ИНН или ОГРН через официальный API DaData.",
		BaseURL: "https://suggestions.dadata.ru", AuthMode: agentsdk.ConnectionAuthToken,
		AuthInjection:     agentsdk.AuthInjection{Type: agentsdk.AuthInjectAPIKey, Name: "Authorization"},
		Headers:           map[string]string{"Content-Type": "application/json", "Accept": "application/json"},
		SetupInstructions: "Администратор сохраняет полное значение Token <API-ключ> в encrypted credential. Гости используют только find_company.",
		LLMHint:           "Используй только бесплатный поиск компании по ИНН/ОГРН через find_company; произвольные запросы не поддерживаются.",
		Access:            agentsdk.AccessAdmin,
	})
	service := company.NewService(dadata, agent.DB())
	tools := company.NewTools(service)
	pages := handlers.New(service)
	agent.RegisterTool(tool.Typed[company.FindCompanyIn, company.FindCompanyOut]("find_company").
		Description("Найти одну компанию по ИНН или ОГРН в DaData. Используй при запросе фактов о компании.").
		Execute(tools.FindCompany).Build(), agentsdk.AccessUser)
	agent.AddInstruction(&agentsdk.Instruction{Text: "Отвечай по-русски. Если пользователь просит найти компанию по ИНН или ОГРН, обязательно вызови find_company и основывай ответ только на его результате. Не сообщай сведения о компании из памяти модели. Если поиск не удался, объясни причину кратко; не делай выводов о кредитных или юридических рисках."})

	agent.RegisterRoute(&agentsdk.Route{
		Method:      "GET",
		Path:        "/",
		Handler:     pages.Home,
		Access:      agentsdk.AccessUser,
		Description: "Форма поиска компании по ИНН или ОГРН",
	})
	agent.RegisterRoute(&agentsdk.Route{Method: "POST", Path: "/lookup", Handler: pages.Lookup, Access: agentsdk.AccessUser, Description: "Найти компанию по ИНН или ОГРН"})

	agent.RegisterStaticAsset(&agentsdk.StaticAsset{
		Name:        views.AppCSSName,
		ContentType: "text/css; charset=utf-8",
		Data:        views.AppCSS,
	})

	// Sol will add RegisterTool, RegisterWebhook, RegisterJob, RegisterConnection calls here.
	return agent
}
