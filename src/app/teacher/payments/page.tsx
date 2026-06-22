import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentActions } from "./payment-actions";
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
  "1x": "1×",
  "2x": "2×",
  "3x": "3×",
  "12x": "12×",
  single: "Unique",
};

export default async function TeacherPaymentsPage() {
  await requireTeacher();
  const supabase = await createClient();

  // Pot commun : tous les paiements, pending en premier
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, product, plan, status, created_at, revolut_reference, student_id, students(profiles(full_name))",
    )
    .order("status", { ascending: true }) // pending < paid alphabetically… use created_at fallback
    .order("created_at", { ascending: false });

  // Séparer pending et le reste
  const pending = payments?.filter((p) => p.status === "pending") ?? [];
  const others = payments?.filter((p) => p.status !== "pending") ?? [];

  function studentName(p: NonNullable<typeof payments>[number]) {
    const s = Array.isArray(p.students) ? p.students[0] : p.students;
    const prof = s ? (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) : null;
    return prof?.full_name ?? "—";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-slate-900">Paiements</h1>

      {/* En attente */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-amber-700">
            En attente de confirmation ({pending.length})
          </p>
          {pending.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">{studentName(p)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Abonnement individuel
                    {p.plan ? ` · ${PLAN_LABEL[p.plan]}` : ""} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  En attente
                </span>
              </div>
              <PaymentActions paymentId={p.id} />
            </div>
          ))}
        </section>
      )}

      {/* Historique */}
      <section className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          Historique ({others.length})
        </p>
        {others.length === 0 && (
          <p className="text-sm text-slate-500">Aucun paiement traité.</p>
        )}
        {others.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">{studentName(p)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Abonnement individuel
                {p.plan ? ` · ${PLAN_LABEL[p.plan]}` : ""} ·{" "}
                {new Date(p.created_at).toLocaleDateString("fr-FR")}
              </p>
              {p.revolut_reference && (
                <p className="text-xs text-slate-400 font-mono">
                  Réf. {p.revolut_reference}
                </p>
              )}
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
