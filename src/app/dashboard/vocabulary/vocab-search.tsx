"use client";

import { useState } from "react";

type VocabItem = {
  id: string;
  arabic_word: string;
  french_definition: string;
  root: string | null;
};

export default function VocabSearch({ items }: { items: VocabItem[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (v) =>
          v.arabic_word.includes(query.trim()) ||
          v.french_definition.toLowerCase().includes(q) ||
          (v.root && v.root.toLowerCase().includes(q)),
      )
    : items;

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Rechercher (arabe ou français)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
      />

      {!items.length && (
        <p className="text-sm text-slate-500">Aucun mot enregistré pour le moment.</p>
      )}

      {items.length > 0 && !filtered.length && (
        <p className="text-sm text-slate-500">Aucun résultat pour « {query} ».</p>
      )}

      <div className="space-y-2">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-start justify-between gap-4"
          >
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{v.french_definition}</p>
              {v.root && (
                <p className="text-xs text-slate-400 mt-0.5">Racine : {v.root}</p>
              )}
            </div>
            <p
              className="text-base font-semibold text-slate-900 shrink-0"
              dir="rtl"
              lang="ar"
            >
              {v.arabic_word}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
