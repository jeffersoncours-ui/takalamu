"use client";

import Link from "next/link";
import { useState } from "react";

type GrammarItem = {
  id: string;
  title: string;
  content: string;
  lessonRecordId: string | null;
  courseLabel: string | null;
};

export default function GrammarSearch({ items }: { items: GrammarItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = q
    ? items.filter((r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q))
    : items;

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#A8A29E"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3.5 top-1/2 -translate-y-1/2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Rechercher une règle…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-[14px] pl-11 pr-4 outline-none"
          style={{
            height: 48,
            background: "#FBF9F5",
            border: "1.5px solid #E9E3D8",
            fontSize: 14,
            color: "#1C1A17",
          }}
        />
      </div>

      {items.length === 0 && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune règle enregistrée pour le moment.</p>
      )}

      {items.length > 0 && q && filtered.length === 0 && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun résultat pour «&nbsp;{query}&nbsp;».</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((r) => (
          <div
            key={r.id}
            className="rounded-[16px] px-4 py-3.5 space-y-1.5"
            style={{ background: "#fff", border: "1px solid #EFEAE0" }}
          >
            <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{r.title}</p>
            <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "#4A463F", fontSize: 14 }}>
              {r.content}
            </p>
            {r.courseLabel && r.lessonRecordId && (
              <Link
                href={`/dashboard/cours/${r.lessonRecordId}`}
                className="inline-flex items-center gap-1 font-semibold"
                style={{ color: "#0F9D6E", fontSize: 12 }}
              >
                {r.courseLabel} →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
