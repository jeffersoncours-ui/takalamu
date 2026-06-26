import Link from "next/link";
import { TestimonialsStack } from "./testimonials";
import { ColorTweaker } from "./color-tweaker";
import { VitrineBgWrapper } from "./vitrine-bg-wrapper";

function GreenLast({ text }: { text: string }) {
  const idx = text.lastIndexOf(" ");
  if (idx === -1) return <span style={{ color: "var(--site-accent)" }}>{text}</span>;
  return (
    <>
      {text.slice(0, idx)}{" "}
      <span style={{ color: "var(--site-accent)" }}>{text.slice(idx + 1)}</span>
    </>
  );
}

const PHASES = [
  {
    n: "1",
    title: "Décodage",
    body: "On installe les fondations : les lettres, les voyelles (harakât), puis l'assemblage en mots.",
    outcomes: [
      "Tu reconnais et prononces chaque lettre, isolée ou attachée.",
      "Tu déchiffres n'importe quel mot entièrement voyellé.",
    ],
  },
  {
    n: "2",
    title: "Lecture & Compréhension",
    body: "Tu passes du mot au texte. On travaille la lecture, la fluidité et la compréhension à travers des textes. En plus, tu écris et traduis des textes en arabe.",
    outcomes: [
      "Tu lis un texte simple à voix haute, de façon fluide.",
      "Tu comprends et réemplois le vocabulaire courant.",
    ],
  },
  {
    n: "3",
    title: "Grammaire et expression",
    body: "Ajout progressif de l'expression orale et de la grammaire, en plus du maintien de l'étude de texte.",
    outcomes: [
      "Tu repères la structure d'une phrase (sujet, verbe, complément…).",
      "Tu comprends pourquoi un mot prend telle terminaison.",
      "Tu t'exprimes avec un vocabulaire de la vie de tous les jours.",
    ],
  },
];

const STEPS = [
  {
    n: "1",
    title: "Réserve ton cours d'essai",
    body: "Laisse tes informations et choisis un créneau. On te recontacte par mail pour confirmer.",
  },
  {
    n: "2",
    title: "Le cours d'essai",
    body: "En visio, individuel avec ton enseignant. Il évalue ton niveau et place ton curseur au bon endroit dans le parcours.",
  },
  {
    n: "3",
    title: "Tu choisis ta formule",
    body: "Si tu veux continuer, tu sélectionnes une offre. Aucun engagement avant l'essai.",
  },
];

const FEATURES = [
  {
    title: "1 heure par semaine, en visio",
    body: "Cours individuels sur Zoom ou Google Meet. Aucun déplacement, aucun matériel particulier requis.",
  },
  {
    title: "Enseignant dédié selon ton genre",
    body: "Un enseignant homme pour les hommes, une enseignante femme pour les femmes.",
  },
  {
    title: "Messagerie directe sans partager ton numéro",
    body: "Chat en temps réel avec ton enseignant. Toute la communication passe par la plateforme.",
  },
];

const FAQ = [
  {
    q: "Je n'ai jamais appris l'arabe, je peux commencer ?",
    a: "Oui. Le parcours démarre à l'alphabet. Et si tu sais déjà lire, le cours d'essai sert justement à placer ton point de départ plus loin.",
  },
  {
    q: "Combien de temps avant de savoir lire ?",
    a: "Ça dépend de ton point de départ et de ta régularité, c'est tout l'intérêt du curseur individuel. On ne te promet pas un délai magique : on te promet une progression sans trou.",
  },
  {
    q: "Comment se passe un cours ?",
    a: "En visio (Zoom ou Google Meet), en tête-à-tête, une heure par semaine. Aucun déplacement, aucun matériel particulier. Après chaque séance, tu retrouves dans ton espace : le récapitulatif, le vocabulaire du jour, la règle de grammaire éventuelle et un devoir personnalisé.",
  },
  {
    q: "Homme ou femme : qui sera mon enseignant ?",
    a: "Les élèves hommes sont suivis par un enseignant, les élèves femmes par une enseignante.",
  },
  {
    q: "Et si je dois annuler ou que je rate une séance ?",
    a: "Une séance annulée est reprogrammée dans tes créneaux disponibles, et une absence justifiée est sans conséquence.",
  },
  {
    q: "Dois-je acheter des livres ou du matériel ?",
    a: "Non. Tout le nécessaire (vocabulaire, règles, supports) est fourni au fil des séances dans ton espace personnel.",
  },
  {
    q: "Comment je paie, et est-ce que je peux étaler ?",
    a: "Le paiement se fait après le cours d'essai. L'abonnement annuel se règle en une fois ou de façon échelonnée (jusqu'à 12 fois) ; tu peux aussi prendre des heures à la carte, sans engagement.",
  },
];

export default function HomePage() {
  return (
    <div style={{ position: "relative" }}>
      <VitrineBgWrapper />
      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1
          className="leading-tight mb-5"
          style={{
            fontFamily: "var(--font-outfit)",
            fontWeight: 900,
            fontSize: "var(--site-h1-size)",
            color: "var(--site-title)",
          }}
        >
          Cours d&apos;arabe individuel en{" "}
          <span style={{ color: "var(--site-accent)" }}>distanciel</span>
        </h1>
        <p style={{ color: "#4A463F", fontSize: 17, lineHeight: 1.65, maxWidth: 500, margin: "0 auto" }}>
          Cours personnalisés en visio, individuel, avec un suivi pédagogique complet.
        </p>
        <div className="flex flex-col items-center gap-3 mt-8">
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 360 }}>
            <Link
              href="/essai"
              className="rounded-full font-bold text-white text-center w-full"
              style={{ background: "var(--site-accent)", padding: "13px 24px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
            >
              Réserver mon cours d&apos;essai gratuit
            </Link>
            <Link
              href="/offres"
              className="rounded-full font-semibold border text-center w-full"
              style={{ padding: "13px 24px", fontSize: 16, color: "var(--site-accent)", borderColor: "var(--site-accent)", borderWidth: 2, background: "#fff" }}
            >
              Choisis ta formule
            </Link>
          </div>
        </div>
      </section>

      {/* ── La méthode en 3 phases ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-2"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Ton parcours, la méthode étape par{" "}
            <span style={{ color: "var(--site-accent)" }}>étape</span>
          </h2>
          <p className="text-center mb-10" style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}>
            Pas de classe, pas de rythme imposé : tu avances à ta vitesse, tu es ton propre curseur de progression.
          </p>

          <div className="space-y-5">
            {PHASES.map((phase, idx) => (
              <div
                key={phase.n}
                className="rounded-2xl p-6"
                style={{
                  background: "#fff",
                  border: "1.5px solid #0F9D6E",
                  outline: "1.5px dashed #0F9D6E",
                  outlineOffset: "-7px",
                }}
              >
                <h3
                  className="font-bold mb-1 whitespace-nowrap overflow-hidden text-ellipsis"
                  style={{ fontFamily: "var(--font-outfit)", fontWeight: 800, fontSize: "clamp(13px, 3.8vw, 18px)", color: "var(--site-title)" }}
                >
                  Phase {phase.n} : <span style={{ color: "var(--site-accent)" }}>{phase.title}</span>
                </h3>
                <p style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.6, marginBottom: 10 }}>
                  {phase.body}
                </p>
                <ul className="space-y-1">
                  {phase.outcomes.map((o) => (
                    <li key={o} className="flex items-start gap-2" style={{ color: "#4A463F", fontSize: 13.5 }}>
                      <span aria-hidden="true" style={{ color: "var(--site-accent)", marginTop: 1 }}>✓</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p
            className="text-center mt-8"
            style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.65, maxWidth: 480, margin: "32px auto 0", fontFamily: "var(--font-outfit)", fontWeight: 600 }}
          >
            Chaque brique en prépare une autre. On ne saute jamais une étape, et on n&apos;introduit jamais une difficulté avant que la précédente soit acquise.
          </p>
        </div>
      </section>

      {/* ── Comment ça marche ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-10"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Comment ça <span style={{ color: "var(--site-accent)" }}>marche</span>
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full font-bold text-white"
                  style={{ width: 42, height: 42, background: "var(--site-accent)", fontSize: 17, fontFamily: "var(--font-outfit)", fontWeight: 900 }}
                >
                  {s.n}
                </div>
                <h3 className="font-semibold" style={{ color: "var(--site-title)", fontSize: 15, fontFamily: "var(--font-outfit)", fontWeight: 800 }}>
                  <GreenLast text={s.title} />
                </h3>
                <p style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.6 }}>{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Évaluation sur-mesure (différenciateur) ── */}
      <section className="px-4 pb-14" style={{ background: "transparent" }}>
        <div
          className="mx-auto max-w-3xl rounded-2xl p-8"
          style={{ background: "var(--site-accent)", boxShadow: "0 10px 30px rgba(15,157,110,.25)", border: "1.5px solid #fff", outline: "1.5px dashed #fff", outlineOffset: "-7px" }}
        >
          <h2
            className="font-bold mb-4 leading-snug"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: 24, color: "#fff" }}
          >
            Des quiz fabriqués sur-mesure,<br />à partir de TON vocabulaire
          </h2>
          <p style={{ color: "rgba(255,255,255,.88)", fontSize: 15, lineHeight: 1.65, marginBottom: 20 }}>
            Chaque mot que ton enseignant t&apos;apprend entre automatiquement dans ton glossaire personnel. Tes quiz sont ensuite générés à partir de ce glossaire.
          </p>
          <ul className="space-y-2">
            {[
              "Un glossaire français-arabe qui se remplit séance après séance.",
              "Des quiz auto-générés depuis ton glossaire personnel, progressivement plus exigeants.",
              "Des évaluations expression écrite et orale pour te pousser et que tu saches réellement où tu en es dans ton avancée.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2" style={{ color: "rgba(255,255,255,.9)", fontSize: 14 }}>
                <span aria-hidden="true" style={{ color: "#A8F0D8", marginTop: 1 }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Features (3) ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-3"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Le cours d&apos;arabe <span style={{ color: "var(--site-accent)" }}>individuel</span>
          </h2>
          <p
            className="text-center mb-10"
            style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 40px" }}
          >
            Un cours personnalisé, 1 heure par semaine, en visio. Avec un suivi pédagogique complet : carnet de bord, glossaire, grammaire et évaluations. Quiz disponible après chaque cours.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5"
                style={{ background: "#fff", border: "1.5px solid #0F9D6E", outline: "1.5px dashed #0F9D6E", outlineOffset: "-7px" }}
              >
                <h3 className="font-semibold mb-2" style={{ color: "var(--site-title)", fontSize: 15, fontFamily: "var(--font-outfit)", fontWeight: 800 }}>
                  <GreenLast text={f.title} />
                </h3>
                <p style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs teaser ── */}
      <section className="py-12 px-4 text-center" style={{ background: "transparent" }}>
        <p style={{ color: "#4A463F", fontSize: 16, maxWidth: 540, margin: "0 auto" }}>
          À partir de <strong style={{ color: "var(--site-title)" }}>52 €/mois</strong> en abonnement annuel,
          ou <strong style={{ color: "var(--site-title)" }}>15 €/heure</strong> à la carte.
          Cours d&apos;essai <strong style={{ color: "var(--site-title)" }}>gratuit</strong>, sans engagement.
        </p>
        <Link
          href="/offres"
          className="inline-block mt-4 rounded-full font-semibold text-sm"
          style={{ color: "var(--site-accent)", padding: "10px 20px", border: "1.5px solid #0F9D6E" }}
        >
          Voir tous les tarifs →
        </Link>
      </section>

      {/* ── Témoignages ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-10"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Ce que disent nos <span style={{ color: "var(--site-accent)" }}>élèves</span>
          </h2>
          <TestimonialsStack />
        </div>
      </section>

      {/* ── Charte d'engagement ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-2"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Notre engagement, et le <span style={{ color: "var(--site-accent)" }}>tien</span>
          </h2>
          <p className="text-center mb-10" style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6, maxWidth: 480, margin: "0 auto 40px" }}>
            Un suivi sérieux repose sur des règles claires, des deux côtés. Voici les nôtres.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div
              className="rounded-2xl p-6"
              style={{ background: "#fff", border: "1.5px solid #0F9D6E", outline: "1.5px dashed #0F9D6E", outlineOffset: "-7px" }}
            >
              <p className="font-semibold mb-4" style={{ color: "#0A6B4E", fontSize: 15, fontFamily: "var(--font-outfit)", fontWeight: 800 }}>
                Ce qu&apos;on s&apos;engage à faire
              </p>
              <ul className="space-y-2.5">
                {[
                  "Le même enseignant pour toi, tout au long de ton parcours.",
                  "Un récapitulatif, du vocabulaire et un devoir après chaque séance.",
                  "Évaluation et suivi adapté : on continue.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2" style={{ color: "#1C5C41", fontSize: 14, lineHeight: 1.55 }}>
                    <span aria-hidden="true" style={{ color: "var(--site-accent)", marginTop: 1 }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-2xl p-6"
              style={{ background: "#fff", border: "1.5px solid #0F9D6E", outline: "1.5px dashed #0F9D6E", outlineOffset: "-7px" }}
            >
              <p className="font-semibold mb-4" style={{ color: "var(--site-title)", fontSize: 15, fontFamily: "var(--font-outfit)", fontWeight: 800 }}>
                Ce qu&apos;on te demande
              </p>
              <ul className="space-y-2.5">
                {[
                  "Être présent et à l'heure : au-delà de 10 minutes de retard, l'accès au cours se ferme et la séance compte comme une absence.",
                  "Prévenir en cas d'empêchement : une absence justifiée est sans conséquence, et la séance est reprogrammée.",
                  "Au-delà de 3 absences non justifiées, l'accès à la réservation est suspendu ; ton historique et tes contenus restent consultables.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2" style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.55 }}>
                    <span aria-hidden="true" style={{ color: "var(--site-accent)", marginTop: 1 }}>·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p
            className="text-center mt-6 text-sm"
            style={{ color: "#8B857A", fontFamily: "var(--font-outfit)", fontWeight: 600 }}
          >
            Pas de paiement, pas de réservation : l&apos;accès au planning s&apos;ouvre une fois ton offre réglée.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-14 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl">
          <h2
            className="text-center font-bold mb-10"
            style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
          >
            Les questions qu&apos;on nous <span style={{ color: "var(--site-accent)" }}>pose</span>
          </h2>
          <div className="space-y-2">
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl"
                style={{ border: "1.5px solid #0F9D6E", background: "#fff", outline: "1.5px dashed #0F9D6E", outlineOffset: "-7px" }}
              >
                <summary
                  className="flex items-center justify-between gap-4 cursor-pointer select-none px-5 py-4 font-semibold list-none"
                  style={{ color: "var(--site-title)", fontSize: 15 }}
                >
                  {item.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 transition-transform group-open:rotate-45"
                    style={{ color: "var(--site-accent)", fontSize: 22, lineHeight: 1 }}
                  >
                    +
                  </span>
                </summary>
                <p className="px-5 pb-5" style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.7 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Confidentialité ── */}
      <section className="py-10 px-4" style={{ background: "transparent" }}>
        <div className="mx-auto max-w-3xl rounded-2xl px-6 py-5" style={{ background: "#fff", border: "1.5px solid #0F9D6E", outline: "1.5px dashed #0F9D6E", outlineOffset: "-7px" }}>
          <p className="font-semibold mb-3" style={{ color: "var(--site-title)", fontSize: 14 }}>
            Tes données restent chez toi
          </p>
          <ul className="space-y-1.5">
            {[
              "Ton numéro de téléphone n'est jamais partagé : toute la communication passe par la messagerie interne.",
              "Tes échanges et tes informations restent sur la plateforme, accessibles à toi et à ton enseignant.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2" style={{ color: "#6B6560", fontSize: 13.5 }}>
                <span aria-hidden="true" style={{ color: "var(--site-accent)" }}>·</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-14 px-4 text-center" style={{ background: "transparent" }}>
        <h2
          className="font-bold mb-3"
          style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "var(--site-h2-size)", color: "var(--site-title)" }}
        >
          Prêt(e) à <span style={{ color: "var(--site-accent)" }}>commencer ?</span>
        </h2>
        <p style={{ color: "#4A463F", fontSize: 16, marginBottom: 24 }}>
          Débute par le cours d&apos;essai gratuit, sans engagement.
        </p>
        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col gap-3 w-full" style={{ maxWidth: 360 }}>
            <Link
              href="/essai"
              className="rounded-full font-bold text-white text-center w-full"
              style={{ background: "var(--site-accent)", padding: "13px 24px", fontSize: 16, boxShadow: "0 8px 20px rgba(15,157,110,.32)" }}
            >
              Réserver mon cours d&apos;essai gratuit
            </Link>
            <Link
              href="/offres"
              className="rounded-full font-semibold border text-center w-full"
              style={{ padding: "13px 24px", fontSize: 16, color: "var(--site-accent)", borderColor: "var(--site-accent)", borderWidth: 2, background: "#fff" }}
            >
              Choisis ta formule
            </Link>
          </div>
        </div>
      </section>
      <ColorTweaker />
    </div>
  );
}
