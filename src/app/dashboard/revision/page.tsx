import { requireStudent } from "@/lib/auth";
import { MenuCardLink } from "@/components/menu-card-link";

const REVISION_ITEMS = [
  {
    href: "/dashboard/evaluations",
    label: "Évaluations",
    desc: "Quiz de langue et de conjugaison",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: "var(--tk-warning)",
    bg: "rgba(184,120,42,.12)",
  },
  {
    href: "/dashboard/vocabulary",
    label: "Mon glossaire",
    desc: "Tous mes mots arabes",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    color: "var(--tk-green-active)",
    bg: "rgba(12,107,78,.12)",
  },
  {
    href: "/dashboard/grammar",
    label: "Mes règles de grammaire",
    desc: "Toutes mes règles",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
        <line x1="10" y1="3" x2="8" y2="21" />
        <line x1="16" y1="3" x2="14" y2="21" />
      </svg>
    ),
    color: "var(--tk-info)",
    bg: "rgba(46,90,138,.12)",
  },
  {
    href: "/dashboard/formulations",
    label: "Mes formulations",
    desc: "Toutes mes expressions",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    color: "var(--tk-gold-darker)",
    bg: "rgba(138,99,22,.12)",
  },
];

export default async function RevisionPage() {
  await requireStudent();

  return (
    <div className="space-y-6">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
        >
          Révision
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>
          Vocabulaire, grammaire et évaluations.
        </p>
      </div>

      <div className="space-y-2">
        {REVISION_ITEMS.map((item) => (
          <MenuCardLink key={item.href} {...item} />
        ))}
      </div>
    </div>
  );
}
