import type { HTMLAttributes } from "react";

/** Carte actionnable — fond parchemin-carte, ombre portée. */
export function ElevatedCard({
  className,
  style,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={className}
      style={{
        borderRadius: 18,
        background: "var(--tk-parchment-card)",
        border: "1px solid var(--tk-parchment-border-alt)",
        boxShadow: "var(--tk-shadow-card)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
