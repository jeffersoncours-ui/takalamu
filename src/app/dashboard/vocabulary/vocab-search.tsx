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
          placeholder="Rechercher (arabe ou français)…"
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

      {!items.length && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun mot enregistré pour le moment.</p>
      )}

      {items.length > 0 && !filtered.length && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun résultat pour «&nbsp;{query}&nbsp;».</p>
      )}

      <div className="flex flex-col gap-[10px]">
        {filtered.map((v) => (
          <div
            key={v.id}
            className="flex items-start justify-between gap-4 rounded-[16px] px-4 py-[14px]"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
          >
            <div className="min-w-0">
              <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>
                {v.french_definition}
              </p>
              {v.root && (
                <p className="mt-0.5" style={{ color: "#A8A29E", fontSize: 12 }}>
                  Racine : {v.root}
                </p>
              )}
            </div>
            <p
              className="font-arabic shrink-0"
              dir="rtl"
              lang="ar"
              style={{ fontSize: 22, fontWeight: 700, color: "#0A553F" }}
            >
              {v.arabic_word}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
