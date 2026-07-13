"use client";

import QuizPlayer from "./quiz-player";
import { generateFormulationQuiz, submitFormulationQuiz } from "./actions";

type Course = { id: string; label: string; count: number };

export default function FormulationQuizRunner({
  formCount,
  courses,
  onActiveChange,
}: {
  formCount: number;
  courses: Course[];
  onActiveChange?: (active: boolean) => void;
}) {
  return (
    <QuizPlayer
      count={formCount}
      courses={courses}
      generate={generateFormulationQuiz}
      submit={submitFormulationQuiz}
      onActiveChange={onActiveChange}
      labels={{
        title: "Quiz formulation",
        unit: "expression",
        unitPlural: "expressions",
        intro:
          "Comment dit-on… ? Des questions en texte, et de la compréhension orale : écoute la voix de ton prof et retrouve la traduction, ou lis la phrase et retrouve le bon audio. Le score s'affiche à la fin.",
        emptyTitle: "Pas encore assez de formulations",
        emptyBody: "Il faut au moins 4 formulations enregistrées. Reviens après quelques séances !",
        allScopeLabel: "Toutes les formulations",
        arToFrQuestion: "Écoute l'audio et choisis la bonne traduction",
        frToArQuestion: "Comment dit-on cette expression en arabe ?",
        frToArAudioQuestion: "Écoute les réponses et choisis l'audio qui traduit cette phrase",
      }}
    />
  );
}
