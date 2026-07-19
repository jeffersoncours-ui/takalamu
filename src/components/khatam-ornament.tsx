/** Filigrane khatam (étoile à 8 branches) — deux carrés superposés à 45°, motif signature. */
export function KhatamOrnament({
  size = 40,
  color = "#C79A3E",
  strokeWidth = 0.4,
  circle = false,
  className,
  style,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
  circle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      className={className}
      style={style}
    >
      <rect x="9" y="9" width="22" height="22" />
      <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
      {circle && <circle cx="20" cy="20" r="15.5" />}
    </svg>
  );
}
