"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusBadge, type BadgeHue } from "@/components/status-badge";

type StudentStatus = "active" | "suspended_absences";

type Student = {
  id: string;
  status: StudentStatus;
  name: string;
  absCount: number;
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
        className="flex items-center gap-[10px] rounded-[14px] px-[14px]"
        style={{ height: 48, border: "1.5px solid #E9E3D8", background: "#fff" }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un élève…"
          className="flex-1 border-none bg-transparent outline-none"
          style={{ fontSize: 15, fontWeight: 600, color: "#1C1A17" }}
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
              className="rounded-full font-bold transition-colors"
              style={{
                padding: "8px 16px",
                fontSize: 13,
                background: active ? "#1C1A17" : "#fff",
                color: active ? "#fff" : "#6B6459",
                border: active ? "1px solid #1C1A17" : "1px solid #E9E3D8",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun élève.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {filtered.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <Link
                key={s.id}
                href={`/teacher/students/${s.id}`}
                className="flex items-center gap-[13px] rounded-[16px] p-[14px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-[14px] text-white font-bold"
                  style={{ width: 46, height: 46, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 17 }}
                >
                  {s.name[0]?.toUpperCase() ?? "?"}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold truncate" style={{ color: "#1C1A17", fontSize: 16 }}>{s.name}</span>
                  <span className="block font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                    {s.absCount} absence{s.absCount !== 1 ? "s" : ""} injustifiée{s.absCount !== 1 ? "s" : ""}
                  </span>
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
