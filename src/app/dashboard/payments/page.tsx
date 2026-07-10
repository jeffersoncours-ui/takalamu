import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { paypalMeUrl } from "@/lib/paypal";
import { StatusBadge, paymentBadge } from "@/components/status-badge";
import type { Database } from "@/lib/supabase/database.types";

type PaymentPlan = Database["public"]["Enums"]["payment_plan"];

// Libellés de secours pour les paiements historiques (formules abandonnées) —
// les nouveaux paiements portent leur propre `label` libre, saisi par l'enseignant.
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

export default async function PaymentsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, product, plan, label, status, created_at, revolut_reference, amount_cents")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Mes paiements
      </h1>
      <p className="px-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
        Ton enseignant t&apos;envoie une demande de paiement après chaque cours ou
        arrangement. Le bouton PayPal apparaît ici dès qu&apos;une demande est en attente.
      </p>

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
          const paypalUrl =
            p.status === "pending" && p.amount_cents ? paypalMeUrl(p.amount_cents) : null;
          const label =
            p.label ?? `${PRODUCT_LABEL[p.product] ?? p.product}${p.plan ? ` — ${PLAN_LABEL[p.plan]}` : ""}`;
          return (
            <div
              key={p.id}
              className="rounded-[16px] px-4 py-[14px]"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold" style={{ color: "#1C1A17", fontSize: 14 }}>
                    {label}
                  </p>
                  {p.amount_cents != null && (
                    <p className="mt-0.5 font-semibold" style={{ color: "#0F9D6E", fontSize: 13 }}>
                      {(p.amount_cents / 100).toFixed(2).replace(".", ",")} €
                    </p>
                  )}
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

              {paypalUrl && (
                <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: "1px solid #F4F0E8" }}>
                  <a
                    href={paypalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 items-center justify-center rounded-[12px] font-bold text-white"
                    style={{ background: "#0F9D6E", fontSize: 13, boxShadow: "0 6px 13px rgba(15,157,110,.26)" }}
                  >
                    Payer {((p.amount_cents ?? 0) / 100).toFixed(2).replace(".", ",")} € via PayPal
                  </a>
                  {p.revolut_reference && (
                    <p className="text-center" style={{ color: "#8B857A", fontSize: 11 }}>
                      Indique la référence {p.revolut_reference} dans la note du paiement.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
