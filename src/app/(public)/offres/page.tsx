import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, MONTHLY_PRICE_EUROS } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Tarifs — Takalamu",
  description: "Cours d'arabe individuel : mensuel 60 €/mois ou abonnement annuel à partir de 55 €/mois. Cours d'essai gratuit.",
};

export default function OffresPage() {
  return (
    <div style={{ background: "#F7F4EE" }}>
      {/* Header */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Tarifs
        </p>
        <h1
          className="leading-tight mb-4"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
        >
          Des offres simples et transparentes
        </h1>
        <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
          Commence par un cours d&apos;essai gratuit d&apos;1 heure. Tu choisis ensuite ton abonnement, sans engagement.
        </p>
      </section>

      {/* Trial card */}
      <section className="mx-auto max-w-3xl px-4 pb-6">
        <div
          className="rounded-2xl p-6 flex items-center gap-5"
          style={{ background: "#E8F7F1", border: "2px solid #0F9D6E" }}
        >
          <div
            className="flex items-center justify-center rounded-full text-white font-bold shrink-0"
            style={{ width: 52, height: 52, background: "#0F9D6E", fontFamily: "var(--font-spectral)", fontSize: 20 }}
          >
            1
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1" style={{ fontFamily: "var(--font-spectral)", fontSize: 18, color: "#1C1A17" }}>
              Cours d&apos;essai
            </h3>
            <p style={{ color: "#4A463F", fontSize: 14 }}>
              1 heure en visio avec ton enseignant. Évaluation du niveau, découverte de la méthode.
              Sans engagement.
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-bold" style={{ fontFamily: "var(--font-spectral)", fontSize: 26, color: "#0F9D6E" }}>
              Gratuit
            </p>
            <p className="text-xs" style={{ color: "#6B6560" }}>1 heure</p>
          </div>
        </div>
      </section>

      {/* Plans grid */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2
          className="font-semibold mb-5"
          style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: "#1C1A17" }}
        >
          Abonnement — Cours d&apos;arabe individuel
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Monthly plan */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-3"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 4px 14px rgba(28,26,23,.06)" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#8B857A" }}>
                Sans engagement
              </p>
              <h3 className="font-bold" style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: "#1C1A17" }}>
                Mensuel
              </h3>
            </div>
            <div>
              <span className="font-bold" style={{ fontFamily: "var(--font-spectral)", fontSize: 34, color: "#1C1A17" }}>
                {MONTHLY_PRICE_EUROS} €
              </span>
              <span className="text-sm" style={{ color: "#8B857A" }}>/mois</span>
            </div>
            <p className="text-sm" style={{ color: "#6B6560" }}>4 séances d&apos;1 h par mois. Résiliable à tout moment.</p>
          </div>

          {/* Annual plans */}
          {PLANS.filter((p) => p.key !== "monthly").map((plan, i) => (
            <div
              key={plan.key}
              className="rounded-2xl p-6 flex flex-col gap-3"
              style={{
                background: i === 0 ? "#0F9D6E" : "#fff",
                border: i === 0 ? "none" : "1px solid #EFEAE0",
                boxShadow: i === 0 ? "0 8px 24px rgba(15,157,110,.28)" : "0 4px 14px rgba(28,26,23,.06)",
              }}
            >
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: i === 0 ? "rgba(255,255,255,.7)" : "#8B857A" }}
                >
                  {plan.installments === 1 ? "Annuel · 1 paiement" : `Annuel · ${plan.installments} paiements`}
                  {i === 0 && " ✦ Meilleure offre"}
                </p>
                <h3
                  className="font-bold"
                  style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: i === 0 ? "#fff" : "#1C1A17" }}
                >
                  {plan.pricePerMonth} €/mois
                </h3>
              </div>
              <div>
                <span
                  className="font-bold"
                  style={{ fontFamily: "var(--font-spectral)", fontSize: 28, color: i === 0 ? "#fff" : "#1C1A17" }}
                >
                  {plan.installmentAmount} €
                </span>
                <span className="text-sm" style={{ color: i === 0 ? "rgba(255,255,255,.75)" : "#8B857A" }}>
                  {plan.installments > 1 ? ` × ${plan.installments} paiements` : " · paiement unique"}
                </span>
              </div>
              {plan.savings && (
                <p className="text-sm font-semibold" style={{ color: i === 0 ? "#A8F0D8" : "#0F9D6E" }}>
                  Économie de {plan.savings} € sur l&apos;année
                </p>
              )}
              <p className="text-sm" style={{ color: i === 0 ? "rgba(255,255,255,.8)" : "#6B6560" }}>
                Total annuel : {plan.total} €
              </p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-sm text-center" style={{ color: "#8B857A" }}>
          Toutes les offres incluent 4 séances d&apos;1 h par mois avec le même enseignant.
        </p>
      </section>

      {/* CTA */}
      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
      >
        <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-spectral)", fontSize: 22, color: "#1C1A17" }}>
          Commençons par un cours d&apos;essai
        </h2>
        <p style={{ color: "#4A463F", fontSize: 15, marginBottom: 20 }}>
          Tu choisiras ton abonnement après. Aucun engagement avant l&apos;essai.
        </p>
        <Link
          href="/essai"
          className="rounded-full font-bold text-white inline-block"
          style={{ background: "#0F9D6E", padding: "13px 26px", fontSize: 15, boxShadow: "0 6px 16px rgba(15,157,110,.30)" }}
        >
          Réserver mon cours d&apos;essai gratuit
        </Link>
      </section>
    </div>
  );
}
