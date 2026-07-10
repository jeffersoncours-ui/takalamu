import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentActions } from "./payment-actions";
import { SendPaymentForm } from "./send-payment-form";
import { StatusBadge, paymentBadge } from "@/components/status-badge";
import type { Database } from "@/lib/supabase/database.types";

type PaymentPlan = Database["public"]["Enums"]["payment_plan"];

// Libellés de secours pour les paiements historiques (formules abandonnées) —
// les nouvelles demandes portent leur propre `label` libre.
const PLAN_LABEL: Record<PaymentPlan, string> = {
  "1x": "Annuel 1×",
  "2x": "Annuel 2×",
  "3x": "Annuel 3×",
  "12x": "Annuel 12×",
  hourly: "Heure à la carte",
  monthly: "Mensuel",
  single: "Paiement unique",
};

const PRODUCT_LABEL: Record<string, string> = {
  individual_sub: "Abonnement individuel",
  individual_hour: "Cours d'arabe",
  book: "Cours de groupe",
};

export default async function TeacherPaymentsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: studentRows } = await supabase
    .from("students")
    .select("id, profiles(full_name)")
    .eq("status", "active");

  const students = (studentRows ?? []).map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    return { id: s.id, name: profile?.full_name ?? "Élève" };
  });

  // Pot commun : tous les paiements, pending en premier
  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, product, plan, label, status, created_at, revolut_reference, student_id, students(profiles(full_name))",
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

  const paidCount = others.filter((p) => p.status === "paid").length;

  return (
    <div className="space-y-6">
      {/* Hero teal */}
      <div
        className="relative overflow-hidden rounded-[22px] p-[22px]"
        style={{ background: "#0A553F", boxShadow: "0 14px 28px rgba(10,85,63,.28)" }}
      >
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          className="absolute"
          style={{ top: -30, right: -30, opacity: 0.14 }}
          fill="none"
          stroke="#9FE3C8"
          strokeWidth={1.5}
        >
          <rect x="40" y="40" width="100" height="100" rx="6" transform="rotate(45 90 90)" />
          <rect x="20" y="20" width="140" height="140" rx="8" transform="rotate(45 90 90)" />
        </svg>
        <div className="relative">
          <div style={{ color: "#9FE3C8", fontSize: 12, fontWeight: 600 }}>Paiements confirmés</div>
          <div
            className="leading-none mt-1.5"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#fff" }}
          >
            {paidCount}
          </div>
          <div className="mt-2" style={{ color: "#9FE3C8", fontSize: 12, fontWeight: 500 }}>
            {pending.length} paiement{pending.length > 1 ? "s" : ""} en attente de confirmation
          </div>
        </div>
      </div>

      <SendPaymentForm students={students} />

      {/* En attente */}
      {pending.length > 0 && (
        <section className="space-y-2">
          <p
            className="px-0.5 font-bold uppercase"
            style={{ color: "#9A6206", fontSize: 12, letterSpacing: ".06em" }}
          >
            En attente de confirmation ({pending.length})
          </p>
          {pending.map((p) => (
            <div
              key={p.id}
              className="rounded-[16px] px-4 py-[14px] space-y-2.5"
              style={{ background: "#FDF4E3", border: "1.4px solid #F4D193" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{studentName(p)}</p>
                  <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 12 }}>
                    {p.label ?? (PRODUCT_LABEL[p.product] ?? p.product)}
                    {p.plan ? ` · ${PLAN_LABEL[p.plan]}` : ""} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <StatusBadge hue="amber" label="En attente" />
              </div>
              <PaymentActions paymentId={p.id} />
            </div>
          ))}
        </section>
      )}

      {/* Historique */}
      <section className="space-y-2">
        <p
          className="px-0.5 font-bold uppercase"
          style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
        >
          Historique ({others.length})
        </p>
        {others.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun paiement traité.</p>
        )}
        {others.map((p) => {
          const badge = paymentBadge(p.status);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-[14px]"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
            >
              <div>
                <p className="font-bold" style={{ color: "#1C1A17", fontSize: 14 }}>{studentName(p)}</p>
                <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 12 }}>
                  {p.label ?? (PRODUCT_LABEL[p.product] ?? p.product)}
                  {p.plan ? ` · ${PLAN_LABEL[p.plan]}` : ""} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("fr-FR")}
                </p>
                {p.revolut_reference && (
                  <p className="font-mono" style={{ color: "#A8A29E", fontSize: 11 }}>
                    Réf. {p.revolut_reference}
                  </p>
                )}
              </div>
              <StatusBadge hue={badge.hue} label={badge.label} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
