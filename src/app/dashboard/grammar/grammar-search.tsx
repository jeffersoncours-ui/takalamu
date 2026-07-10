"use client";

import { useState } from "react";
import { AccordionGroup } from "@/components/accordion-group";
import type { LessonGroup } from "@/lib/group-by-lesson";

type GrammarItem = {
  id: string;
  title: string;
  content: string;
};

export default function GrammarSearch({ groups }: { groups: LessonGroup<GrammarItem>[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredGroups = groups.map((group) => ({
    ...group,
    items: q
      ? group.items.filter(
          (r) => r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q),
        )
      : group.items,
  }));

  const hasAnyItems = groups.some((g) => g.items.length > 0);
  const hasAnyMatch = filteredGroups.some((g) => g.items.length > 0);

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

      {!hasAnyItems && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune règle enregistrée pour le moment.</p>
      )}

      {hasAnyItems && q && !hasAnyMatch && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun résultat pour «&nbsp;{query}&nbsp;».</p>
      )}

      <div className="flex flex-col gap-3">
        {filteredGroups.map((group) => {
          if (q && group.items.length === 0) return null;
          return (
            <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={!!q}>
              {group.items.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[14px] px-3.5 py-3"
                  style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
                >
                  <p className="font-bold mb-1" style={{ color: "#1C1A17", fontSize: 15 }}>{r.title}</p>
                  <p
                    className="leading-relaxed whitespace-pre-wrap"
                    style={{ color: "#4A463F", fontSize: 14 }}
                  >
                    {r.content}
                  </p>
                </div>
              ))}
            </AccordionGroup>
          );
        })}
      </div>
    </div>
  );
}
