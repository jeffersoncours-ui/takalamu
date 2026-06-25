import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Choisis ton créneau d'essai",
    body: "Laisse tes informations et choisis un créneau. On te recontacte par mail pour confirmer.",
  },
  {
    n: "2",
    title: "Le cours d'essai (1 h)",
    body: "En visio, en 1-à-1 avec ton enseignant. On évalue ton niveau et on définit ensemble tes objectifs.",
  },
  {
    n: "3",
    title: "Tu choisis ton abonnement",
    body: "Si tu veux continuer, tu sélectionnes une offre. Aucun engagement avant l'essai.",
  },
];

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

export default function HomePage() {
  return (
    <div style={{ background: "#F7F4EE" }}>
      {/* Hero */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p
          className="font-bold uppercase mb-4"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Takalamu · تكلموا
        </p>
        <h1
          className="leading-tight mb-5"
          style={{
            fontFamily: "var(--font-spectral)",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 42px)",
            color: "#1C1A17",
          }}
        >
          Cours d&apos;arabe individuel en distanciel
        </h1>
        <p style={{ color: "#4A463F", fontSize: 17, lineHeight: 1.65, maxWidth: 500, margin: "0 auto" }}>
          Cours personnalisés en visio, en 1-à-1, avec un suivi pédagogique complet.
        </p>
        <div className="flex flex-col items-center gap-3 mt-8">
          <Link
            href="/essai"
            className="rounded-full font-bold text-white"
            style={{ background: "#0F9D6E", padding: "14px 28px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
          >
            Réserver mon cours d&apos;essai gratuit
          </Link>
          <Link
            href="/offres"
            className="rounded-full font-semibold border"
            style={{ padding: "13px 26px", fontSize: 15, color: "#0F9D6E", borderColor: "#0F9D6E", background: "#fff" }}
          >
            S&apos;abonner
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section
        className="border-t border-b py-14 px-4"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
      >
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-10"
            style={{ fontFamily: "var(--font-spectral)", fontSize: 24, color: "#1C1A17" }}
          >
            Comment ça marche
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full font-bold text-white"
                  style={{ width: 42, height: 42, background: "#0F9D6E", fontSize: 17, fontFamily: "var(--font-spectral)" }}
                >
                  {s.n}
                </div>
                <h3 className="font-semibold" style={{ color: "#1C1A17", fontSize: 15, fontFamily: "var(--font-spectral)" }}>
                  {s.title}
                </h3>
                <p style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Présentation — features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2
          className="text-center font-bold mb-3"
          style={{ fontFamily: "var(--font-spectral)", fontSize: 24, color: "#1C1A17" }}
        >
          Le cours d&apos;arabe individuel
        </h2>
        <p
          className="text-center mb-10"
          style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6, maxWidth: 540, margin: "0 auto 40px" }}
        >
          Un cours personnalisé, 1 heure par semaine, en visio. Avec un suivi pédagogique
          complet : carnet de bord, glossaire, grammaire et évaluations.
        </p>
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

      {/* Tarifs teaser */}
      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
      >
        <p style={{ color: "#4A463F", fontSize: 16, maxWidth: 540, margin: "0 auto" }}>
          À partir de <strong style={{ color: "#1C1A17" }}>52 €/mois</strong> en abonnement annuel,
          ou <strong style={{ color: "#1C1A17" }}>15 €/heure</strong> à la carte.
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

      {/* CTA bas de page */}
      <section
        className="border-t py-14 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#F7F4EE" }}
      >
        <h2
          className="font-bold mb-3"
          style={{ fontFamily: "var(--font-spectral)", fontSize: 26, color: "#1C1A17" }}
        >
          Prêt(e) à commencer ?
        </h2>
        <p style={{ color: "#4A463F", fontSize: 16, marginBottom: 24 }}>
          Le cours d&apos;essai dure 1 heure. Gratuit, sans engagement.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/essai"
            className="rounded-full font-bold text-white inline-block"
            style={{ background: "#0F9D6E", padding: "14px 28px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
          >
            Réserver mon cours d&apos;essai gratuit
          </Link>
          <Link
            href="/offres"
            className="rounded-full font-semibold border inline-block"
            style={{ padding: "13px 26px", fontSize: 15, color: "#0F9D6E", borderColor: "#0F9D6E", background: "#fff" }}
          >
            S&apos;abonner
          </Link>
        </div>
      </section>
    </div>
  );
}
