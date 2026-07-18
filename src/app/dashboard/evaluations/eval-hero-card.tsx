import Link from "next/link";

type Variant = "green" | "cream";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  variant: Variant;
};

const VARIANT_STYLE: Record<Variant, { bg: string; shadow: string; ink: string; sub: string; badgeBg: string; badgeText: string; iconColor: string }> = {
  green: {
    bg: "linear-gradient(135deg, #12A876 0%, #0A553F 100%)",
    shadow: "0 16px 32px rgba(10,85,63,.28)",
    ink: "#FFFFFF",
    sub: "rgba(255,255,255,.78)",
    badgeBg: "rgba(255,255,255,.16)",
    badgeText: "#FFFFFF",
    iconColor: "rgba(255,255,255,.22)",
  },
  cream: {
    bg: "linear-gradient(135deg, #F3E9D2 0%, #E2D0A4 100%)",
    shadow: "0 16px 32px rgba(28,26,23,.10)",
    ink: "#3B2E14",
    sub: "rgba(59,46,20,.65)",
    badgeBg: "rgba(59,46,20,.10)",
    badgeText: "#3B2E14",
    iconColor: "rgba(59,46,20,.16)",
  },
};

export function EvalHeroCard({ href, title, subtitle, badge, icon, variant }: Props) {
  const s = VARIANT_STYLE[variant];
  return (
    <Link
      href={href}
      className="relative block overflow-hidden rounded-3xl px-5 py-5 transition-opacity hover:opacity-90"
      style={{ background: s.bg, boxShadow: s.shadow }}
    >
      <span
        className="absolute -right-2 -bottom-2 pointer-events-none"
        style={{ color: s.iconColor }}
      >
        {icon}
      </span>
      <div className="relative space-y-2.5">
        <p
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: s.ink }}
        >
          {title}
        </p>
        <p className="text-sm" style={{ color: s.sub }}>{subtitle}</p>
        <span
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: s.badgeBg, color: s.badgeText }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {badge}
        </span>
      </div>
    </Link>
  );
}
