'use client';

export function TerminalApp() {
  return (
    <section className="h-full overflow-auto bg-[#101215] p-5 font-mono text-sm text-emerald-300">
      <p>Cloud OS terminal</p>
      <p className="mt-3 text-slate-400">A remote process stream appears here after a computer is paired with the hub.</p>
      <p className="mt-5"><span className="text-sky-300">[Cloud]</span> $ <span className="animate-pulse">▋</span></p>
    </section>
  );
}
