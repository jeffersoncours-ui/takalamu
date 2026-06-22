import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentRequestForm } from "./payment-request-form";
import type { Database } from "@/lib/supabase/database.types";

type PaymentStatus = Database["public"]["Enums"]["payment_status"];
type PaymentPlan = Database["public"]["Enums"]["payment_plan"];

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  cancelled: "Annulé",
};

const STATUS_COLOR: Record<PaymentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-slate-100 text-slate-500",
};

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
      <h1 className="text-xl font-semibold text-slate-900">Paiement</h1>

      {/* Demander un abonnement */}
      {!hasActiveSub && (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-800">
            Demander un abonnement individuel
          </p>
          <p className="text-xs text-slate-500">
            Choisis ton plan, puis transmets la référence générée à ton enseignant pour
            confirmer le paiement via Revolut.
          </p>
          <PaymentRequestForm />
        </section>
      )}

      {/* Historique */}
      <section className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Historique ({payments?.length ?? 0})
        </p>
        {!payments?.length && (
          <p className="text-sm text-slate-500">Aucun paiement enregistré.</p>
        )}
        {payments?.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                Abonnement individuel
                {p.plan ? ` — ${PLAN_LABEL[p.plan]}` : ""}
              </p>
              {p.revolut_reference && (
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Réf. {p.revolut_reference}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">
                {new Date(p.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[p.status]}`}
            >
              {STATUS_LABEL[p.status]}
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
