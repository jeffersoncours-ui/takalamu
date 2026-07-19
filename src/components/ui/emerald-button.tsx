import type { ButtonHTMLAttributes } from "react";

/** CTA secondaire — dégradé émeraude, texte parchemin. */
export function EmeraldButton({
  className,
  style,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full font-bold disabled:opacity-60 ${className ?? ""}`}
      style={{
        borderRadius: 14,
        background:
          "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
        color: "var(--tk-cream-text)",
        border: 0,
        padding: "13px",
        fontSize: 15,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
