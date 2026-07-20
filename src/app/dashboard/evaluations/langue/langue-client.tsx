"use client";

import { useState } from "react";
import Link from "next/link";
import QuizPlayer from "../quiz-player";
import { generateLanguageQuiz, submitLanguageQuiz } from "../actions";

export function LangueClient({ count }: { count: number }) {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-5">
      {!active && (
        <>
          <Link
            href="/dashboard/evaluations"
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}
          >
            ← Évaluations
          </Link>
          <h1
            className="px-0.5 leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
          >
            Quiz de langue
          </h1>
        </>
      )}

      <QuizPlayer
        count={count}
        generate={generateLanguageQuiz}
        submit={submitLanguageQuiz}
        onActiveChange={setActive}
        labels={{
          title: "Quiz de langue",
          unit: "élément",
          unitPlural: "éléments",
          intro:
            "Vocabulaire et expressions mélangés, générés depuis ton contenu personnel : questions FR ↔ AR, compréhension orale (écoute la voix de ton prof) et audio-choix. Chaque quiz est différent. Le score s'affiche à la fin.",
          emptyTitle: "Pas encore assez de contenu",
          emptyBody:
            "Il faut au moins 4 mots ou expressions au total. Reviens après quelques séances !",
          arToFrQuestion: "Que signifie ce mot arabe ?",
          frToArQuestion: "Comment dit-on en arabe ?",
          arToFrAudioQuestion: "Écoute l'audio et choisis la bonne traduction",
          frToArAudioQuestion: "Écoute les réponses et choisis l'audio qui traduit cette phrase",
        }}
      />
    </div>
  );
}
