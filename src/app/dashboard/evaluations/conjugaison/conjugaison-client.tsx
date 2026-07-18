"use client";

import { useState } from "react";
import Link from "next/link";
import { ConjugationQuizPlayer } from "../conjugation-player";
import { generateConjugationQuiz, submitConjugationQuiz } from "../actions";
import type { Tense } from "@/lib/conjugation";

export function ConjugaisonClient({ unlockedTenses }: { unlockedTenses: Tense[] }) {
  const [active, setActive] = useState(false);

  return (
    <div className="space-y-5">
      {!active && (
        <>
          <Link
            href="/dashboard/evaluations"
            className="inline-flex items-center gap-1 font-semibold"
            style={{ color: "#8B857A", fontSize: 13 }}
          >
            ← Évaluations
          </Link>
          <h1
            className="px-0.5 leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
          >
            Quiz de conjugaison
          </h1>
        </>
      )}

      <ConjugationQuizPlayer
        unlockedTenses={unlockedTenses}
        generate={generateConjugationQuiz}
        submit={submitConjugationQuiz}
        onActiveChange={setActive}
      />
    </div>
  );
}
