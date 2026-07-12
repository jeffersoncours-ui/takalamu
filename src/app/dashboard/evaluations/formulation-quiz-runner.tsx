"use client";

import QuizPlayer from "./quiz-player";
import { generateFormulationQuiz, submitFormulationQuiz } from "./actions";

type Course = { id: string; label: string; count: number };

export default function FormulationQuizRunner({
  formCount,
  courses,
}: {
  formCount: number;
  courses: Course[];
}) {
  return (
    <QuizPlayer
      count={formCount}
      courses={courses}
      generate={generateFormulationQuiz}
      submit={submitFormulationQuiz}
      labels={{
        title: "Quiz formulation",
        unit: "expression",
        unitPlural: "expressions",
        intro:
          "Comment dit-on… ? Des questions FR → AR en texte, et de la compréhension orale : écoute la voix de ton prof et retrouve la traduction. Le score s'affiche à la fin.",
        emptyTitle: "Pas encore assez de formulations",
        emptyBody: "Il faut au moins 4 formulations enregistrées. Reviens après quelques séances !",
        allScopeLabel: "Toutes les formulations",
        arToFrQuestion: "Écoute l'audio et choisis la bonne traduction",
        frToArQuestion: "Comment dit-on cette expression en arabe ?",
      }}
    />
  );
}
