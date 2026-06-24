import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cours d'arabe individuel — Takalamu",
  description: "Cours d'arabe 1-à-1 en visio avec un suivi pédagogique complet : vocabulaire, grammaire, devoirs et quiz personnalisés.",
};

const FEATURES = [
  {
    title: "1 heure par semaine, en visio",
    body: "Cours individuels sur Zoom ou Google Meet. Aucun déplacement, aucun matériel particulier requis.",
  },
  {
    title: "Suivi pédagogique complet",
    body: "Après chaque séance : récapitulatif, vocabulaire du jour, règle de grammaire, et devoir personnalisé.",
  },
  {
    title: "Enseignant dédié selon ton genre",
    body: "Un enseignant homme pour les hommes, une enseignante femme pour les femmes — conformément à l'éthique islamique.",
  },
  {
    title: "Progression à ton rythme",
    body: "Un programme structuré, du déchiffrage à la lecture orale en passant par la grammaire, avec un curseur de progression individuel.",
  },
  {
    title: "Devoirs et évaluations",
    body: "Exercices corrigés, quiz auto-générés depuis ton propre glossaire. Aucune saisie en arabe — QCM uniquement.",
  },
  {
    title: "Messagerie directe",
    body: "Chat en temps réel avec ton enseignant, sans avoir à partager ton numéro de téléphone.",
  },
];

export default function CoursArabePage() {
  return (
    <div style={{ background: "#F7F4EE" }}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Produit A
        </p>
        <h1
          className="leading-tight mb-4"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
        >
          Cours d&apos;arabe individuel
        </h1>
        <p style={{ color: "#4A463F", fontSize: 17, lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
          Un cours personnalisé, 1 heure par semaine, en visio. Avec un suivi pédagogique
          complet : carnet de bord, glossaire, grammaire et évaluations.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link
            href="/essai"
            className="rounded-full font-bold text-white"
            style={{ background: "#0F9D6E", padding: "13px 26px", fontSize: 15, boxShadow: "0 6px 16px rgba(15,157,110,.30)" }}
          >
            Réserver mon cours d&apos;essai
          </Link>
          <Link
            href="/offres"
            className="rounded-full font-semibold border"
            style={{ padding: "12px 24px", fontSize: 15, color: "#1C1A17", borderColor: "#D8D1C4", background: "#fff" }}
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-5"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 4px 14px rgba(28,26,23,.06)" }}
            >
              <div
                className="flex items-center justify-center rounded-xl mb-4"
                style={{ width: 40, height: 40, background: "#E8F7F1" }}
              >
                <span style={{ color: "#0F9D6E", fontSize: 20 }}>✦</span>
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#1C1A17", fontSize: 15, fontFamily: "var(--font-spectral)" }}>
                {f.title}
              </h3>
              <p style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8" }}
      >
        <p style={{ color: "#4A463F", fontSize: 16 }}>
          À partir de <strong style={{ color: "#1C1A17" }}>55 €/mois</strong> en abonnement annuel.
          Cours d&apos;essai <strong style={{ color: "#1C1A17" }}>gratuit</strong>, sans engagement.
        </p>
        <Link
          href="/offres"
          className="inline-block mt-4 rounded-full font-semibold text-sm"
          style={{ color: "#0F9D6E", padding: "10px 20px", border: "1.5px solid #0F9D6E" }}
        >
          Voir tous les tarifs →
        </Link>
      </section>
    </div>
  );
}
