import Link from "next/link";

type Variant = "green" | "cream";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  letter: string;
  variant: Variant;
};

const VARIANT_STYLE: Record<
  Variant,
  { bg: string; shadow: string; accent: string; letter: string; iconShadow: string }
> = {
  green: {
    bg: "#E3F5EC",
    shadow: "0 8px 20px rgba(15,157,110,.10)",
    accent: "#0F9D6E",
    letter: "rgba(15,157,110,.16)",
    iconShadow: "0 4px 10px rgba(15,157,110,.16)",
  },
  cream: {
    bg: "#F2E5C7",
    shadow: "0 8px 20px rgba(138,106,46,.12)",
    accent: "#8A6A2E",
    letter: "rgba(138,106,46,.18)",
    iconShadow: "0 4px 10px rgba(138,106,46,.16)",
  },
};

export function EvalHeroCard({ href, title, subtitle, badge, icon, letter, variant }: Props) {
  const s = VARIANT_STYLE[variant];
  return (
    <Link
      href={href}
      className="relative flex items-center gap-4 overflow-hidden rounded-[28px] px-5 py-5 transition-opacity hover:opacity-90"
      style={{ background: s.bg, boxShadow: s.shadow }}
    >
      <span
        aria-hidden
        className="font-arabic absolute -right-2 top-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{ fontSize: 130, lineHeight: 1, color: s.letter }}
      >
        {letter}
      </span>
      <span
        className="relative z-10 flex items-center justify-center rounded-2xl bg-white shrink-0"
        style={{ width: 56, height: 56, boxShadow: s.iconShadow, color: s.accent }}
      >
        {icon}
      </span>
      <div className="relative z-10 flex-1 min-w-0">
        <p className="font-bold leading-tight" style={{ fontSize: 17, color: "#1C1A17" }}>{title}</p>
        <p className="text-sm mt-0.5" style={{ color: "#5B564C" }}>{subtitle}</p>
        <span
          className="inline-block mt-2 rounded-full bg-white px-3 py-1 text-xs font-semibold"
          style={{ color: s.accent }}
        >
          {badge}
        </span>
      </div>
    </Link>
  );
}
