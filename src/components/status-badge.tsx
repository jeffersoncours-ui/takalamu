import type { CSSProperties } from "react";

export type BadgeHue = "green" | "amber" | "red" | "blue" | "purple" | "slate";

const HUES: Record<BadgeHue, { dot: string; border: string; bg: string; text: string }> = {
  green: { dot: "#0F9D6E", border: "#9FE3C8", bg: "#ECFAF4", text: "#0A6B4E" },
  amber: { dot: "#F59E0B", border: "#F4D193", bg: "#FDF4E3", text: "#9A6206" },
  red: { dot: "#E5484D", border: "#F3B0B2", bg: "#FDECEC", text: "#B4292E" },
  blue: { dot: "#3E63DD", border: "#AEBEF2", bg: "#EAEFFD", text: "#2C49B8" },
  purple: { dot: "#8E4EC6", border: "#D4B0EC", bg: "#F6EDFC", text: "#7233A8" },
  slate: { dot: "#A8A29E", border: "#C7C0B4", bg: "#F4F1EB", text: "#6B6459" },
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

/** Mapping statut de présence → hue + label affiché. */
export function attendanceBadge(value: string): { hue: BadgeHue; label: string } {
  switch (value) {
    case "present":
      return { hue: "green", label: "Présent" };
    case "late":
      return { hue: "amber", label: "En retard" };
    case "absent_unjustified":
      return { hue: "red", label: "Absent" };
    case "absent_justified":
    default:
      return { hue: "slate", label: "Absent justifié" };
  }
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
