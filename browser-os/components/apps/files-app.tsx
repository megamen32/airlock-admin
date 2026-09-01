'use client';

import { useEffect, useState } from 'react';
import { listComputers } from '@/lib/computer-api';
import type { Computer } from '@/lib/types';

export function FilesApp() {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    void listComputers().then(result => {
      setComputers(Array.isArray(result.data) ? result.data : []);
      setUsingMock(result.mock);
    });
  }, []);

  return (
    <section className="h-full overflow-auto bg-slate-950/60 p-5 text-slate-100">
      <h2 className="text-lg font-semibold">Files</h2>
      <p className="mt-1 text-sm text-slate-400">Cloud Home and connected computers</p>
      {usingMock && <p className="mt-4 rounded bg-amber-500/15 p-3 text-sm text-amber-200">Hub is unavailable; this is demo data.</p>}
      <div className="mt-4 grid gap-2">
        <div className="rounded border border-white/10 bg-white/5 p-3">☁️ Cloud Home</div>
        <div className="rounded border border-white/10 bg-white/5 p-3">📁 Workspace</div>
        {computers.map(computer => <div key={computer.id} className="rounded border border-white/10 bg-white/5 p-3">💻 {computer.name} <span className="text-xs text-slate-400">{computer.status}</span></div>)}
      </div>
    </section>
  );
}
