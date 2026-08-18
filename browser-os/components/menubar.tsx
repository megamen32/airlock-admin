// ============================================================
// GPTAdmin Browser OS — Menu Bar
// ============================================================

'use client';

import React, { useState, useEffect } from 'react';
import { CloudOSIcon } from './icons/app-icons';
import { useWindowStore } from '@/lib/window-store';

export function MenuBar() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const focusedWindow = useWindowStore(s => s.windows.find(w => w.isFocused));

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 bg-black/40 backdrop-blur-2xl flex items-center px-3 text-white/90 text-[13px] font-normal z-[9999] relative border-b border-white/5">
      {/* Apple Logo / Cloud OS */}
      <button className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-white/10 transition-colors mr-3">
        <CloudOSIcon size={14} />
        <span className="font-semibold">Cloud OS</span>
      </button>

      {/* Active App Name */}
      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors font-semibold">
        {focusedWindow?.title || 'Finder'}
      </button>

      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
        File
      </button>
      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
        Edit
      </button>
      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
        View
      </button>
      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
        Window
      </button>
      <button className="px-2 py-0.5 rounded hover:bg-white/10 transition-colors">
        Help
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Status Indicators */}
      <div className="flex items-center gap-3 text-[12px]">
        <StatusIndicator label="Cloud" status="connected" />
        <StatusIndicator label="Local Computer" status="connected" />
        <StatusIndicator label="Network" status="connected" />
      </div>

      {/* Separator */}
      <div className="w-px h-3 bg-white/15 mx-2" />

      {/* Date & Time */}
      <div className="flex items-center gap-1.5">
        <span className="text-white/60">{date}</span>
        <span>{time}</span>
      </div>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string; status: 'connected' | 'disconnected' | 'warning' }) {
  const colors = {
    connected: 'bg-[#06d6a0] shadow-[0_0_4px_rgba(6,214,160,0.5)]',
    disconnected: 'bg-white/30',
    warning: 'bg-[#ffd166] shadow-[0_0_4px_rgba(255,209,102,0.5)]',
  };

  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${status}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${colors[status]}`} />
      <span className="text-white/50 text-[11px] hidden lg:inline">{label}</span>
    </div>
  );
}
