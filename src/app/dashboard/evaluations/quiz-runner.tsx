"use client";

import { useState } from "react";
import {
  generateQuiz,
  submitQuiz,
  type QuizQuestion,
  type QuizAnswer,
  type QuizResult,
} from "./actions";

type Phase =
  | { name: "idle" }
  | { name: "playing"; questions: QuizQuestion[]; current: number; answers: QuizAnswer[] }
  | { name: "done"; result: QuizResult; questions: QuizQuestion[] };

const GREEN = "#0F9D6E";
const RED = "#B4292E";

type Course = { id: string; label: string; count: number };

export default function QuizRunner({
  vocabCount,
  courses,
}: {
  vocabCount: number;
  courses: Course[];
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<string>("all");

  const start = async () => {
    setLoading(true);
    try {
      const lessonRecordId = scope === "all" ? undefined : scope;
      const questions = await generateQuiz(lessonRecordId, 10);
      if (questions.length > 0) {
        setPhase({ name: "playing", questions, current: 0, answers: [] });
      }
    } catch {
      // silent — edge case, user can retry
    } finally {
      setLoading(false);
    }
  };

  const choose = async (chosen: string) => {
    if (phase.name !== "playing") return;
    const { questions, current, answers } = phase;
    const q = questions[current];
    const newAnswers: QuizAnswer[] = [
      ...answers,
      { vocab_id: q.vocab_id, direction: q.direction, chosen },
    ];

    if (current + 1 < questions.length) {
      setPhase({ name: "playing", questions, current: current + 1, answers: newAnswers });
      return;
    }

    setLoading(true);
    try {
      const result = await submitQuiz(newAnswers);
      setPhase({ name: "done", result, questions });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const restart = () => setPhase({ name: "idle" });

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase.name === "idle") {
    if (vocabCount < 4) {
      return (
        <div
          className="rounded-[18px] p-5 text-center"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="text-base font-semibold mb-1" style={{ color: "#1C1A17" }}>
            Pas encore assez de vocabulaire
          </p>
          <p className="text-sm" style={{ color: "#8B857A" }}>
            Il faut au moins 4 mots dans ton glossaire. Reviens après quelques
            séances !
          </p>
        </div>
      );
    }

    return (
      <div
        className="rounded-[18px] p-5 flex flex-col gap-4"
        style={{ background: "#fff", border: "1px solid #EFEAE0" }}
      >
        <div>
          <p className="font-semibold text-base" style={{ color: "#1C1A17" }}>
            Quiz vocabulaire
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#8B857A" }}>
            {vocabCount} mot{vocabCount > 1 ? "s" : ""} dans ton glossaire •{" "}
            jusqu&apos;à 10 questions
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#4A463F" }}>
          Des questions FR → AR et AR → FR générées depuis ton glossaire
          personnel. Le score s&apos;affiche à la fin.
        </p>

        {/* Portée : tout le glossaire ou un cours précis */}
        {courses.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="quiz-scope" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B857A" }}>
              Réviser
            </label>
            <select
              id="quiz-scope"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-[13px] px-3.5 outline-none"
              style={{ height: 46, background: "#FBF9F5", border: "1.5px solid #E9E3D8", fontSize: 14, color: "#1C1A17" }}
            >
              <option value="all">Tout le glossaire ({vocabCount} mots)</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.count} mot{c.count > 1 ? "s" : ""})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-[14px] py-3.5 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: GREEN }}
        >
          {loading ? "Génération…" : "Commencer le quiz"}
        </button>
      </div>
    );
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  if (phase.name === "playing") {
    const { questions, current } = phase;
    const q = questions[current];
    const progress = ((current) / questions.length) * 100;
    const isArabicAnswer = q.direction === "fr_to_ar";

    return (
      <div className="flex flex-col gap-4">
        {/* Progress */}
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

        {/* Question card */}
        <div
          className="rounded-[18px] p-5"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8B857A" }}>
            {q.direction === "ar_to_fr" ? "Que signifie ce mot arabe ?" : "Comment dit-on en arabe ?"}
          </p>
          <p
            className="text-2xl font-bold leading-snug mb-1"
            dir={q.direction === "ar_to_fr" ? "rtl" : undefined}
            lang={q.direction === "ar_to_fr" ? "ar" : undefined}
            style={{
              color: "#1C1A17",
              fontFamily: q.direction === "ar_to_fr" ? "var(--font-amiri)" : "var(--font-spectral)",
            }}
          >
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
              style={{
                background: "#fff",
                border: "1.5px solid #EFEAE0",
                color: "#1C1A17",
                textAlign: isArabicAnswer ? "right" : "left",
              }}
              dir={isArabicAnswer ? "rtl" : undefined}
              lang={isArabicAnswer ? "ar" : undefined}
            >
              <span style={{ fontFamily: isArabicAnswer ? "var(--font-amiri)" : undefined }}>
                {choice}
              </span>
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
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const isGood = pct >= 70;

    return (
      <div className="flex flex-col gap-4">
        {/* Score hero */}
        <div
          className="rounded-[18px] p-6 text-center"
          style={{ background: isGood ? "#ECFAF4" : "#FDECEC", border: `1px solid ${isGood ? "#C8EBDB" : "#F3B0B2"}` }}
        >
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
            {pct === 100
              ? "Parfait !"
              : pct >= 70
              ? "Bien joué !"
              : "Continue à réviser !"}
          </p>
        </div>

        {/* Detailed review */}
        <div className="flex flex-col gap-2">
          {result.answers.map((a, idx) => {
            const q = questions[idx];
            const isAr = a.direction === "fr_to_ar";
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
                  <span className="mt-0.5 shrink-0" style={{ color: a.is_correct ? GREEN : RED, fontSize: 14 }}>
                    {a.is_correct ? "✓" : "✗"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold" style={{ color: "#8B857A" }}>
                      {q?.direction === "ar_to_fr" ? "Arabe → Français" : "Français → Arabe"}
                    </p>
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: "#1C1A17" }}
                      dir={q?.direction === "ar_to_fr" ? "rtl" : undefined}
                    >
                      {q?.prompt}
                    </p>
                    {!a.is_correct && (
                      <div className="mt-1.5 space-y-0.5">
                        <p className="text-xs" style={{ color: RED }}>
                          Ta réponse :{" "}
                          <span
                            dir={isAr ? "rtl" : undefined}
                            style={{ fontFamily: isAr ? "var(--font-amiri)" : undefined }}
                          >
                            {a.chosen}
                          </span>
                        </p>
                        <p className="text-xs font-semibold" style={{ color: "#0A6B4E" }}>
                          Bonne réponse :{" "}
                          <span
                            dir={isAr ? "rtl" : undefined}
                            style={{ fontFamily: isAr ? "var(--font-amiri)" : undefined }}
                          >
                            {a.correct}
                          </span>
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
          onClick={restart}
          className="w-full rounded-[14px] py-3.5 font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
        >
          Refaire un quiz
        </button>
      </div>
    );
  }

  return null;
}
