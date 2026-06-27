"use client";

import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Small uppercase eyebrow label with a leading emerald dot. */
export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.22em] text-primary/80",
        className
      )}
    >
      <span className="h-1 w-1 rounded-full bg-primary shadow-[0_0_8px_2px] shadow-primary/60" />
      {children}
    </span>
  );
}

/** Centered section heading block: eyebrow + title + optional lead. */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  const centered = align === "center";
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4",
        centered && "items-center text-center",
        className
      )}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="display max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            "max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg",
            centered && "mx-auto"
          )}
        >
          {lead}
        </p>
      )}
    </Reveal>
  );
}
