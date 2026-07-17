import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const endpoint = "/admin/api/instruction-sets/default";
const initialContent = "Проверяй состояние Hub перед изменениями.";
const updatedContent = `${initialContent}\nРаботай в режиме проверки.`;
const initialFixture = {
  id: "default",
  content: initialContent,
  version: "go-100",
  updated_at: "2026-07-17T08:00:00Z",
};
const updatedFixture = {
  id: "default",
  content: updatedContent,
  version: "go-101",
  updated_at: "2026-07-17T08:05:00Z",
};

type MockOptions = {
  expectedPutContent?: string;
  initialUpdatedAt?: string | null;
  omitInitialUpdatedAt?: boolean;
  putStatus?: number;
};

function mockInstructionFetch(options: MockOptions = {}) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    expect(input).toBe(endpoint);
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).get("Accept")).toBe("application/json");

    if (init?.method === "PUT") {
      expect(options.expectedPutContent).toBeDefined();
      expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
      expect(new Headers(init.headers).get("If-Match")).toBe('"go-100"');
      expect(init.body).toBe(JSON.stringify({ content: options.expectedPutContent }));

      if (options.putStatus === 412) {
        return new Response(JSON.stringify({ detail: "instruction set version does not match" }), {
          status: 412,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ...updatedFixture, content: options.expectedPutContent }), {
        status: 200,
        headers: { "Content-Type": "application/json", ETag: '"go-101"' },
      });
    }

    expect(init?.method).toBeUndefined();
    const initialUpdatedAt = options.initialUpdatedAt === undefined ? initialFixture.updated_at : options.initialUpdatedAt;
    const responseFixture = options.omitInitialUpdatedAt
      ? { id: initialFixture.id, content: initialFixture.content, version: initialFixture.version }
      : { ...initialFixture, updated_at: initialUpdatedAt };
    return new Response(JSON.stringify(responseFixture), {
      status: 200,
      headers: { "Content-Type": "application/json", ETag: '"go-100"' },
    });
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("Profiles / Instructions", () => {
  it("uses the exact Go contract and keeps the PUT response as the draft", async () => {
    const fetchMock = mockInstructionFetch({ expectedPutContent: updatedContent });
    render(<App />);

    const editor = await screen.findByDisplayValue(initialContent);
    fireEvent.change(editor, { target: { value: updatedContent } });
    await userEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    await waitFor(() => expect(screen.getByText("Опубликовано только что")).toBeInTheDocument());
    expect(screen.getByRole("textbox")).toHaveValue(updatedContent);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows a warning and blocks content above 16 KiB", async () => {
    mockInstructionFetch();
    render(<App />);

    const editor = await screen.findByRole("textbox");
    fireEvent.change(editor, { target: { value: "x".repeat(16_385) } });

    expect(screen.getByText(/Превышен лимит 16 KiB/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Опубликовать" })).toBeDisabled();
  });

  it("offers reload when the optimistic concurrency check is stale", async () => {
    const staleDraft = `${initialContent}\nИзменение.`;
    mockInstructionFetch({ expectedPutContent: staleDraft, putStatus: 412 });
    render(<App />);

    const editor = await screen.findByDisplayValue(initialContent);
    fireEvent.change(editor, { target: { value: staleDraft } });
    await userEvent.click(screen.getByRole("button", { name: "Опубликовать" }));

    expect(await screen.findByText(/Инструкции изменились на сервере/)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue(staleDraft);
    expect(screen.getByRole("button", { name: "Загрузить актуальную версию" })).toBeInTheDocument();
  });

  it("labels built-in instructions without inventing a 1970 update time", async () => {
    mockInstructionFetch({ omitInitialUpdatedAt: true });
    render(<App />);

    expect(await screen.findByText("Встроенная версия")).toBeInTheDocument();
    expect(screen.queryByText(/1970/)).not.toBeInTheDocument();
  });

  it("keeps unfinished navigation out of the tab order", async () => {
    mockInstructionFetch();
    render(<App />);
    await screen.findByRole("textbox");

    const current = screen.getByRole("link", { name: "Профили" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Выйти" })).toHaveAttribute("href", "/admin/logout");
    expect(screen.getAllByRole("button", { name: /скоро/ })).toHaveLength(6);

    await userEvent.tab();
    expect(current).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Выйти" })).toHaveFocus();
  });
});
