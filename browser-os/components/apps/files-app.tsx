'use client';

import { useEffect, useState } from 'react';
import { listComputers } from '@/lib/computer-api';
import type { Computer, FileEntry } from '@/lib/types';

export function FilesApp() {
  const [computers, setComputers] = useState<Computer[]>([]), [computer, setComputer] = useState(''), [path, setPath] = useState('/'), [entries, setEntries] = useState<FileEntry[]>([]), [message, setMessage] = useState('Select a computer to browse its CloudOS workspace.');
  useEffect(() => { void listComputers().then(result => setComputers((result.data ?? []).filter(c => c.capabilities.includes('files')))); }, []);
  async function browse(nextPath = path) {
    if (!computer) return; setMessage('Loading…');
    const response = await fetch(`/api/computer/files?operation=files.list&computer=${encodeURIComponent(computer)}&path=${encodeURIComponent(nextPath)}`), payload = await response.json();
    if (!response.ok || payload.mock || !Array.isArray(payload.data?.entries)) { setEntries([]); setMessage(payload.error || payload.data?.detail || 'Could not load files from this computer.'); return; }
    setPath(payload.data.path || nextPath); setEntries(payload.data.entries); setMessage(`${payload.data.entries.length} real entries from the selected computer.`);
  }
  return <section className="h-full overflow-auto bg-slate-950/60 p-5 text-slate-100"><h2 className="text-lg font-semibold">Files</h2><p className="mt-1 text-sm text-slate-400">Browse the agent workspace on a connected computer.</p><div className="mt-4 flex gap-2"><select aria-label="Computer" value={computer} onChange={e => { setComputer(e.target.value); setEntries([]); setPath('/'); }} className="rounded bg-slate-800 px-3 py-2 text-sm"><option value="">Choose computer…</option>{computers.filter(c => c.status === 'online').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button onClick={() => void browse('/')} disabled={!computer} className="rounded bg-violet-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">Open workspace</button></div><p className="mt-3 text-xs text-slate-400">{message}</p><p className="mt-2 font-mono text-xs text-slate-300">{path}</p><div className="mt-3 grid gap-1">{path !== '/' && <button onClick={() => void browse(path.split('/').slice(0, -1).join('/') || '/')} className="rounded p-2 text-left hover:bg-white/10">↩ ..</button>}{entries.map(entry => <button key={entry.path} onClick={() => entry.type === 'directory' && void browse(entry.path)} className="rounded border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"><span>{entry.type === 'directory' ? '📁' : '📄'} {entry.name}</span><span className="ml-3 text-xs text-slate-400">{entry.type}{entry.size != null ? ` · ${entry.size} B` : ''}</span></button>)}</div></section>;
}
