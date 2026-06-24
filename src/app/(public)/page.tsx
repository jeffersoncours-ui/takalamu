import Link from "next/link";

const STEPS = [
  {
    n: "1",
    title: "Réserve un cours d'essai",
    body: "Remplis le formulaire en 2 minutes. On te contacte pour fixer le créneau.",
  },
  {
    n: "2",
    title: "Le cours d'essai (1 h)",
    body: "En visio, avec ton enseignant. On évalue ton niveau et on définit ensemble tes objectifs.",
  },
  {
    n: "3",
    title: "Tu choisis ton abonnement",
    body: "Si tu veux continuer, tu sélectionnes une offre. Aucun engagement avant l'essai.",
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
          Cours d&apos;arabe individuels
          <br />
          &amp; étude de texte islamique
        </h1>
        <p style={{ color: "#4A463F", fontSize: 17, lineHeight: 1.65, maxWidth: 500, margin: "0 auto" }}>
          Cours personnalisés en visio avec un suivi pédagogique complet.
          Enseignant dédié selon ton genre.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
          <Link
            href="/essai"
            className="rounded-full font-bold text-white"
            style={{ background: "#0F9D6E", padding: "14px 28px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
          >
            Réserver mon cours d&apos;essai — gratuit
          </Link>
          <Link
            href="/cours-arabe"
            className="rounded-full font-semibold border"
            style={{ padding: "13px 24px", fontSize: 15, color: "#1C1A17", borderColor: "#D8D1C4", background: "#fff" }}
          >
            En savoir plus
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

      {/* Produits */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2
          className="text-center font-bold mb-8"
          style={{ fontFamily: "var(--font-spectral)", fontSize: 24, color: "#1C1A17" }}
        >
          Nos offres
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Produit A */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-4"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 20px rgba(28,26,23,.07)" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#0F9D6E" }}>Individuel</p>
              <h3
                className="font-bold mb-2"
                style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: "#1C1A17" }}
              >
                Cours d&apos;arabe
              </h3>
              <p style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.6 }}>
                1 heure par semaine en visio, 1-à-1 avec ton enseignant. Suivi pédagogique complet :
                vocabulaire, grammaire, devoirs, quiz.
              </p>
            </div>
            <ul className="space-y-2">
              {["Enseignant dédié selon le genre", "Carnet de bord & glossaire", "Devoirs corrigés", "Quiz personnalisés"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#4A463F" }}>
                  <span style={{ color: "#0F9D6E" }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <p className="text-sm mb-3" style={{ color: "#8B857A" }}>
                À partir de <strong style={{ color: "#1C1A17" }}>55 €/mois</strong>
              </p>
              <Link
                href="/cours-arabe"
                className="inline-block rounded-full font-semibold text-sm"
                style={{ color: "#0F9D6E", padding: "9px 18px", border: "1.5px solid #0F9D6E" }}
              >
                En savoir plus →
              </Link>
            </div>
          </div>

          {/* Produit B */}
          <div
            className="rounded-2xl p-7 flex flex-col gap-4"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 20px rgba(28,26,23,.07)" }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#7B6EAF" }}>Groupe</p>
              <h3
                className="font-bold mb-2"
                style={{ fontFamily: "var(--font-spectral)", fontSize: 20, color: "#1C1A17" }}
              >
                Étude de texte islamique
              </h3>
              <p style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.6 }}>
                Conférences en groupe liées à un ouvrage islamique. Série de séances, heures fixes,
                paiement unique. Notes de cours partagées.
              </p>
            </div>
            <ul className="space-y-2">
              {["Format conférence (Zoom Webinaire)", "~15 séances par cycle/livre", "Notes de cours partagées", "Évaluations liées au livre"].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#4A463F" }}>
                  <span style={{ color: "#7B6EAF" }}>✓</span> {item}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-2">
              <p className="text-sm mb-3" style={{ color: "#8B857A" }}>Paiement unique · Prochain cycle bientôt</p>
              <span
                className="inline-block rounded-full font-semibold text-sm"
                style={{ color: "#8B857A", padding: "9px 18px", border: "1.5px solid #D8D1C4" }}
              >
                Bientôt disponible
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA bas de page */}
      <section
        className="border-t py-14 px-4 text-center"
        style={{ borderColor: "#E9E3D8", background: "#fff" }}
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
        <Link
          href="/essai"
          className="rounded-full font-bold text-white inline-block"
          style={{ background: "#0F9D6E", padding: "14px 28px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
        >
          Réserver mon cours d&apos;essai gratuit
        </Link>
      </section>
    </div>
  );
}
