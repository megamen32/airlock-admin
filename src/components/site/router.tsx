"use client";

import { useHashRoute } from "@/hooks/use-hash-route";
import { HomePage } from "./pages/home-page";
import { ChatGptPage } from "./pages/chatgpt-page";
import { McpServerPage } from "./pages/mcp-server-page";
import { McpExtensionPage } from "./pages/mcp-extension-page";

/** Renders the active "page" based on the hash route. */
export function Router() {
  const { page } = useHashRoute();

  switch (page) {
    case "chatgpt":
      return <ChatGptPage />;
    case "mcp-server":
      return <McpServerPage />;
    case "mcp-extension":
      return <McpExtensionPage />;
    case "home":
    default:
      return <HomePage />;
  }
}
