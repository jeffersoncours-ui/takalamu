"use client";

import { useState } from "react";
import QuizPlayer from "./quiz-player";
import { ConjugationQuizPlayer } from "./conjugation-player";
import {
  generateLanguageQuiz,
  submitLanguageQuiz,
  generateConjugationQuiz,
  submitConjugationQuiz,
} from "./actions";

type Course = { id: string; label: string; count: number };

/**
 * Page Évaluations : deux quiz indépendants — le quiz de langue (vocabulaire +
 * formulation fusionnés) et, si l'élève a des verbes conjugués, le quiz de
 * conjugaison. Un seul quiz peut tourner à la fois (les autres lanceurs sont
 * masqués dès qu'un quiz démarre, comme le titre).
 */
export function EvaluationsClient({
  count,
  courseOptions,
  hasConjugations,
}: {
  count: number;
  courseOptions: Course[];
  hasConjugations: boolean;
}) {
  // "lang" | "conj" | null : quel quiz est actif (aucun = tout visible).
  const [active, setActive] = useState<null | "lang" | "conj">(null);

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

      {active !== "conj" && (
        <section className="space-y-3">
          <QuizPlayer
            count={count}
            courses={courseOptions}
            generate={generateLanguageQuiz}
            submit={submitLanguageQuiz}
            onActiveChange={(a) => setActive(a ? "lang" : null)}
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
      )}

      {hasConjugations && active !== "lang" && (
        <section className="space-y-3">
          <ConjugationQuizPlayer
            generate={generateConjugationQuiz}
            submit={submitConjugationQuiz}
            onActiveChange={(a) => setActive(a ? "conj" : null)}
          />
        </section>
      )}
    </div>
  );
}
