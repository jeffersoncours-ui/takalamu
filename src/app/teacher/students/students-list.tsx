"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, type BadgeHue } from "@/components/status-badge";

type StudentStatus = "active" | "suspended_absences";

type Student = {
  id: string;
  status: StudentStatus;
  name: string;
  avatarUrl: string | null;
};

const STATUS_META: Record<StudentStatus, { hue: BadgeHue; label: string }> = {
  active: { hue: "green", label: "Actif" },
  suspended_absences: { hue: "red", label: "Suspendu" },
};

type FilterKey = "all" | "active" | "suspended";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "suspended", label: "Suspendus" },
];

export function StudentsList({ students }: { students: Student[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const q = query.trim().toLowerCase();
  const filtered = students.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q)) return false;
    if (filter === "active" && s.status !== "active") return false;
    if (filter === "suspended" && s.status === "active") return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div
        className="flex items-center gap-[10px] rounded-[12px] px-[14px]"
        style={{ height: 44, border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)" }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--tk-muted-olive)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un élève…"
          className="flex-1 border-none bg-transparent outline-none"
          style={{ fontSize: 13.5, fontWeight: 500, color: "var(--tk-ink-text)" }}
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="rounded-full font-semibold transition-colors"
              style={{
                padding: "7px 15px",
                fontSize: 12,
                background: active ? "var(--tk-ink-text)" : "transparent",
                color: active ? "var(--tk-parchment)" : "var(--tk-ink-text-soft)",
                border: active ? "1px solid var(--tk-ink-text)" : "1px solid #D8C79E",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun élève.</p>
      ) : (
        <div className="flex flex-col gap-[11px]">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <Link
                key={s.id}
                href={`/teacher/students/${s.id}`}
                className="flex items-center gap-[13px] rounded-[16px] p-[13px_15px]"
                style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 10px 22px -16px rgba(10,20,15,.4)" }}
              >
                <span
                  className="flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] font-bold"
                  style={{
                    width: 44,
                    height: 44,
                    background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
                    color: "var(--tk-gold-light)",
                    fontFamily: "var(--font-spectral)",
                    fontSize: 22,
                  }}
                >
                  {s.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    s.name[0]?.toUpperCase() ?? "?"
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold truncate" style={{ color: "var(--tk-ink-text)", fontSize: 15 }}>{s.name}</span>
                </span>
                <StatusBadge hue={meta.hue} label={meta.label} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
