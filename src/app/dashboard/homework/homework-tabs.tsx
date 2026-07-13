"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { HwSubmitForm } from "./hw-submit-form";

export type HomeworkItem = {
  id: string;
  instructions: string | null;
  status: string;
  feedback: string | null;
  grade: string | null;
  assignedAt: string;
  courseTitle: string | null;
  existingFiles: { path: string; name: string }[];
  pieceCount: number;
  pieces: { url: string; name: string; isAudio: boolean }[];
  correctionUrl: string | null;
};

type FilterKey = "a_rendre" | "rendu" | "corrige";

const FILTERS: { key: FilterKey; label: string; statuses: string[] }[] = [
  { key: "a_rendre", label: "À faire", statuses: ["a_rendre"] },
  { key: "rendu", label: "Correction en attente", statuses: ["rendu"] },
  { key: "corrige", label: "Corrigé", statuses: ["corrige", "vu"] },
];

export function HomeworkTabs({ items, studentId }: { items: HomeworkItem[]; studentId: string }) {
  const [filter, setFilter] = useState<FilterKey>("a_rendre");
  const [open, setOpen] = useState(false);

  const countFor = (f: FilterKey) => {
    const def = FILTERS.find((x) => x.key === f)!;
    return items.filter((i) => def.statuses.includes(i.status)).length;
  };
  const active = FILTERS.find((f) => f.key === filter)!;
  const shown = items.filter((i) => active.statuses.includes(i.status));

  return (
    <div className="space-y-4">
      {/* Menu déroulant */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-[14px] px-4"
          style={{ height: 48, background: "#fff", border: "1.5px solid #E9E3D8" }}
        >
          <span className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>
            {active.label}
            <span style={{ color: "#8B857A", fontWeight: 600 }}> · {countFor(filter)}</span>
          </span>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2.2}
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div
            className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-[14px]"
            style={{ background: "#fff", border: "1px solid #E9E3D8", boxShadow: "0 12px 28px rgba(28,26,23,.12)" }}
          >
            {FILTERS.map((f) => {
              const isActive = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => {
                    setFilter(f.key);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors"
                  style={{ background: isActive ? "#F2FBF7" : "#fff" }}
                >
                  <span className="font-semibold" style={{ color: isActive ? "#0A6B4E" : "#1C1A17", fontSize: 14 }}>
                    {f.label}
                  </span>
                  <span style={{ color: "#8B857A", fontSize: 13, fontWeight: 600 }}>{countFor(f.key)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste filtrée */}
      {shown.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>
          {filter === "a_rendre"
            ? "Rien à rendre pour le moment. 🎉"
            : filter === "rendu"
            ? "Aucun devoir en attente de correction."
            : "Aucun devoir corrigé pour l'instant."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((hw) => (
            <HomeworkCard key={hw.id} hw={hw} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  );
}

function HomeworkCard({ hw, studentId }: { hw: HomeworkItem; studentId: string }) {
  const [reviewing, setReviewing] = useState(false);
  const editable = hw.status === "a_rendre" || hw.status === "rendu";
  const corrected = hw.status === "corrige" || hw.status === "vu";

  return (
    <div
      className="rounded-[18px] p-4"
      style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
    >
      <div className="font-bold" style={{ color: "#1C1A17", fontSize: 16 }}>
        {hw.instructions ? hw.instructions.split("\n")[0].slice(0, 60) : "Devoir"}
      </div>
      {hw.courseTitle && (
        <div dir="rtl" lang="ar" className="font-arabic mt-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
          {hw.courseTitle}
        </div>
      )}

      {hw.instructions && (
        <p className="leading-relaxed whitespace-pre-wrap mt-2" style={{ color: "#4A463F", fontSize: 14 }}>
          {hw.instructions}
        </p>
      )}

      {/* Retour + note (devoir corrigé) */}
      {corrected && hw.feedback && (
        <div className="rounded-[14px] px-3 py-2.5 mt-3" style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}>
          <p style={{ color: "#0A6B4E", fontSize: 13 }}>
            <span className="font-semibold">Retour : </span>
            {hw.feedback}
            {hw.grade && <span className="ml-2 font-bold">— Note : {hw.grade}</span>}
          </p>
        </div>
      )}
      {corrected && !hw.feedback && hw.grade && (
        <p className="mt-3 font-bold" style={{ color: "#0A6B4E", fontSize: 14 }}>Note : {hw.grade}</p>
      )}

      {/* Édition (à faire / correction en attente) */}
      {editable && (
        <>
          {hw.status === "rendu" && (
            <p className="mt-3 text-sm font-medium" style={{ color: "#2C4BB8" }}>
              Devoir envoyé ({hw.pieceCount} pièce{hw.pieceCount > 1 ? "s" : ""}), en attente de correction. Tu peux encore le modifier.
            </p>
          )}
          <HwSubmitForm homeworkId={hw.id} studentId={studentId} existingFiles={hw.existingFiles} />
        </>
      )}

      {/* Revue (devoir corrigé, lecture seule) */}
      {corrected && (
        <>
          <button
            type="button"
            onClick={() => setReviewing((r) => !r)}
            className="mt-3 inline-flex items-center gap-1.5 font-semibold"
            style={{ color: "#0F9D6E", fontSize: 13 }}
          >
            {reviewing ? "Masquer" : "Revoir mon devoir"}
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2.2}
              strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: reviewing ? "rotate(180deg)" : "none", transition: "transform .15s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {reviewing && (
            <div className="mt-3 space-y-3">
              {hw.correctionUrl && (
                <a
                  href={hw.correctionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-[12px] px-3 py-2.5"
                  style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A6B4E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <span className="font-semibold" style={{ color: "#0A6B4E", fontSize: 13 }}>
                    Voir la copie corrigée du prof
                  </span>
                </a>
              )}

              {hw.pieces.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
                    Ce que j&apos;ai rendu
                  </p>
                  {hw.pieces.map((p, i) =>
                    p.isAudio ? (
                      <audio key={i} controls src={p.url} className="w-full" style={{ height: 40 }} />
                    ) : (
                      <a
                        key={i}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-[12px]"
                        style={{ border: "1px solid #EFEAE0" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.url} alt={p.name} className="w-full" style={{ display: "block" }} />
                      </a>
                    ),
                  )}
                </div>
              )}

              {hw.pieces.length === 0 && !hw.correctionUrl && (
                <p style={{ color: "#8B857A", fontSize: 13 }}>Aucune pièce à afficher.</p>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-2 mt-3 pt-2.5" style={{ borderTop: "1px solid #F4F0E8" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
        <span className="font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>
          {format(new Date(hw.assignedAt), "d MMMM yyyy", { locale: fr })}
        </span>
      </div>
    </div>
  );
}
