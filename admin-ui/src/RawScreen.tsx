import { useCallback, useEffect, useState } from "react";

export default function RawScreen() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/admin/api/overview?limit=160", { credentials: "same-origin", signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Hub вернул HTTP ${response.status}`);
      setData(await response.json());
    } catch (caught) {
      if ((caught as DOMException).name !== "AbortError") setError(caught instanceof Error ? caught.message : "Не удалось загрузить JSON");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  return <div className="page-shell native-operation-page">
    <header className="page-header compact-page-header"><div><p className="section-kicker">DIAGNOSTICS</p><h1>Raw JSON</h1><p className="lede">Технический снимок Hub. Используйте его только для диагностики.</p></div><button className="button secondary" type="button" onClick={() => void load()} disabled={loading}>{loading ? "Обновляем…" : "Обновить"}</button></header>
    {error && <div className="state-panel card standalone-state state-error" role="alert">{error}</div>}
    <pre className="card raw-native-box">{data === null ? "—" : JSON.stringify(data, null, 2)}</pre>
  </div>;
}
