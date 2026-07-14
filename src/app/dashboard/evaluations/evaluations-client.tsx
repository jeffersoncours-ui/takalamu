"use client";

import { useState } from "react";
import QuizRunner from "./quiz-runner";
import FormulationQuizRunner from "./formulation-quiz-runner";

type Course = { id: string; label: string; count: number };
type ActiveQuiz = "vocab" | "formulation" | null;

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#8B857A",
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

/**
 * Orchestre les 3 quiz (vocabulaire, formulation, grammaire) : un seul état
 * "actif" partagé, remonté par chaque lanceur via `onActiveChange`. Dès qu'un
 * quiz démarre, le reste de la page (titre + autres sections) disparaît — plus
 * moyen de lancer deux quiz en même temps ni de garder du contenu résiduel
 * affiché autour du quiz en cours.
 */
export function EvaluationsClient({
  vocabCount,
  courseOptions,
  formCount,
  formCourseOptions,
}: {
  vocabCount: number;
  courseOptions: Course[];
  formCount: number;
  formCourseOptions: Course[];
}) {
  const [active, setActive] = useState<ActiveQuiz>(null);

  return (
    <div className="space-y-8">
      {active === null && (
        <h1
          className="px-0.5 leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Évaluations
        </h1>
      )}

      {(active === null || active === "vocab") && (
        <section className="space-y-3">
          {active === null && <p className="px-0.5" style={sectionLabel}>Quiz vocabulaire</p>}
          <QuizRunner
            vocabCount={vocabCount}
            courses={courseOptions}
            onActiveChange={(a) => setActive(a ? "vocab" : null)}
          />
        </section>
      )}

      {(active === null || active === "formulation") && (
        <section className="space-y-3">
          {active === null && <p className="px-0.5" style={sectionLabel}>Quiz formulation</p>}
          <FormulationQuizRunner
            formCount={formCount}
            courses={formCourseOptions}
            onActiveChange={(a) => setActive(a ? "formulation" : null)}
          />
        </section>
      )}
    </div>
  );
}
