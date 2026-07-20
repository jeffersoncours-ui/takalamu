"use client";

import { useState } from "react";
import { AccordionGroup } from "@/components/accordion-group";
import type { LessonGroup } from "@/lib/group-by-lesson";

type FormItem = {
  id: string;
  arabic_text: string;
  french_text: string;
};

export default function FormulationSearch({ groups }: { groups: LessonGroup<FormItem>[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredGroups = groups.map((group) => ({
    ...group,
    items: q
      ? group.items.filter(
          (f) =>
            f.arabic_text.includes(query.trim()) ||
            f.french_text.toLowerCase().includes(q),
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
          placeholder="Rechercher (arabe ou français)…"
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

      {!hasAnyItems && (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune formulation enregistrée pour le moment.</p>
      )}

      {hasAnyItems && q && !hasAnyMatch && (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun résultat pour «&nbsp;{query}&nbsp;».</p>
      )}

      <div className="flex flex-col gap-3">
        {filteredGroups.map((group) => {
          if (q && group.items.length === 0) return null;
          return (
            <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={!!q}>
              {group.items.map((f) => (
                <div
                  key={f.id}
                  className="rounded-[14px] px-3.5 py-3 space-y-1.5"
                  style={{ background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)" }}
                >
                  <p
                    className="font-arabic"
                    dir="rtl"
                    lang="ar"
                    style={{ fontSize: 20, fontWeight: 700, color: "var(--tk-ink-hero-to)", lineHeight: 1.5 }}
                  >
                    {f.arabic_text}
                  </p>
                  <p style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>{f.french_text}</p>
                </div>
              ))}
            </AccordionGroup>
          );
        })}
      </div>
    </div>
  );
}
