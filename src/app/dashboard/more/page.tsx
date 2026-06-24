import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

const MENU_ITEMS = [
  {
    href: "/dashboard/evaluations",
    label: "Évaluations",
    desc: "Quiz vocabulaire auto-généré",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: "#D97706",
    bg: "#FEF3C7",
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
    color: "#0F9D6E",
    bg: "#ECFAF4",
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
    color: "#3E63DD",
    bg: "#EAEFFD",
  },
  {
    href: "/dashboard/payments",
    label: "Mes paiements",
    desc: "Abonnement et historique",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    color: "#8E4EC6",
    bg: "#F6EDFC",
  },
];

export default async function MorePage() {
  const { profile } = await requireStudent();

  return (
    <div className="space-y-6">
      {/* Hero profil */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "#0A553F", boxShadow: "0 16px 32px rgba(10,85,63,.32)" }}
      >
        <div
          className="flex items-center justify-center rounded-full text-white font-semibold text-xl shrink-0"
          style={{ width: 58, height: 58, background: "rgba(255,255,255,.18)", fontFamily: "var(--font-spectral)" }}
        >
          {profile.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-white font-semibold text-lg leading-tight" style={{ fontFamily: "var(--font-spectral)" }}>
            {profile.full_name ?? "—"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#9FE3C8" }}>Élève</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 bg-white rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
            style={{ boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
          >
            <span
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 44, height: 44, background: item.bg, color: item.color }}
            >
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm" style={{ color: "#1C1A17" }}>{item.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "#8B857A" }}>{item.desc}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Déconnexion */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#FDECEC", color: "#B4292E", border: "1px solid #F3B0B2" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
