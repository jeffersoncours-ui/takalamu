import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TrialCard } from "./trial-card";

export const metadata = { title: "Cours d'essai — Takalamu" };

export default async function TrialsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: trials } = await supabase
    .from("trial_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const pending = trials?.filter((t) => t.status === "pending") ?? [];
  const other = trials?.filter((t) => t.status !== "pending") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="font-bold"
          style={{ fontFamily: "var(--font-spectral)", fontSize: 24, color: "#1C1A17" }}
        >
          Cours d&apos;essai
        </h1>
        <p className="text-sm mt-1" style={{ color: "#8B857A" }}>
          Demandes reçues via le site — filtrées selon votre genre.
        </p>
      </div>

      {pending.length === 0 && other.length === 0 && (
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p style={{ color: "#8B857A" }}>Aucune demande pour l&apos;instant.</p>
        </div>
      )}

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#8B857A", fontSize: 11 }}>
            En attente ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((t) => (
              <TrialCard key={t.id} trial={t} />
            ))}
          </div>
        </section>
      )}

      {other.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#8B857A", fontSize: 11 }}>
            Traités ({other.length})
          </h2>
          <div className="space-y-3">
            {other.map((t) => (
              <TrialCard key={t.id} trial={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
