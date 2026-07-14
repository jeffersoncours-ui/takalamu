"use client";

import { useState } from "react";
import QuizPlayer from "./quiz-player";
import { generateLanguageQuiz, submitLanguageQuiz } from "./actions";

type Course = { id: string; label: string; count: number };

/**
 * Quiz de langue unique : vocabulaire ET formulation fusionnés dans un même
 * quiz (mêmes fonctionnalités — texte, compréhension orale, audio-choix). Un
 * seul lanceur, un seul score. Dès qu'il démarre, le titre disparaît.
 */
export function EvaluationsClient({
  count,
  courseOptions,
}: {
  count: number;
  courseOptions: Course[];
}) {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-8">
      {!active && (
        <h1
          className="px-0.5 leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Évaluations
        </h1>
      )}

      <section className="space-y-3">
        <QuizPlayer
          count={count}
          courses={courseOptions}
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
            allScopeLabel: "Tout mon contenu",
            arToFrQuestion: "Que signifie ce mot arabe ?",
            frToArQuestion: "Comment dit-on en arabe ?",
            arToFrAudioQuestion: "Écoute l'audio et choisis la bonne traduction",
            frToArAudioQuestion: "Écoute les réponses et choisis l'audio qui traduit cette phrase",
          }}
        />
      </section>
    </div>
  );
}
