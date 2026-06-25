import Link from "next/link";
import type { Metadata } from "next";
import { ANNUAL_PLANS, HOURLY_PRICE_EUROS, getAnnualPlan } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Tarifs — Takalamu",
  description:
    "Cours d'arabe individuel : abonnement annuel (4 séances/mois) à partir de 52 €/mois, ou heure à la carte à 15 €. Cours d'essai gratuit obligatoire avant tout paiement.",
};

export default function OffresPage() {
  const best = getAnnualPlan("1x");

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
          style={{ fontFamily: "var(--font-barlow)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
        >
          Deux façons d&apos;apprendre
        </h1>
        <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65, maxWidth: 480, margin: "0 auto" }}>
          Un abonnement annuel pour un suivi régulier, ou des heures à la carte, sans engagement.
        </p>
      </section>

      {/* Bandeau essai obligatoire */}
      <section className="mx-auto max-w-3xl px-4 pb-8">
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: "#E8F7F1", border: "1.5px solid #0F9D6E" }}
        >
          <span
            className="flex items-center justify-center rounded-full text-white shrink-0"
            style={{ width: 30, height: 30, background: "#0F9D6E", fontSize: 16 }}
          >
            ✓
          </span>
          <p style={{ color: "#0A6B4E", fontSize: 14, lineHeight: 1.5 }}>
            Le <strong>cours d&apos;essai gratuit est obligatoire</strong> avant tout paiement :
            abonnement comme heure à la carte. On évalue ton niveau, puis tu choisis.
          </p>
        </div>
      </section>

      {/* 2 cartes cliquables */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Carte 1 — Abonnement annuel */}
          <Link
            href="/inscription?offre=annuel"
            className="group block rounded-2xl p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
            style={{ background: "#0F9D6E", boxShadow: "0 10px 30px rgba(15,157,110,.30)" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "rgba(255,255,255,.75)" }}
              >
                ✦ Le plus populaire
              </p>
              <h2 className="font-bold" style={{ fontFamily: "var(--font-barlow)", fontSize: 23, color: "#fff" }}>
                Abonnement annuel
              </h2>
              <p className="mt-1" style={{ color: "rgba(255,255,255,.85)", fontSize: 13.5 }}>
                4 séances d&apos;1 h par mois · 48 séances sur l&apos;année, à partir de
              </p>
            </div>

            <div>
              <div>
                <span className="font-bold" style={{ fontFamily: "var(--font-barlow)", fontSize: 34, color: "#fff" }}>
                  {best.pricePerMonth} €
                </span>
                <span style={{ color: "rgba(255,255,255,.8)", fontSize: 14 }}> /mois</span>
              </div>
              <p style={{ color: "#A8F0D8", fontSize: 13, fontWeight: 600, marginTop: 2 }}>
                soit {best.savings} € d&apos;économie (paiement en une fois)*
              </p>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 11, marginTop: 3 }}>
                * comparé au prix à l&apos;heure de {HOURLY_PRICE_EUROS} € ({HOURLY_PRICE_EUROS * 48} € pour 48 h)
              </p>
            </div>

            {/* Les 4 niveaux de paiement */}
            <ul className="space-y-1.5 mt-1">
              {ANNUAL_PLANS.map((plan) => (
                <li
                  key={plan.key}
                  className="flex items-center justify-between text-sm"
                  style={{ color: "rgba(255,255,255,.92)" }}
                >
                  <span>
                    {plan.label}
                    {plan.installments > 1 ? ` de ${plan.installmentAmount} €` : ""}
                  </span>
                  <span className="font-semibold tabular-nums">{plan.total} €</span>
                </li>
              ))}
            </ul>

            <span
              className="mt-auto inline-block rounded-full font-bold text-center"
              style={{ background: "#fff", color: "#0A6B4E", padding: "11px 0", fontSize: 14 }}
            >
              S&apos;abonner →
            </span>
          </Link>

          {/* Carte 2 — Heure à la carte */}
          <Link
            href="/inscription?offre=heure"
            className="group block rounded-2xl p-6 flex flex-col gap-4 transition-transform hover:-translate-y-1"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 20px rgba(28,26,23,.06)" }}
          >
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: "#8B857A" }}
              >
                Sans engagement
              </p>
              <h2 className="font-bold" style={{ fontFamily: "var(--font-barlow)", fontSize: 23, color: "#1C1A17" }}>
                Heure à la carte
              </h2>
              <p className="mt-1" style={{ color: "#6B6560", fontSize: 13.5 }}>
                Une séance d&apos;1 h, quand tu veux. Idéal pour avancer à ton rythme.
              </p>
            </div>

            <div>
              <span className="font-bold" style={{ fontFamily: "var(--font-barlow)", fontSize: 34, color: "#1C1A17" }}>
                {HOURLY_PRICE_EUROS} €
              </span>
              <span style={{ color: "#8B857A", fontSize: 14 }}> /heure</span>
            </div>

            <ul className="space-y-2 mt-1">
              {[
                "Aucun abonnement, aucune reconduction",
                "Le même suivi pédagogique qu'en abonnement",
                "Tu réserves séance par séance",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#4A463F" }}>
                  <span style={{ color: "#0F9D6E" }}>✓</span> {item}
                </li>
              ))}
            </ul>

            <span
              className="mt-auto inline-block rounded-full font-bold text-center"
              style={{ background: "#F0EBE2", color: "#0A6B4E", padding: "11px 0", fontSize: 14 }}
            >
              S&apos;abonner →
            </span>
          </Link>
        </div>

        <p className="mt-6 text-sm text-center" style={{ color: "#8B857A" }}>
          Toutes les formules : cours 1-à-1 en visio avec le même enseignant, suivi pédagogique complet.
        </p>
      </section>

      {/* CTA */}
      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
      >
        <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-barlow)", fontSize: 22, color: "#1C1A17" }}>
          Commençons par un cours d&apos;essai
        </h2>
        <p style={{ color: "#4A463F", fontSize: 15, marginBottom: 20 }}>
          Gratuit, 1 heure, sans engagement. Tu choisis ton offre ensuite.
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
