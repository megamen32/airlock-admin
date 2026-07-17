import { useEffect, useState } from "react";
import {
  ApiError,
  byteLength,
  getDefaultInstructionSet,
  INSTRUCTION_LIMIT,
  putDefaultInstructionSet,
  type InstructionSet,
} from "./api";
import "./styles.css";

const navigation = ["Обзор", "Подключения", "Профили", "MCP", "Активность", "Система", "Диагностика"];

type LoadState = "loading" | "ready" | "empty" | "error";

function formatBytes(bytes: number): string {
  return `${bytes.toLocaleString("ru-RU")} / 16 384 байт`;
}

function formatUpdated(value: string | null | undefined): string {
  if (value === null) return "Встроенная версия";
  if (!value) return "Нет данных";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Некорректная дата";
  return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function stateLabel(state: LoadState): string {
  if (state === "loading") return "Загрузка профиля";
  if (state === "ready") return "Данные профиля загружены";
  if (state === "empty") return "Профиль не найден";
  return "Состояние профиля неизвестно";
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [profile, setProfile] = useState<InstructionSet | null>(null);
  const [draft, setDraft] = useState("");
  const [etag, setEtag] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function load(): Promise<void> {
    setLoadState("loading");
    setMessage(null);
    try {
      const result = await getDefaultInstructionSet();
      setProfile(result.value);
      setDraft(result.value.content);
      setEtag(result.etag);
      setLoadState("ready");
    } catch (error) {
      setProfile(null);
      setEtag(null);
      setLoadState(error instanceof ApiError && error.status === 404 ? "empty" : "error");
      setMessage(error instanceof Error ? error.message : "Не удалось загрузить профиль.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const bytes = byteLength(draft);
  const overLimit = bytes > INSTRUCTION_LIMIT;
  const dirty = profile !== null && draft !== profile.content;

  async function publish(): Promise<void> {
    if (!etag || overLimit || publishing || !dirty) return;
    setPublishing(true);
    setMessage(null);
    try {
      const result = await putDefaultInstructionSet(draft, etag);
      setProfile(result.value);
      setDraft(result.value.content);
      setEtag(result.etag);
      setMessage("Опубликовано только что");
    } catch (error) {
      if (error instanceof ApiError && error.status === 412) {
        setMessage("Инструкции изменились на сервере. Загрузите актуальную версию перед публикацией.");
      } else {
        setMessage(error instanceof Error ? error.message : "Не удалось опубликовать изменения.");
      }
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>GPTAdmin</span>
        </div>
        <div className="workspace-label">ОПЕРАЦИОННАЯ КОНСОЛЬ</div>
        <nav aria-label="Основная навигация">
          {navigation.map((item) =>
            item === "Профили" ? (
              <a className="nav-item active" href="/admin/" aria-current="page" key={item}>
                <span className="nav-dot" aria-hidden="true" />
                <span>{item}</span>
              </a>
            ) : (
              <button className="nav-item" type="button" disabled aria-label={`${item} — скоро`} key={item}>
                <span className="nav-dot" aria-hidden="true" />
                <span>{item}</span>
                <small>скоро</small>
              </button>
            ),
          )}
        </nav>
        <div className="sidebar-footer">
          <span className="profile-state">{stateLabel(loadState)}</span>
          <a className="logout-link" href="/admin/logout">Выйти</a>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">Профили</span>
            <h1>Инструкции</h1>
          </div>
        </header>

        <div className="content-wrap">
          <section className="intro">
            <div>
              <p className="section-kicker">DEFAULT PROFILE / 01</p>
              <h2>Правила для MCP-клиентов</h2>
              <p className="lede">
                Опубликованный текст становится рабочим контекстом подключённых MCP-клиентов. Права доступа и подтверждения Hub остаются отдельной границей.
              </p>
            </div>
            <div className={`data-badge state-${loadState}`} role="status">
              <span className="state-dot" aria-hidden="true" />
              {stateLabel(loadState)}
            </div>
          </section>

          <section className="profile-grid">
            <div className="editor-card card">
              <div className="card-heading">
                <div>
                  <h3>Default</h3>
                  <p className="muted">
                    {profile ? `Версия ${profile.version.slice(0, 12)}` : stateLabel(loadState)}
                  </p>
                </div>
                <span className={`chip ${dirty ? "chip-dirty" : ""}`}>
                  {dirty ? "Не опубликовано" : loadState === "ready" ? "Загружено" : "Нет статуса"}
                </span>
              </div>

              {loadState === "loading" && (
                <div className="state-panel" role="status">
                  <span className="loader" aria-hidden="true" />
                  Загрузка профиля…
                </div>
              )}

              {loadState === "error" && (
                <div className="state-panel state-error" role="alert">
                  <strong>Не удалось загрузить профиль</strong>
                  <span>{message}</span>
                  <button className="button secondary" type="button" onClick={() => void load()}>Повторить</button>
                </div>
              )}

              {loadState === "empty" && (
                <div className="state-panel">
                  <strong>Default не найден</strong>
                  <span>Hub не вернул профиль инструкций.</span>
                  <button className="button secondary" type="button" onClick={() => void load()}>Повторить</button>
                </div>
              )}

              {loadState === "ready" && (
                <>
                  <label className="editor-label" htmlFor="instructions">Текст инструкций</label>
                  <textarea
                    id="instructions"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    aria-describedby="byte-count editor-help"
                    spellCheck="false"
                  />
                  <div className="editor-footer">
                    <span id="byte-count" className={overLimit ? "byte-count warning" : "byte-count"}>
                      {formatBytes(bytes)}
                      {overLimit && <span> · Превышен лимит 16 KiB</span>}
                    </span>
                    <span id="editor-help" className="editor-hint">Markdown поддерживается</span>
                  </div>
                  <div className="action-row">
                    <div className="publish-status" aria-live="polite">
                      {message && (
                        <span className={message.includes("изменились") || message.includes("Не удалось") ? "warning-text" : "success-text"}>
                          {message}
                        </span>
                      )}
                    </div>
                    <button
                      className="button primary"
                      type="button"
                      onClick={() => void publish()}
                      disabled={!dirty || overLimit || !etag || publishing}
                    >
                      {publishing ? "Публикуем…" : "Опубликовать"}
                    </button>
                  </div>
                  {message?.includes("изменились") && (
                    <button className="reload-link" type="button" onClick={() => void load()}>
                      Загрузить актуальную версию
                    </button>
                  )}
                </>
              )}
            </div>

            <aside className="details-column" aria-label="Сведения о профиле">
              <div className="card detail-card">
                <p className="section-kicker">ПРОФИЛЬ</p>
                <h3>Default</h3>
                <dl>
                  <div>
                    <dt>Ответ API</dt>
                    <dd>{loadState === "ready" ? "Получен" : loadState === "loading" ? "Ожидание" : "Не получен"}</dd>
                  </div>
                  <div>
                    <dt>Версия</dt>
                    <dd>{profile?.version.slice(0, 12) ?? "Нет данных"}</dd>
                  </div>
                  <div>
                    <dt>Обновлено</dt>
                    <dd>{formatUpdated(profile?.updated_at)}</dd>
                  </div>
                  <div>
                    <dt>Размер черновика</dt>
                    <dd>{loadState === "ready" ? formatBytes(bytes) : "Нет данных"}</dd>
                  </div>
                </dl>
              </div>
              <div className="note-card">
                <span className="note-icon" aria-hidden="true">i</span>
                <p><strong>Безопасная граница</strong><br />Инструкции не заменяют права доступа и подтверждения Hub.</p>
              </div>
            </aside>
          </section>
        </div>
      </main>
    </div>
  );
}
