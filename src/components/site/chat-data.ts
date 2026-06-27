import type { LucideIcon } from "lucide-react";
import { GitBranch, ServerCog } from "lucide-react";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  /** Optional short headline shown above the message body. */
  headline?: string;
  /** Body lines. Each string is a paragraph. Inline `code` spans use the
   * convention `{{code}}...{{/code}}` and are rendered as <code>. */
  body: string[];
  /** Optional status tag shown on assistant messages (e.g. "Готово"). */
  status?: string;
  /** Optional list of validation/check lines shown as a compact block. */
  checks?: { label: string; ok: boolean }[];
};

export type ChatDemo = {
  id: string;
  title: string;
  icon: LucideIcon;
  summary: string;
  tags: string[];
  shareUrl: string;
  messages: ChatMessage[];
};

/**
 * Curated, lightly edited excerpts of real ChatGPT conversations that used
 * GPT‑Админ. Secrets were stripped (no tokens/passwords); only public hostnames,
 * local IPs and service names remain. Wording was tightened for clarity, but
 * the actual flow of "agent reads state → acts → validates → reports" is real.
 */
export const CHAT_DEMOS: ChatDemo[] = [
  {
    id: "openmemory",
    title: "Чиним OpenCode и OpenChamber",
    icon: ServerCog,
    summary:
      "Сервисы сломались. GPT‑Админ сам нашёл агентов, поднял логи, понял что OpenChamber ловил ECONNREFUSED во время рестарта OpenCode — и починил.",
    tags: ["nginx", "systemd", "диагностика", "OpenMemory"],
    shareUrl:
      "https://chatgpt.com/share/6a403c78-43bc-83eb-8a7e-ee0a3b176894",
    messages: [
      {
        role: "user",
        body: ["Opencode/openchamber опять сломались — ну что опять?"],
      },
      {
        role: "assistant",
        headline: "Без гаданий — смотрю фактическое состояние",
        body: [
          "Сначала найду доступные агенты и память по проекту, потом посмотрю логи и статусы на нужном сервере.",
          "Вижу важное: {{code}}shell:roomhacker-server-100{{/code}} сейчас offline в MCP, а {{code}}server-44{{/code}} и {{code}}88{{/code}} — online. OpenMemory тоже offline, диагностирую через доступные shell‑агенты.",
          "Память подсказала: {{code}}opencode.bezrabotnyi.com{{/code}} проксируется nginx на OpenChamber {{code}}127.0.0.1:3020{{/code}}, сервисы работают от {{code}}roomhacker{{/code}}.",
        ],
      },
      {
        role: "assistant",
        headline: "Нашёл причину",
        body: [
          "100‑й агент отвечает. Сервисы не упали: {{code}}openchamber{{/code}}, {{code}}opencode{{/code}}, {{code}}nginx{{/code}} — active. Локально 3020 отдаёт 200, 4095 отдаёт 401 без токена (норма).",
          "Реальная поломка была в 04:38: {{code}}opencode{{/code}} перезапускался, а OpenChamber в этот момент ловил {{code}}ECONNREFUSED{{/code}} и отдавал пачку 503. В 06:09 были 499 — клиент сам оборвал API‑запросы.",
        ],
      },
      {
        role: "user",
        body: ["Openchamber-сайт забудь и удали, используется только opencode и oc"],
      },
      {
        role: "assistant",
        headline: "Удаляю лишнее и перезапускаю по порядку",
        body: [
          "Понял: {{code}}openchamber.bezrabotnyi.com{{/code}} лишний. Удалил nginx vhost из sites-available и sites-enabled, certbot‑сертификат удалён, временный .bak тоже.",
          "Перезапустил по порядку: {{code}}opencode.service{{/code}} → {{code}}openchamber.service{{/code}}. Запомнил в OpenMemory, что использовать {{code}}opencode.{{/code}} и {{code}}oc.{{/code}}, а {{code}}openchamber.{{/code}} — не нужно.",
        ],
        status: "Готово",
        checks: [
          { label: "nginx -t", ok: true },
          { label: "opencode active, слушает :4095", ok: true },
          { label: "openchamber active, слушает :3020", ok: true },
          { label: "https://opencode.bezrabotnyi.com/ → 200", ok: true },
          { label: "https://oc.bezrabotnyi.com/ → 401 (норма без auth)", ok: true },
          { label: "ошибок в journalctl после рестарта нет", ok: true },
        ],
      },
    ],
  },
  {
    id: "pr-cleanup",
    title: "Чистим PR перед ревью",
    icon: GitBranch,
    summary:
      "В PR попали лишние файлы (.github/workflows, .gitignore). GPT‑Админ нашёл форк в памяти, оставил один feature-коммит, прогнал проверки и сделал force-push.",
    tags: ["git", "GitHub PR", "force-with-lease", "OpenMemory"],
    shareUrl:
      "https://chatgpt.com/share/6a403c04-2fb4-83ed-85c2-04439cfeac86",
    messages: [
      {
        role: "assistant",
        headline: "Сделаю с сотого — аккуратно",
        body: [
          "Сначала проверю текущий checkout/remote/ветку, потом почищу ветку, прогоню проверки и запушу через {{code}}--force-with-lease{{/code}}, если всё сходится.",
          "MCP доступен, сотый онлайн. В памяти нашёл прошлую чистку OpenChamber от 23 июня.",
        ],
      },
      {
        role: "user",
        body: ["в памяти не смотрел? .config/opencode"],
      },
      {
        role: "assistant",
        headline: "Память подсказала — нашёл правильный repo",
        body: [
          "Да, память смотрел: она подсказала прошлую работу от 23 июня, но путь к repo не вытащился. Проверю {{code}}.config/opencode{{/code}}.",
          "Нашёл: {{code}}/home/roomhacker/.config/opencode/apps/forks/openchamber{{/code}}. Локально ветка уже перебазирована на свежий {{code}}origin/main{{/code}}, но содержит те же два лишних коммита. Оставлю только feature‑коммит.",
          "Лишние {{code}}.github/workflows/pr-review.yml{{/code}} и {{code}}.gitignore{{/code}} убраны локальным reset’ом. Перед push — стандартные проверки.",
        ],
      },
      {
        role: "assistant",
        headline: "Force-push и обновление описания PR",
        body: [
          "Ветка {{code}}feat/quota-plugin-system{{/code}} очищена до одного коммита: {{code}}0fe1596 feat: add quota provider plugin system{{/code}}.",
          "Был нюанс: HTTPS push в fork отвалился из-за GitHub OAuth token без {{code}}workflow{{/code}} scope. Через SSH {{code}}git@github.com:megamen32/openchamber.git{{/code}} push прошёл нормально.",
        ],
        status: "Готово",
        checks: [
          { label: "bun run type-check", ok: true },
          { label: "bun run lint", ok: true },
          { label: "bun run build", ok: true },
          { label: "bun run vscode:build", ok: true },
          { label: "local status: clean", ok: true },
          { label: "PR: 1 commit / 16 files, bad files — нет", ok: true },
          { label: "pr-review GitHub Action — зелёный", ok: true },
        ],
      },
      {
        role: "user",
        body: ["Проверь новости"],
      },
      {
        role: "assistant",
        headline: "Проверил свежий timeline по PR",
        body: [
          "Force-push на {{code}}0fe1596{{/code}} виден. Новых комментариев после него нет — последний комментарий бота от 2026‑06‑24 уже не актуален, потому что workflow‑файл убран из diff.",
          "Итог: чистка сработала, review action зелёный, новых негативных новостей нет. Ждём человеческого review.",
        ],
        status: "Проверено",
      },
    ],
  },
];
