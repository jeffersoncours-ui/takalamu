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

      <div className="flex flex-col gap-2.5">
        {filtered.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/grammar/${r.id}`}
            className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-3.5 transition-opacity hover:opacity-80"
            style={{ background: "#fff", border: "1px solid #EFEAE0" }}
          >
            <div className="min-w-0">
              <p className="font-bold truncate" style={{ color: "#1C1A17", fontSize: 15 }}>{r.title}</p>
              <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 12.5 }}>
                {format(new Date(r.date), "d MMM yyyy", { locale: fr })}
              </p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
