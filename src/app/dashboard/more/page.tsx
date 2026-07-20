import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { ChangePasswordForm } from "@/components/change-password-form";
import { MenuCardLink } from "@/components/menu-card-link";

const MENU_ITEMS = [
  {
    href: "/dashboard/profile",
    label: "Mon profil",
    desc: "Coordonnées, date de naissance, parcours",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    color: "var(--tk-warning)",
    bg: "rgba(184,120,42,.12)",
  },
  {
    href: "/dashboard/reglement",
    label: "Règlement intérieur",
    desc: "Règles de conduite pendant les cours en direct",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="13" x2="15" y2="13" />
        <line x1="9" y1="17" x2="15" y2="17" />
      </svg>
    ),
    color: "var(--tk-green-active)",
    bg: "rgba(12,107,78,.12)",
  },
];

export default async function MorePage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  let avatarUrl: string | null = null;
  if (profile.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(profile.avatar_url, 3600);
    avatarUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="space-y-6">
      {/* Hero profil */}
      <div
        className="hachure-ink rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))",
          boxShadow: "var(--tk-shadow-hero)",
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden rounded-full font-semibold text-xl shrink-0"
          style={{
            width: 58,
            height: 58,
            background: "rgba(255,255,255,.1)",
            border: "1.5px solid rgba(199,154,62,.5)",
            color: "var(--tk-cream-text)",
            fontFamily: "var(--font-spectral)",
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.full_name?.[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <div>
          <p className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-spectral)", color: "var(--tk-cream-text)" }}>
            {profile.full_name ?? "—"}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--tk-sage-bright)" }}>Élève</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-2">
        {MENU_ITEMS.map((item) => (
          <MenuCardLink key={item.href} {...item} />
        ))}
      </div>

      <ChangePasswordForm />

      {/* Déconnexion */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(163,52,42,.10)", color: "var(--tk-danger)", border: "1px solid rgba(163,52,42,.3)" }}
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
