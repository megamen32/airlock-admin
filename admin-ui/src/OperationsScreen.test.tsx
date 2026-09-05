import { StrictMode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

type Actions = { listManagedMcp(): Promise<void>; refreshAll(): Promise<void> };
const actions = () => window as unknown as Actions;
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, "", "#instructions"); });

it("mounts operations natively, renders a nonempty MCP list, preserves drafts, and cleans up", async () => {
  window.history.replaceState(null, "", "#overview");
  const signals: AbortSignal[] = [];
  const timers = vi.spyOn(globalThis, "setInterval");
  const clear = vi.spyOn(globalThis, "clearInterval");
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    if (init?.signal) signals.push(init.signal);
    const path = String(input);
    let body: object;
    if (path.startsWith("/admin/api/overview")) body = {
      servers: [{ server_id: "shell:fixture", name: "Fixture", status: "online", kind: "virtual_shell", meta: {}, capabilities: ["shell"] }],
      server_counts: { online: 1 }, clients: [], audit: [], jobs: { recent: [], queued: [], background: [] },
      build: { build_version: "test", git_commit: "fixture" }, failover_config: { enabled: false, primary_public_url: "https://saved.example", nodes: [] },
    };
    else if (path === "/admin/api/mcp/manage") body = { servers: [{ name: "fixture-mcp", command: "python3", args: ["example.py"], env: { MODE: "test" }, enabled: true }] };
    else if (path === "/admin/api/failover") body = { config: { enabled: false, primary_public_url: "https://saved.example", nodes: [] }, state: {} };
    else throw new Error(`Unexpected request ${path}`);
    return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const mounted = render(<StrictMode><App /></StrictMode>);
  await screen.findByText("● online");
  expect(screen.getByRole("button", { name: "Обновить этот узел" })).toBeInTheDocument();
  expect(document.querySelector("iframe")).toBeNull();
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  await userEvent.click(screen.getByRole("link", { name: "MCP-менеджер" }));
  expect(document.getElementById("view-mcpmanage")).toHaveClass("active");
  await actions().listManagedMcp();
  expect(screen.getByText("fixture-mcp")).toBeInTheDocument();
  expect(screen.getByText("example.py")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("link", { name: "Резервирование" }));
  await waitFor(() => expect(document.getElementById("foPrimary")).toHaveValue("https://saved.example"));
  fireEvent.input(document.getElementById("foPrimary")!, { target: { value: "https://draft.example" } });
  await actions().refreshAll();
  expect(document.getElementById("foPrimary")).toHaveValue("https://draft.example");
  mounted.unmount();
  expect(signals.every((signal) => signal.aborted)).toBe(true);
  expect(clear.mock.calls.length).toBe(timers.mock.calls.length);
  expect((window as unknown as Partial<Actions>).listManagedMcp).toBeUndefined();
});
