'use client';

import { FormEvent, useEffect, useState } from 'react';
import { listComputers } from '@/lib/computer-api';
import type { Computer } from '@/lib/types';

export function TerminalApp() {
  const [computers, setComputers] = useState<Computer[]>([]), [computer, setComputer] = useState(''), [command, setCommand] = useState('hostname'), [lines, setLines] = useState<string[]>(['CloudOS terminal — safe remote commands only.']);
  useEffect(() => { void listComputers().then(result => setComputers(result.data ?? [])); }, []);
  async function run(event: FormEvent) { event.preventDefault(); if (!computer || !command) return; setLines(old => [...old, `$ ${command}`]); const response = await fetch('/api/computer/processes', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({operation:'processes.exec', computer, session:'cloudos-ui', command}) }), payload = await response.json(), result = payload.data; setLines(old => [...old, result?.stdout || result?.stderr || result?.detail || payload.error || 'Command failed.']); }
  return <section className="h-full overflow-auto bg-[#101215] p-5 font-mono text-sm text-emerald-300"><p>CloudOS terminal</p><p className="mt-2 text-xs text-slate-400">Enabled: hostname, whoami, pwd, ls, dir.</p><pre className="mt-4 whitespace-pre-wrap text-slate-200">{lines.join('\n')}</pre><form onSubmit={run} className="mt-4 flex gap-2"><select aria-label="Computer" value={computer} onChange={e => setComputer(e.target.value)} className="rounded bg-slate-800 px-2 text-sm text-white"><option value="">Choose computer…</option>{computers.filter(c => c.status === 'online').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><input aria-label="Command" value={command} onChange={e => setCommand(e.target.value)} className="min-w-0 flex-1 rounded bg-slate-900 px-3 py-2 text-white"/><button disabled={!computer} className="rounded bg-violet-500 px-3 py-2 font-sans text-white disabled:opacity-40">Run</button></form></section>;
}
