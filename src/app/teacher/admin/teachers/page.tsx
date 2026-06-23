import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InviteTeacherForm } from "./invite-form";

export default async function AdminTeachersPage() {
  await requireAdmin();
  const supabase = await createClient();

  // L'admin lit tous les profils enseignants (policy profiles_admin_all).
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, display_name, profiles(full_name, email, gender, role)")
    .order("created_at", { ascending: true });

  const items = (teachers ?? []).map((t) => {
    const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    return {
      id: t.id,
      name: profile?.full_name ?? t.display_name ?? "Enseignant",
      email: profile?.email ?? "—",
      gender: profile?.gender ?? null,
      isAdmin: profile?.role === "admin",
    };
  });

  return (
    <div className="space-y-6">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Enseignants
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} compte{items.length > 1 ? "s" : ""} · administration
        </p>
      </div>

      {/* Liste */}
      <div className="flex flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 rounded-[18px] p-4"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
          >
            <div
              className="flex shrink-0 items-center justify-center rounded-[13px] text-white font-bold"
              style={{ width: 46, height: 46, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 17 }}
            >
              {t.name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="font-bold truncate"
                  style={{ color: "#1C1A17", fontSize: 15, fontFamily: "var(--font-spectral)" }}
                >
                  {t.name}
                </span>
                {t.isAdmin && (
                  <span
                    className="shrink-0 rounded-full font-bold"
                    style={{ padding: "2px 8px", background: "#EAEFFD", border: "1px solid #AEBEF2", color: "#2C49B8", fontSize: 10 }}
                  >
                    Admin
                  </span>
                )}
              </div>
              <p className="truncate" style={{ color: "#8B857A", fontSize: 13 }}>{t.email}</p>
            </div>
            {t.gender && (
              <span
                className="shrink-0 rounded-full font-semibold"
                style={{ padding: "3px 10px", background: "#FBF9F5", border: "1px solid #EFEAE0", color: "#6B6459", fontSize: 11 }}
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
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 19, color: "#1C1A17" }}
        >
          Inviter un enseignant
        </h2>
        <p className="px-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
          Un e-mail d&apos;invitation est envoyé : l&apos;enseignant choisit son mot de passe et accède
          directement à son espace.
        </p>
        <InviteTeacherForm />
      </div>
    </div>
  );
}
