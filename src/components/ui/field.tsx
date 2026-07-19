import type { CSSProperties, InputHTMLAttributes } from "react";

export type FieldTone = "ink" | "parchment";

/** Styles label + input partagés par les formulaires (connexion, mot de passe, fiches…). */
export function fieldStyles(tone: FieldTone): { label: CSSProperties; input: CSSProperties } {
  if (tone === "ink") {
    return {
      label: {
        display: "block",
        fontFamily: "var(--font-spectral)",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: ".22em",
        textTransform: "uppercase",
        color: "var(--tk-gold)",
        marginBottom: 9,
      },
      input: {
        width: "100%",
        height: 52,
        borderRadius: 13,
        border: "1px solid rgba(199,154,62,.28)",
        background: "rgba(255,255,255,.04)",
        padding: "0 16px",
        fontSize: 14,
        color: "var(--tk-cream-text-soft)",
        outline: "none",
      },
    };
  }
  return {
    label: {
      display: "block",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--tk-muted-olive)",
      textTransform: "uppercase",
      letterSpacing: ".06em",
      marginBottom: 6,
    },
    input: {
      width: "100%",
      borderRadius: 13,
      border: "1.5px solid var(--tk-parchment-border)",
      background: "var(--tk-parchment-field)",
      padding: "12px 14px",
      fontSize: 15,
      color: "var(--tk-ink-text)",
      outline: "none",
    },
  };
}

export function Field({
  tone = "parchment",
  label,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { tone?: FieldTone; label: string; id: string }) {
  const s = fieldStyles(tone);
  return (
    <div>
      <label htmlFor={id} style={s.label}>
        {label}
      </label>
      <input id={id} name={id} style={s.input} {...props} />
    </div>
  );
}
