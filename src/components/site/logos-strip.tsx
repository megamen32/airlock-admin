"use client";

import { Database, Boxes, Container, Flame, Globe, Network, Shield, TerminalSquare } from "lucide-react";

const ITEMS = [
  { icon: TerminalSquare, label: "systemd" },
  { icon: Container, label: "Docker" },
  { icon: Globe, label: "Nginx" },
  { icon: Network, label: "WireGuard" },
  { icon: Database, label: "PostgreSQL" },
  { icon: Boxes, label: "Redis" },
  { icon: Flame, label: "Fail2Ban" },
  { icon: Shield, label: "ufw / iptables" },
  { icon: Globe, label: "Certbot" },
  { icon: Container, label: "docker-compose" },
];

export function LogosStrip() {
  return (
    <section className="relative py-14" aria-label="Поддерживаемые технологии">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground/60">
          Работает с привычным стеком
        </p>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex w-max animate-marquee items-center gap-12 pr-12">
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              <item.icon className="h-5 w-5 text-primary/60" />
              <span className="text-sm font-medium tracking-tight">{item.label}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
