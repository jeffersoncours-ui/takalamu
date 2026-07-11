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
          "Comment dit-on… ? Des questions FR → AR et AR → FR générées depuis tes formulations. Le score s'affiche à la fin.",
        emptyTitle: "Pas encore assez de formulations",
        emptyBody: "Il faut au moins 4 formulations enregistrées. Reviens après quelques séances !",
        allScopeLabel: "Toutes les formulations",
        arToFrQuestion: "Que signifie cette expression ?",
        frToArQuestion: "Comment dit-on cette expression en arabe ?",
      }}
    />
  );
}
