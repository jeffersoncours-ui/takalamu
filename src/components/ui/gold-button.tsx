import type { ButtonHTMLAttributes } from "react";

/** CTA primaire — dégradé or, texte encre. */
export function GoldButton({
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
        background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
        color: "var(--tk-ink-screen)",
        border: 0,
        padding: "13px",
        fontSize: 15,
        boxShadow: "var(--tk-shadow-cta)",
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
