import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Étude de texte islamique en groupe — Takalamu",
  description: "Conférences en groupe liées à un livre islamique, animées par l'enseignant. Série de séances, paiement unique.",
};

export default function GroupePage() {
  return (
    <div style={{ background: "#F7F4EE" }}>
      <section className="mx-auto max-w-3xl px-4 py-14 text-center">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Produit B
        </p>
        <h1
          className="leading-tight mb-4"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 34, color: "#1C1A17" }}
        >
          Étude de texte islamique en groupe
        </h1>
        <p style={{ color: "#4A463F", fontSize: 17, lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
          Une série de conférences en visio dédiée à l&apos;étude d&apos;un ouvrage islamique.
          Animée par l&apos;enseignant, ouverte à tous. Notes de cours partagées et évaluations incluses.
        </p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 grid gap-4 sm:grid-cols-2">
        {[
          { icon: "📖", title: "Lié à un livre", body: "Chaque cycle est consacré à un ouvrage précis. Contenu réutilisable d'une session à l'autre." },
          { icon: "🎙", title: "Format conférence", body: "Caméras masquées, micros coupés. L'enseignant anime seul. Questions à la fin avec réouverture du micro." },
          { icon: "📝", title: "Notes partagées", body: "Un document de notes de cours mis à disposition de tous les inscrits après chaque séance." },
          { icon: "✅", title: "Évaluations", body: "Quiz liés au livre pour mesurer ta progression à l'issue du cycle." },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl p-5"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 4px 14px rgba(28,26,23,.06)" }}
          >
            <div className="text-2xl mb-3">{item.icon}</div>
            <h3 className="font-semibold mb-2" style={{ color: "#1C1A17", fontSize: 15, fontFamily: "var(--font-spectral)" }}>
              {item.title}
            </h3>
            <p style={{ color: "#6B6560", fontSize: 14, lineHeight: 1.6 }}>{item.body}</p>
          </div>
        ))}
      </section>

      <section
        className="border-t py-12 px-4 text-center"
        style={{ borderColor: "#E9E3D8" }}
      >
        <p style={{ color: "#4A463F", fontSize: 16 }}>
          Prochaines sessions bientôt disponibles. Pour être informé(e), contacte-nous.
        </p>
        <Link
          href="/essai"
          className="inline-block mt-4 rounded-full font-semibold text-sm"
          style={{ color: "#0F9D6E", padding: "10px 20px", border: "1.5px solid #0F9D6E" }}
        >
          Nous contacter →
        </Link>
      </section>
    </div>
  );
}
