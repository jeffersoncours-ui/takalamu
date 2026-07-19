/** Wordmark texte (تتكلم, Amiri or) — remplace l'ancien asset public/wordmark.png. */
export function Wordmark({
  size = 26,
  color = "var(--tk-gold-light)",
  className,
  style,
}: {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      dir="rtl"
      lang="ar"
      className={`font-arabic ${className ?? ""}`}
      style={{
        fontSize: size,
        fontWeight: 700,
        color,
        lineHeight: 1,
        ...style,
      }}
    >
      تتكلم
    </span>
  );
}
