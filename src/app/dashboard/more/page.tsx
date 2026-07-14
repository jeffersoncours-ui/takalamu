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
    color: "#B45309",
    bg: "#FEF3C7",
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
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ background: "#0A553F", boxShadow: "0 16px 32px rgba(10,85,63,.32)" }}
      >
        <div
          className="flex items-center justify-center overflow-hidden rounded-full text-white font-semibold text-xl shrink-0"
          style={{ width: 58, height: 58, background: "rgba(255,255,255,.18)", fontFamily: "var(--font-spectral)" }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            profile.full_name?.[0]?.toUpperCase() ?? "?"
          )}
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
          <MenuCardLink key={item.href} {...item} />
        ))}
      </div>

      <ChangePasswordForm />

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
