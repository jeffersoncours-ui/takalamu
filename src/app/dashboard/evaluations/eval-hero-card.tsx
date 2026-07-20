import Link from "next/link";

type Props = {
  href: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  /** Conservé pour compatibilité d'appel — plus utilisé visuellement (ancien filigrane). */
  letter?: string;
  variant?: string;
};

export function EvalHeroCard({ href, title, subtitle, badge, icon }: Props) {
  return (
    <Link
      href={href}
      className="flex flex-col rounded-[18px] p-[18px] transition-opacity hover:opacity-90"
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 14px 28px -18px rgba(10,20,15,.42)" }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex items-center justify-center rounded-[13px] shrink-0"
          style={{ width: 44, height: 44, background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))", color: "var(--tk-gold-light)" }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 21, color: "var(--tk-ink-text)" }}>{title}</p>
          <p className="mt-0.5" style={{ fontSize: 12, color: "var(--tk-muted-olive)" }}>{subtitle}</p>
        </div>
      </div>
      <div
        className="flex items-center justify-between mt-4 pt-3.5"
        style={{ borderTop: "1px solid #EEE4CC" }}
      >
        <span style={{ fontSize: 11.5, color: "var(--tk-muted-olive)" }}>Contenu disponible</span>
        <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 15, color: "var(--tk-gold-dark)" }}>{badge}</span>
      </div>
    </Link>
  );
}
