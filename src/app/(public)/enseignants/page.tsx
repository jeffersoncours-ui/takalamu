import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nos enseignants — Takalamu",
  description: "Un enseignant homme pour les hommes, une enseignante femme pour les femmes.",
};

export default async function EnseignantsPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, display_name, bio, profiles(gender)")
    .order("created_at");

  return (
    <div style={{ background: "#F7F4EE" }}>
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          L&apos;équipe
        </p>
        <h1
          className="leading-tight mb-4"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
        >
          Nos enseignants
        </h1>
        <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
          Un enseignant homme pour les cours hommes, une enseignante femme pour les cours femmes.
          Chaque élève est suivi par le même enseignant tout au long de son parcours.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        {teachers && teachers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {teachers.map((t) => {
              const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
              const gender = profile?.gender;
              return (
                <div
                  key={t.id}
                  className="rounded-2xl p-7 flex flex-col gap-4"
                  style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 20px rgba(28,26,23,.07)" }}
                >
                  {/* Avatar placeholder */}
                  <div
                    className="flex items-center justify-center rounded-full text-white font-bold text-2xl"
                    style={{
                      width: 72,
                      height: 72,
                      background: gender === "f" ? "#7B6EAF" : "#0F9D6E",
                      fontFamily: "var(--font-spectral)",
                    }}
                  >
                    {t.display_name?.[0]?.toUpperCase() ?? "?"}
                  </div>

                  <div>
                    <p
                      className="text-xs font-semibold uppercase tracking-widest mb-1"
                      style={{ color: gender === "f" ? "#7B6EAF" : "#0F9D6E" }}
                    >
                      {gender === "f" ? "Cours femmes" : "Cours hommes"}
                    </p>
                    <h2
                      className="font-bold mb-2"
                      style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: "#1C1A17" }}
                    >
                      {t.display_name ?? "Enseignant"}
                    </h2>
                    {t.bio ? (
                      <p style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.6 }}>{t.bio}</p>
                    ) : (
                      <p style={{ color: "#8B857A", fontSize: 14, lineHeight: 1.6, fontStyle: "italic" }}>
                        Présentation à venir.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <p style={{ color: "#8B857A" }}>Présentation des enseignants à venir.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
      >
        <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-spectral)", fontSize: 22, color: "#1C1A17" }}>
          Rencontre ton enseignant
        </h2>
        <p style={{ color: "#4A463F", fontSize: 15, marginBottom: 20 }}>
          Le cours d&apos;essai est l&apos;occasion d&apos;en apprendre plus sur la méthode et de poser toutes tes questions.
        </p>
        <Link
          href="/essai"
          className="rounded-full font-bold text-white inline-block"
          style={{ background: "#0F9D6E", padding: "13px 26px", fontSize: 15, boxShadow: "0 6px 16px rgba(15,157,110,.30)" }}
        >
          Réserver mon cours d&apos;essai
        </Link>
      </section>
    </div>
  );
}
