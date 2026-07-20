import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteTeacherForm } from "./invite-form";

export default async function AdminTeachersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // L'admin lit tous les profils enseignants (policy profiles_admin_all).
  const { data: teachers, error: teachersError } = await supabase
    .from("teachers")
    .select("id, display_name, profiles(full_name, email, gender, role, avatar_url)")
    .order("created_at", { ascending: true });

  if (teachersError) console.error("admin/teachers query failed:", teachersError.message);

  const avatarPaths = (teachers ?? [])
    .map((t) => (Array.isArray(t.profiles) ? t.profiles[0]?.avatar_url : t.profiles?.avatar_url))
    .filter((p): p is string => !!p);

  let signedAvatars: { path: string; signedUrl: string }[] = [];
  if (avatarPaths.length > 0) {
    const { data: signedList } = await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600);
    signedAvatars = (signedList ?? [])
      .filter((s) => !!s.path && !!s.signedUrl)
      .map((s) => ({ path: s.path as string, signedUrl: s.signedUrl as string }));
  }

  const items = (teachers ?? []).map((t) => {
    const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    return {
      id: t.id,
      name: profile?.full_name ?? t.display_name ?? "Enseignant",
      email: profile?.email ?? "—",
      gender: profile?.gender ?? null,
      isAdmin: profile?.role === "admin",
      avatarUrl: profile?.avatar_url
        ? (signedAvatars.find((s) => s.path === profile.avatar_url)?.signedUrl ?? null)
        : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
        >
          Enseignants
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>
          {items.length} compte{items.length > 1 ? "s" : ""} · administration
        </p>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-[18px] p-4"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 10px 22px -16px rgba(10,20,15,.4)" }}
          >
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] font-bold"
              style={{
                width: 46,
                height: 46,
                background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
                color: "var(--tk-gold-light)",
                fontFamily: "var(--font-spectral)",
                fontSize: 17,
              }}
            >
              {t.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                t.name[0]?.toUpperCase() ?? "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold truncate"
                  style={{ color: "var(--tk-ink-text)", fontSize: 15, fontFamily: "var(--font-spectral)" }}
                >
                  {t.name}
                </span>
                {t.isAdmin && (
                  <span
                    className="shrink-0 rounded-full font-bold"
                    style={{ padding: "2px 8px", background: "rgba(46,90,138,.10)", border: "1px solid rgba(46,90,138,.32)", color: "var(--tk-info)", fontSize: 10 }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <p className="truncate" style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>{t.email}</p>
            </div>
            {t.gender && (
              <span
                className="shrink-0 rounded-full font-semibold"
                style={{ padding: "3px 10px", background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)", color: "var(--tk-ink-text-soft)", fontSize: 11 }}
              >
                {t.gender === "m" ? "Hommes" : "Femmes"}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Inviter */}
      <div className="space-y-3">
        <h2
          className="px-0.5"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 19, color: "var(--tk-ink-text)" }}
        >
          Inviter un enseignant
        </h2>
        <p className="px-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>
          Un e-mail d&apos;invitation est envoyé : l&apos;enseignant choisit son mot de passe et accède
          directement à son espace.
        </p>
        <InviteTeacherForm />
      </div>
    </div>
  );
}
