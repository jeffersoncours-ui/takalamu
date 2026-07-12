"use client";

import QuizPlayer from "./quiz-player";
import { generateVocabQuiz, submitVocabQuiz } from "./actions";

type Course = { id: string; label: string; count: number };

export default function QuizRunner({
  vocabCount,
  courses,
  onActiveChange,
}: {
  vocabCount: number;
  courses: Course[];
  onActiveChange?: (active: boolean) => void;
}) {
  return (
    <QuizPlayer
      count={vocabCount}
      courses={courses}
      generate={generateVocabQuiz}
      submit={submitVocabQuiz}
      onActiveChange={onActiveChange}
      labels={{
        title: "Quiz vocabulaire",
        unit: "mot",
        unitPlural: "mots",
        intro:
          "Des questions FR → AR et AR → FR générées depuis ton glossaire personnel. Le score s'affiche à la fin.",
        emptyTitle: "Pas encore assez de vocabulaire",
        emptyBody: "Il faut au moins 4 mots dans ton glossaire. Reviens après quelques séances !",
        allScopeLabel: "Tout le glossaire",
        arToFrQuestion: "Que signifie ce mot arabe ?",
        frToArQuestion: "Comment dit-on en arabe ?",
      }}
    />
  );
}
