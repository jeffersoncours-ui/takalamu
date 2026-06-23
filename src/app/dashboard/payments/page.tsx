import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentRequestForm } from "./payment-request-form";
import { StatusBadge, paymentBadge } from "@/components/status-badge";
import type { Database } from "@/lib/supabase/database.types";

type PaymentPlan = Database["public"]["Enums"]["payment_plan"];

const PLAN_LABEL: Record<PaymentPlan, string> = {
  "1x": "Paiement unique",
  "2x": "2× (2 versements)",
  "3x": "3× avec réduction",
  "12x": "12× mensuel",
  single: "Paiement unique (groupe)",
};

export default async function PaymentsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, product, plan, status, created_at, revolut_reference")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const hasActiveSub = payments?.some(
    (p) => p.product === "individual_sub" && ["paid", "pending"].includes(p.status),
  );

  return (
    <div className="space-y-6">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Mes paiements
      </h1>

      {/* Demander un abonnement */}
      {!hasActiveSub && (
        <section
          className="rounded-[18px] p-4 space-y-3"
          style={{ background: "#fff", border: "1px solid #C8EBDB", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
        >
          <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>
            Demander un abonnement individuel
          </p>
          <p style={{ color: "#8B857A", fontSize: 12 }}>
            Choisis ton plan, puis transmets la référence générée à ton enseignant pour
            confirmer le paiement via Revolut.
          </p>
          <PaymentRequestForm />
        </section>
      )}

      {/* Historique */}
      <section className="space-y-2">
        <p
          className="px-0.5 font-bold uppercase"
          style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
        >
          Historique
        </p>
        {!payments?.length && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun paiement enregistré.</p>
        )}
        {payments?.map((p) => {
          const badge = paymentBadge(p.status);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-[14px]"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
            >
              <div>
                <p className="font-bold" style={{ color: "#1C1A17", fontSize: 14 }}>
                  Abonnement individuel
                  {p.plan ? ` — ${PLAN_LABEL[p.plan]}` : ""}
                </p>
                {p.revolut_reference && (
                  <p className="font-mono mt-0.5" style={{ color: "#8B857A", fontSize: 11 }}>
                    Réf. {p.revolut_reference}
                  </p>
                )}
                <p className="mt-0.5" style={{ color: "#A8A29E", fontSize: 11 }}>
                  {new Date(p.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge hue={badge.hue} label={badge.label} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
