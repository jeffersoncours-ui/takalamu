"use client";

import { useState } from "react";
import {
  fetchGrammarQuizQuestions,
  submitGrammarQuiz,
  type GrammarQuizQuestion,
  type GrammarAnswer,
  type GrammarQuizResult,
} from "./actions";

type Phase =
  | { name: "idle" }
  | { name: "playing"; questions: GrammarQuizQuestion[]; current: number; answers: GrammarAnswer[] }
  | { name: "done"; result: GrammarQuizResult; questions: GrammarQuizQuestion[] };

const GREEN = "#0F9D6E";
const RED   = "#B4292E";

export function GrammarQuizRunner({
  quizzes,
}: {
  quizzes: { id: string; title: string | null }[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [phase, setPhase]       = useState<Phase>({ name: "idle" });
  const [loading, setLoading]   = useState(false);

  const activeQuiz = quizzes.find((q) => q.id === activeId);

  const start = async (quizId: string) => {
    setActiveId(quizId);
    setLoading(true);
    try {
      const questions = await fetchGrammarQuizQuestions(quizId);
      if (questions.length > 0) {
        setPhase({ name: "playing", questions, current: 0, answers: [] });
      } else {
        setActiveId(null);
      }
    } catch {
      setActiveId(null);
    } finally {
      setLoading(false);
    }
  };

  const choose = async (chosen: string) => {
    if (phase.name !== "playing" || !activeId) return;
    const { questions, current, answers } = phase;
    const q = questions[current];
    const newAnswers: GrammarAnswer[] = [
      ...answers,
      { question_id: q.question_id, chosen },
    ];

    if (current + 1 < questions.length) {
      setPhase({ name: "playing", questions, current: current + 1, answers: newAnswers });
      return;
    }

    setLoading(true);
    try {
      const result = await submitGrammarQuiz(activeId, newAnswers);
      setPhase({ name: "done", result, questions });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhase({ name: "idle" });
    setActiveId(null);
  };

  // ── Quiz list (idle, no active quiz) ──────────────────────────────────────
  if (phase.name === "idle" && !activeId) {
    if (quizzes.length === 0) return null;

    return (
      <div className="space-y-2">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="rounded-[18px] px-4 py-3.5 flex items-center gap-3"
            style={{ background: "#fff", border: "1px solid #EFEAE0" }}
          >
            <div className="flex-1 min-w-0">
              <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>
                {quiz.title ?? "Exercice de grammaire"}
              </p>
            </div>
            <button
              onClick={() => start(quiz.id)}
              disabled={loading}
              className="shrink-0 rounded-[10px] px-3.5 py-2 font-semibold text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#0A553F", color: "#fff" }}
            >
              Commencer
            </button>
          </div>
        ))}
      </div>
    );
  }

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (loading && phase.name === "idle") {
    return (
      <div className="rounded-[18px] p-5 text-center" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <p className="text-sm" style={{ color: "#8B857A" }}>Chargement…</p>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (phase.name === "playing") {
    const { questions, current } = phase;
    const q = questions[current];
    const progress = (current / questions.length) * 100;

    return (
      <div className="flex flex-col gap-4">
        {/* Title + progress */}
        <div>
          <p className="font-semibold text-xs uppercase tracking-wide mb-2" style={{ color: "#8B857A" }}>
            {activeQuiz?.title ?? "Exercice de grammaire"}
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: "#EFEAE0", height: 6 }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: GREEN }}
              />
            </div>
            <span className="text-xs font-semibold shrink-0" style={{ color: "#8B857A" }}>
              {current + 1} / {questions.length}
            </span>
          </div>
        </div>

        {/* Question card */}
        <div
          className="rounded-[18px] p-5"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8B857A" }}>
            Question {current + 1}
          </p>
          <p className="text-lg font-bold leading-snug" style={{ color: "#1C1A17" }}>
            {q.prompt}
          </p>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2.5">
          {q.choices.map((choice, idx) => (
            <button
              key={idx}
              onClick={() => choose(choice)}
              disabled={loading}
              className="w-full rounded-[14px] px-4 py-3.5 text-left font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "#fff", border: "1.5px solid #EFEAE0", color: "#1C1A17" }}
            >
              {choice}
            </button>
          ))}
        </div>

        {loading && (
          <p className="text-center text-sm" style={{ color: "#8B857A" }}>
            Calcul du score…
          </p>
        )}
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase.name === "done") {
    const { result, questions } = phase;
    const pct    = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const isGood = pct >= 70;

    return (
      <div className="flex flex-col gap-4">
        <div
          className="rounded-[18px] p-6 text-center"
          style={{
            background: isGood ? "#ECFAF4" : "#FDECEC",
            border: `1px solid ${isGood ? "#C8EBDB" : "#F3B0B2"}`,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>
            {activeQuiz?.title ?? "Exercice"}
          </p>
          <p
            className="text-5xl font-bold"
            style={{ color: isGood ? GREEN : RED, fontFamily: "var(--font-spectral)" }}
          >
            {result.score}/{result.total}
          </p>
          <p className="text-lg font-semibold mt-1" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>
            {pct}%
          </p>
          <p className="text-sm mt-2" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>
            {pct === 100 ? "Parfait !" : pct >= 70 ? "Bien joué !" : "Continue à réviser !"}
          </p>
        </div>

        {/* Detailed review */}
        <div className="flex flex-col gap-2">
          {result.answers.map((a, idx) => {
            const q = questions[idx];
            return (
              <div
                key={idx}
                className="rounded-[14px] p-3.5"
                style={{
                  background: a.is_correct ? "#ECFAF4" : "#FFF8F8",
                  border: `1px solid ${a.is_correct ? "#C8EBDB" : "#F3B0B2"}`,
                }}
              >
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 shrink-0"
                    style={{ color: a.is_correct ? GREEN : RED, fontSize: 14 }}
                  >
                    {a.is_correct ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1C1A17" }}>
                      {q?.prompt}
                    </p>
                    {!a.is_correct && (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs" style={{ color: RED }}>
                          Ta réponse : {a.chosen}
                        </p>
                        <p className="text-xs font-semibold" style={{ color: "#0A6B4E" }}>
                          Bonne réponse : {a.correct}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={reset}
          className="w-full rounded-[14px] py-3.5 font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
        >
          Retour aux exercices
        </button>
      </div>
    );
  }

  return null;
}
