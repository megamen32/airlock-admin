import { useCallback, useEffect, useMemo, useState } from "react";

type Server = {
  server_id?: string;
  name?: string;
  status?: string;
  kind?: string;
  last_seen?: string;
};

type Job = {
  job_id?: string;
  status?: string;
  tool_name?: string;
  command?: string;
  arguments_preview?: string;
  result_preview?: string;
  error_preview?: string;
  created_at?: number | string;
};

type Overview = {
  server_counts?: { online?: number; offline?: number; stale?: number };
  client_count?: number;
  servers?: Server[];
  jobs?: { recent?: Job[]; queued?: Job[]; background?: Job[]; count?: number };
  build?: { build_version?: string | number; git_commit?: string };
  shell_builds?: { versions?: Record<string, number> };
  update?: { current?: { status?: string }; last_result?: { status?: string; message?: string } | null };
  now_fmt?: string;
  hub_public_url?: string;
  public_origin?: string;
};

function compactTime(value: number | string | undefined): string {
  if (value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  const date = Number.isFinite(numeric) ? new Date(numeric < 1e12 ? numeric * 1000 : numeric) : new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

async function requestOverview(signal?: AbortSignal): Promise<Overview> {
  const response = await fetch("/admin/api/overview?limit=24", { credentials: "same-origin", signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Hub вернул HTTP ${response.status}`);
  return response.json() as Promise<Overview>;
}

export default function OverviewScreen() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [updating, setUpdating] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      setRefreshing(true);
      const next = await requestOverview(signal);
      setOverview(next);
      setError(null);
    } catch (caught) {
      if ((caught as DOMException).name !== "AbortError") setError(caught instanceof Error ? caught.message : "Не удалось загрузить обзор");
    } finally {
      if (!signal?.aborted) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh(controller.signal);
    const timer = window.setInterval(() => void refresh(controller.signal), 15_000);
    return () => { controller.abort(); window.clearInterval(timer); };
  }, [refresh]);

  const problems = useMemo(() => (overview?.servers ?? []).filter((server) => server.status !== "online").slice(0, 8), [overview]);
  const recentJobs = (overview?.jobs?.recent ?? []).slice(0, 8);
  const counts = overview?.server_counts ?? {};
  const update = overview?.update;
  const updateRunning = updating || update?.current?.status === "running";
  const publicUrl = overview?.hub_public_url || overview?.public_origin;
  const shellVersions = Object.entries(overview?.shell_builds?.versions ?? {}).map(([version, count]) => `${version}×${count}`).join(", ") || "—";

  const triggerUpdate = async () => {
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch("/admin/api/update", { method: "POST", credentials: "same-origin", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error(`Обновление не запущено: HTTP ${response.status}`);
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось запустить обновление");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="page-shell overview-page">
      <header className="page-header overview-header">
        <div>
          <p className="section-kicker">SYSTEM STATUS</p>
          <h1>Обзор</h1>
          <p className="lede">Коротко о состоянии системы, серверах и последних задачах.</p>
        </div>
        <div className="overview-header-actions">
          <span className={`data-badge ${error ? "state-error" : "state-ready"}`} role="status">{refreshing ? "Обновляем…" : error ? "Нет связи" : "● работает"}</span>
          <button className="button secondary" type="button" onClick={() => void refresh()} disabled={refreshing}>Обновить</button>
        </div>
      </header>

      {error && <div className="state-panel card standalone-state state-error" role="alert">{error}</div>}

      <section className="overview-metrics" aria-label="Ключевые показатели">
        <article className="card metric-tile"><span>Серверы</span><strong><b className="ok-text">{counts.online ?? 0}</b> / <b className="bad-text">{counts.offline ?? 0}</b> / <b className="warn-text">{counts.stale ?? 0}</b></strong><small>работают / недоступны / давно не отвечали</small></article>
        <article className="card metric-tile"><span>Клиенты</span><strong>{overview?.client_count ?? 0}</strong><small>активные записи доступа</small></article>
        <article className="card metric-tile"><span>Очередь</span><strong>{overview?.jobs?.queued?.length ?? 0}</strong><small>ожидают выполнения</small></article>
        <article className="card metric-tile"><span>В фоне</span><strong>{overview?.jobs?.background?.length ?? 0}</strong><small>выполняются сейчас</small></article>
      </section>

      <section className="overview-columns">
        <article className="card overview-panel">
          <div className="card-heading"><div><p className="section-kicker">ATTENTION</p><h2>Проблемные серверы</h2></div><span className="count-pill">{problems.length}</span></div>
          {problems.length === 0 ? <div className="compact-empty"><strong>Все серверы онлайн</strong><span>Сейчас вмешательство не требуется.</span></div> : <div className="compact-list">{problems.map((server) => <a className="compact-row" href="#agents" key={server.server_id ?? server.name}><span className={`status-dot status-${server.status ?? "unknown"}`} /><span><strong>{server.name || server.server_id || "Без имени"}</strong><small>{server.server_id} · {server.status || "unknown"}{server.last_seen ? ` · ${server.last_seen}` : ""}</small></span></a>)}</div>}
        </article>

        <article className="card overview-panel">
          <div className="card-heading"><div><p className="section-kicker">RECENT</p><h2>Последние задачи</h2></div><a className="text-button" href="#jobs">Все задачи</a></div>
          {recentJobs.length === 0 ? <div className="compact-empty"><strong>Задач пока нет</strong><span>Последние операции появятся здесь.</span></div> : <div className="compact-list">{recentJobs.map((job) => <a className="compact-row" href="#jobs" key={job.job_id}><span className={`job-state job-${job.status ?? "unknown"}`}>{job.status || "—"}</span><span><strong>{job.tool_name || "operation"}</strong><small>{job.command || job.arguments_preview || job.result_preview || job.error_preview || job.job_id || "—"} · {compactTime(job.created_at)}</small></span></a>)}</div>}
        </article>
      </section>

      <details className="card overview-system-card overview-tech-details"><summary>Техническая информация</summary>
        <div className="card-heading"><div><p className="section-kicker">SYSTEM</p><h2>Версии и обновление</h2></div><button className="button primary" type="button" onClick={() => void triggerUpdate()} disabled={updateRunning}>{updateRunning ? "Обновляем…" : "Обновить этот узел"}</button></div>
        <div className="system-facts">
          <div><span>Главный сервис</span><strong>версия {overview?.build?.build_version ?? "—"}</strong><small>{overview?.build?.git_commit?.slice(0, 7) || "версия кода —"}</small></div>
          <div><span>Агенты</span><strong>{shellVersions}</strong><small>версии агентов</small></div>
          <div><span>Адрес системы</span><strong>{publicUrl ? <a href={publicUrl} target="_blank" rel="noreferrer">{publicUrl}</a> : "—"}</strong><small>{overview?.now_fmt || "обновление каждые 15 секунд"}</small></div>
        </div>
        {update?.last_result?.message && <div className={`inline-note ${update.last_result.status === "error" ? "danger-note" : ""}`}>{update.last_result.message}</div>}
      </details>
    </div>
  );
}
