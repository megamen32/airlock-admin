import { useCallback, useEffect, useMemo, useState } from "react";

type Server = {
  server_id?: string;
  name?: string;
  status?: string;
  kind?: string;
  transport?: string;
  last_seen?: string;
  capabilities?: string[];
  meta?: Record<string, unknown>;
};

type Overview = { servers?: Server[] };

function textValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try { return JSON.stringify(value); } catch { return String(value); }
}

export default function AgentsScreen() {
  const [servers, setServers] = useState<Server[]>([]);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const response = await fetch("/admin/api/overview?limit=20", { credentials: "same-origin", signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Hub вернул HTTP ${response.status}`);
      const data = await response.json() as Overview;
      setServers(Array.isArray(data.servers) ? data.servers : []);
      setError(null);
    } catch (caught) {
      if ((caught as DOMException).name !== "AbortError") setError(caught instanceof Error ? caught.message : "Не удалось загрузить серверы");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const timer = window.setInterval(() => void load(controller.signal), 15_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [load]);

  const filtered = useMemo(() => servers.filter((server) => {
    if (status !== "all" && server.status !== status) return false;
    if (!filter.trim()) return true;
    return JSON.stringify(server).toLowerCase().includes(filter.trim().toLowerCase());
  }), [servers, filter, status]);
  const selected = servers.find((server) => server.server_id === selectedId) ?? null;

  return <div className="page-shell native-operation-page">
    <header className="page-header compact-page-header"><div><p className="section-kicker">INFRASTRUCTURE</p><h1>Серверы</h1><p className="lede">Состояние агентов и MCP-узлов без раскрытия всей технической метаинформации сразу.</p></div><div className="overview-header-actions"><span className={`data-badge ${error ? "state-error" : "state-ready"}`} role="status">{loading ? "Обновляем…" : `${filtered.length} узлов`}</span><button className="button secondary" type="button" disabled={loading} onClick={() => void load()}>Обновить</button></div></header>
    {error && <div className="state-panel card standalone-state state-error" role="alert">{error}</div>}
    <section className={`agent-native-layout ${selected ? "has-detail" : ""}`}>
      <article className="card agent-native-list">
        <div className="list-toolbar"><input className="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Фильтр серверов" /><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Все статусы</option><option value="online">online</option><option value="offline">offline</option><option value="stale">stale</option></select></div>
        {filtered.length === 0 && !loading ? <div className="compact-empty"><strong>Серверов не найдено</strong><span>Измените фильтр или обновите данные.</span></div> : <div className="compact-list">{filtered.map((server) => <button type="button" className={`server-native-row ${selectedId === server.server_id ? "selected" : ""}`} key={server.server_id || server.name} onClick={() => setSelectedId(server.server_id || null)}><span className={`status-dot status-${server.status || "unknown"}`} /><span className="server-native-main"><strong>{server.name || server.server_id || "Без имени"}</strong><small>{server.server_id || "—"} · {server.kind || "unknown"}{server.transport ? ` · ${server.transport}` : ""}</small></span><span className="server-native-status">{server.status || "—"}</span></button>)}</div>}
      </article>
      {selected && <aside className="card agent-detail-pane">
        <div className="card-heading"><div><p className="section-kicker">DETAIL</p><h2>{selected.name || selected.server_id}</h2></div><button className="text-button" type="button" onClick={() => setSelectedId(null)}>Закрыть</button></div>
        <dl className="detail-facts"><div><dt>ID</dt><dd>{selected.server_id || "—"}</dd></div><div><dt>Статус</dt><dd>{selected.status || "—"}</dd></div><div><dt>Тип</dt><dd>{selected.kind || "—"}</dd></div><div><dt>Transport</dt><dd>{selected.transport || "—"}</dd></div><div><dt>Last seen</dt><dd>{selected.last_seen || "—"}</dd></div></dl>
        <div className="detail-section"><h3>Возможности</h3><div className="pill-wrap">{selected.capabilities?.length ? selected.capabilities.map((cap) => <span className="small-pill" key={cap}>{cap}</span>) : <span className="muted-help">Не переданы</span>}</div></div>
        <div className="detail-section"><h3>Метаданные</h3>{Object.keys(selected.meta ?? {}).length ? <dl className="meta-grid">{Object.entries(selected.meta ?? {}).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{textValue(value)}</dd></div>)}</dl> : <p className="muted-help">Нет метаданных.</p>}</div>
      </aside>}
    </section>
  </div>;
}
