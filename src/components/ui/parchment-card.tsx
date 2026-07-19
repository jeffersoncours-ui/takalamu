import type { HTMLAttributes } from "react";

/** Carte informative — fond parchemin, bordée, sans ombre. */
export function ParchmentCard({
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
        border: "1px solid var(--tk-parchment-border)",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
