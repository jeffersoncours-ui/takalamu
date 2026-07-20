import Link from "next/link";

type Props = {
  href: string;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
};

export function MenuCardLink({ href, label, desc, icon, color, bg }: Props) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
      style={{
        background: "var(--tk-parchment-card)",
        border: "1px solid var(--tk-parchment-border)",
        boxShadow: "var(--tk-shadow-card)",
      }}
    >
      <span
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{ width: 44, height: 44, background: bg, color }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: "var(--tk-ink-text)" }}>{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "var(--tk-muted-olive)" }}>{desc}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </Link>
  );
}
