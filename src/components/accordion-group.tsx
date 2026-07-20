"use client";

import { useState } from "react";

export function AccordionGroup({
  label,
  count,
  forceOpen,
  children,
}: {
  label: string;
  count: number;
  forceOpen: boolean;
  children: React.ReactNode;
}) {
  const [manualOpen, setManualOpen] = useState(false);
  const open = forceOpen || manualOpen;

  return (
    <div
      className="rounded-[16px] overflow-hidden"
      style={{ border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)", boxShadow: "var(--tk-shadow-card)" }}
    >
      <button
        type="button"
        onClick={() => setManualOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5"
      >
        <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, color: "var(--tk-ink-text)", fontSize: 17 }}>{label}</span>
        <span className="flex items-center gap-2">
          <span className="font-medium" style={{ color: "var(--tk-muted-olive)", fontSize: 12 }}>{count}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--tk-gold)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-[10px]" style={{ borderTop: "1px solid var(--tk-parchment-border)" }}>
          <div className="pt-3 space-y-[10px]">{children}</div>
        </div>
      )}
    </div>
  );
}
