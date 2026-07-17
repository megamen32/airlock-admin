export const INSTRUCTION_LIMIT = 16 * 1024;

const instructionSetEndpoint = "/admin/api/instruction-sets/default";

export type InstructionSet = {
  id: string;
  content: string;
  version: string;
  updated_at: string | null;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function parseInstruction(body: unknown): InstructionSet {
  if (typeof body !== "object" || body === null) {
    throw new ApiError(502, "Сервер вернул некорректный профиль инструкций.");
  }

  const value = body as Record<string, unknown>;
  if (
    typeof value.id !== "string" ||
    typeof value.content !== "string" ||
    typeof value.version !== "string" ||
    (typeof value.updated_at !== "string" && value.updated_at !== null && value.updated_at !== undefined)
  ) {
    throw new ApiError(502, "Сервер вернул неполный профиль инструкций.");
  }

  return {
    id: value.id,
    content: value.content,
    version: value.version,
    updated_at: typeof value.updated_at === "string" ? value.updated_at : null,
  };
}

async function request(init?: RequestInit): Promise<Response> {
  const response = await fetch(instructionSetEndpoint, {
    ...init,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...init?.headers },
  });
  if (!response.ok) {
    throw new ApiError(response.status, "Запрос к Hub не выполнен.");
  }
  return response;
}

function responseETag(response: Response): string {
  const etag = response.headers.get("ETag");
  if (!etag) {
    throw new ApiError(502, "Сервер не вернул версию профиля.");
  }
  return etag;
}

export async function getDefaultInstructionSet(): Promise<{ value: InstructionSet; etag: string }> {
  const response = await request();
  return {
    value: parseInstruction(await response.json()),
    etag: responseETag(response),
  };
}

export async function putDefaultInstructionSet(content: string, etag: string): Promise<{ value: InstructionSet; etag: string }> {
  const response = await request({
    method: "PUT",
    headers: { "Content-Type": "application/json", "If-Match": etag },
    body: JSON.stringify({ content }),
  });
  return {
    value: parseInstruction(await response.json()),
    etag: responseETag(response),
  };
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
