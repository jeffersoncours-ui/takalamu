import type { CSSProperties } from "react";

export type BadgeHue = "green" | "amber" | "red" | "blue" | "purple" | "slate";

// Palette « Maktab Émeraude » : purple ("corrigé") réutilise l'or foncé de la DA
// (le nouveau design ne définit pas de teinte violette).
const HUES: Record<BadgeHue, { dot: string; border: string; bg: string; text: string }> = {
  green: { dot: "#0C6B4E", border: "#B7D9C4", bg: "#E9F1E6", text: "#0C6B4E" },
  amber: { dot: "#B0781F", border: "rgba(184,120,42,.35)", bg: "rgba(184,120,42,.10)", text: "#B0781F" },
  red: { dot: "#A3342A", border: "#E3B7AE", bg: "#F6E4E0", text: "#A3342A" },
  blue: { dot: "#2E5A8A", border: "#B9CBE0", bg: "#E7EDF5", text: "#2E5A8A" },
  purple: { dot: "#8A6316", border: "#DBC190", bg: "#F3EBD8", text: "#8A6316" },
  slate: { dot: "#8A7F63", border: "#DCD2B8", bg: "#F3EBD8", text: "#6E7A6A" },
};

export function StatusBadge({
  hue,
  label,
  style,
}: {
  hue: BadgeHue;
  label: string;
  style?: CSSProperties;
}) {
  const c = HUES[hue];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-[5px] rounded-full"
      style={{
        padding: "4px 9px 4px 8px",
        border: `1.4px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        fontSize: 11,
        fontWeight: 700,
        ...style,
      }}
    >
      <span className="rounded-full" style={{ width: 6, height: 6, background: c.dot }} />
      {label}
    </span>
  );
}

/** Mapping statut de devoir → hue + label affiché. */
export function homeworkBadge(value: string): { hue: BadgeHue; label: string } {
  switch (value) {
    case "rendu":
      return { hue: "blue", label: "Rendu" };
    case "corrige":
      return { hue: "purple", label: "Corrigé" };
    case "vu":
      return { hue: "green", label: "Vu" };
    case "a_rendre":
    default:
      return { hue: "slate", label: "À rendre" };
  }
}
