package main

import (
	"agent/handlers"
	"agent/views"

	"github.com/airlockrun/agentsdk"
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
		Description: "Fleet admin: управляет машинами GPTAdmin через MCP-инструменты хаба (discover/execute/inspect) из чата Airlock.",
	})
	pages := handlers.New()

	agent.RegisterMCP(&agentsdk.MCP{
		Slug:     "gptadmin",
		Name:     "GPTAdmin Hub",
		URL:      "http://127.0.0.1:9001/mcp",
		AuthMode: agentsdk.MCPAuthToken,
		Access:   agentsdk.AccessUser,
	})

	agent.AddInstruction(&agentsdk.Instruction{
		Text: "You administer a fleet of machines through the gptadmin MCP tools. " +
			"Use discover to list machines (shell:<name> agents) and available tools, " +
			"inspect/list_directory to read files, execute to run shell commands on a machine. " +
			"Prefer harmless read-only commands unless the user explicitly asks for a change. " +
			"Always report the machine name and quote the command output verbatim.",
	})

	agent.RegisterRoute(&agentsdk.Route{
		Method:      "GET",
		Path:        "/",
		Handler:     pages.Home,
		Access:      agentsdk.AccessUser,
		Description: "Default placeholder homepage — replace this once the agent has real routes",
	})

	agent.RegisterStaticAsset(&agentsdk.StaticAsset{
		Name:        views.AppCSSName,
		ContentType: "text/css; charset=utf-8",
		Data:        views.AppCSS,
	})

	// Sol will add RegisterTool, RegisterWebhook, RegisterJob, RegisterConnection calls here.
	return agent
}
