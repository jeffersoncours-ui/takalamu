"use client";

import { useRef, useState } from "react";
import type { QuizQuestion, QuizAnswer, QuizResult } from "./actions";

type Phase =
  | { name: "idle" }
  | { name: "playing"; questions: QuizQuestion[]; current: number; answers: QuizAnswer[] }
  | { name: "done"; result: QuizResult; questions: QuizQuestion[] };

const GREEN = "#0F9D6E";
const RED = "#B4292E";

/** Lecteur de question audio (compréhension orale) : gros bouton Écouter,
 *  réécoutable à volonté — aucun texte arabe affiché. */
function AudioPrompt({ url, compact }: { url: string; compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
    } else {
      void el.play();
      setPlaying(true);
    }
  };

  return (
    <span className="inline-flex">
      <audio ref={audioRef} src={url} preload="auto" onEnded={() => setPlaying(false)} />
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full font-bold transition-opacity hover:opacity-85"
        style={{
          background: playing ? "#0A6B4E" : GREEN,
          color: "#fff",
          fontSize: compact ? 12 : 15,
          padding: compact ? "6px 14px" : "12px 22px",
        }}
      >
        {playing ? (
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill="#fff">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.9-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14Z" />
          </svg>
        )}
        {playing ? "Stop" : compact ? "Réécouter" : "Écouter"}
      </button>
    </span>
  );
}

type Course = { id: string; label: string; count: number };

export type QuizLabels = {
  title: string;
  unit: string;
  unitPlural: string;
  intro: string;
  emptyTitle: string;
  emptyBody: string;
  allScopeLabel: string;
  arToFrQuestion: string;
  frToArQuestion: string;
};

export default function QuizPlayer({
  count,
  courses,
  generate,
  submit,
  labels,
}: {
  count: number;
  courses: Course[];
  generate: (lessonRecordId?: string) => Promise<QuizQuestion[]>;
  submit: (answers: QuizAnswer[]) => Promise<QuizResult>;
  labels: QuizLabels;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<string>("all");

  const start = async () => {
    setLoading(true);
    try {
      const lessonRecordId = scope === "all" ? undefined : scope;
      const questions = await generate(lessonRecordId);
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
      { item_id: q.item_id, direction: q.direction, chosen },
    ];

    if (current + 1 < questions.length) {
      setPhase({ name: "playing", questions, current: current + 1, answers: newAnswers });
      return;
    }

    setLoading(true);
    try {
      const result = await submit(newAnswers);
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
    if (count < 4) {
      return (
        <div
          className="rounded-[18px] p-5 text-center"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="text-base font-semibold mb-1" style={{ color: "#1C1A17" }}>
            {labels.emptyTitle}
          </p>
          <p className="text-sm" style={{ color: "#8B857A" }}>
            {labels.emptyBody}
          </p>
        </div>
      );
    }

    const selectedCount =
      scope === "all" ? count : courses.find((c) => c.id === scope)?.count ?? count;
    const questionCount = Math.max(1, Math.round(selectedCount / 2));

    return (
      <div
        className="rounded-[18px] p-5 flex flex-col gap-4"
        style={{ background: "#fff", border: "1px solid #EFEAE0" }}
      >
        <div>
          <p className="font-semibold text-base" style={{ color: "#1C1A17" }}>
            {labels.title}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "#8B857A" }}>
            {count} {count > 1 ? labels.unitPlural : labels.unit}
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#4A463F" }}>
          {labels.intro}
        </p>

        {/* Portée : tout ou un cours précis */}
        {courses.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor={`quiz-scope-${labels.unit}`} className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B857A" }}>
              Réviser
            </label>
            <select
              id={`quiz-scope-${labels.unit}`}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-[13px] px-3.5 outline-none"
              style={{ height: 46, background: "#FBF9F5", border: "1.5px solid #E9E3D8", fontSize: 14, color: "#1C1A17" }}
            >
              <option value="all">
                {labels.allScopeLabel} ({count} {count > 1 ? labels.unitPlural : labels.unit})
              </option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.count} {c.count > 1 ? labels.unitPlural : labels.unit})
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="text-xs" style={{ color: "#8B857A" }}>
          {questionCount} question{questionCount > 1 ? "s" : ""} pour ce quiz (la moitié du
          périmètre choisi).
        </p>

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
            {q.direction === "ar_to_fr" ? labels.arToFrQuestion : labels.frToArQuestion}
          </p>
          {q.audio_url ? (
            <div className="py-1">
              {/* key=current force un remontage complet à chaque question :
                  sans lui, React réutilise l'instance précédente et son état
                  "en lecture" reste bloqué sur l'ancienne question. */}
              <AudioPrompt key={current} url={q.audio_url} />
            </div>
          ) : (
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
          )}
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
                    {q?.audio_url ? (
                      <div className="mt-1">
                        <AudioPrompt url={q.audio_url} compact />
                      </div>
                    ) : (
                      <p
                        className="text-sm font-medium mt-0.5"
                        style={{ color: "#1C1A17" }}
                        dir={q?.direction === "ar_to_fr" ? "rtl" : undefined}
                      >
                        {q?.prompt}
                      </p>
                    )}
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
