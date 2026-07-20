"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type GrammarItem = {
  id: string;
  title: string;
  date: string;
};

export default function GrammarSearch({ items }: { items: GrammarItem[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = q ? items.filter((r) => r.title.toLowerCase().includes(q)) : items;

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--tk-muted-olive)"
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
            background: "var(--tk-parchment-field)",
            border: "1.5px solid var(--tk-parchment-border)",
            fontSize: 14,
            color: "var(--tk-ink-text)",
          }}
        />
      </div>

      {items.length === 0 && (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune règle enregistrée pour le moment.</p>
      )}

      {items.length > 0 && q && filtered.length === 0 && (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun résultat pour «&nbsp;{query}&nbsp;».</p>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/grammar/${r.id}`}
            className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3.5 transition-opacity hover:opacity-80"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
          >
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: "var(--tk-ink-text)", fontSize: 15 }}>{r.title}</p>
              <p className="mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12.5 }}>
                {format(new Date(r.date), "d MMM yyyy", { locale: fr })}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
