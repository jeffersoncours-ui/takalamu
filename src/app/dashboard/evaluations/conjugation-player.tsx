"use client";

import { useState } from "react";

import { personByCode, type PersonCode } from "@/lib/conjugation";
import type { ConjQuestion, ConjAnswer, ConjResult } from "./actions";

const GREEN = "#0F9D6E";
const RED = "#B4292E";

const TENSE_LABEL: Record<string, string> = {
  madi: "Passé (الماضي)",
  mudari: "Présent (المضارع)",
  amr: "Impératif (الأمر)",
};

type Phase =
  | { name: "idle" }
  | { name: "playing"; questions: ConjQuestion[]; current: number; answers: (ConjAnswer | null)[] }
  | { name: "done"; result: ConjResult };

const pron = (code: string) => personByCode(code as PersonCode).pron;
const pronFr = (code: string) => personByCode(code as PersonCode).fr;

function ArabicBig({ children, size = 30 }: { children: React.ReactNode; size?: number }) {
  return (
    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: size, color: "#1C1A17", fontWeight: 700 }}>
      {children}
    </span>
  );
}

export function ConjugationQuizPlayer({
  generate,
  submit,
  onActiveChange,
}: {
  generate: (tense?: string) => Promise<ConjQuestion[]>;
  submit: (answers: ConjAnswer[]) => Promise<ConjResult>;
  onActiveChange?: (active: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [loading, setLoading] = useState(false);
  const [tense, setTense] = useState<string>("all");
  const [reviewIndex, setReviewIndex] = useState(0);

  const start = async () => {
    setLoading(true);
    onActiveChange?.(true);
    try {
      const questions = await generate(tense === "all" ? undefined : tense);
      if (questions.length > 0) {
        setPhase({ name: "playing", questions, current: 0, answers: questions.map(() => null) });
      } else {
        onActiveChange?.(false);
      }
    } catch {
      onActiveChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  const choose = async (chosen: string) => {
    if (phase.name !== "playing") return;
    const { questions, current, answers } = phase;
    const q = questions[current];
    const answer: ConjAnswer =
      q.qtype === "conjugate"
        ? { qtype: "conjugate", vocab_id: q.vocab_id, tense: q.tense, person_code: q.person_code, chosen }
        : { qtype: "which_person", vocab_id: q.vocab_id, tense: q.tense, shown_form: q.shown_form, chosen };
    const newAnswers = [...answers];
    newAnswers[current] = answer;

    if (current + 1 < questions.length) {
      setPhase({ name: "playing", questions, current: current + 1, answers: newAnswers });
      return;
    }
    setLoading(true);
    try {
      const result = await submit(newAnswers as ConjAnswer[]);
      setReviewIndex(0);
      setPhase({ name: "done", result });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => {
    if (phase.name !== "playing" || phase.current === 0) return;
    setPhase({ ...phase, current: phase.current - 1 });
  };

  const restart = () => {
    setPhase({ name: "idle" });
    setReviewIndex(0);
    onActiveChange?.(false);
  };

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (phase.name === "idle") {
    return (
      <div className="rounded-[18px] p-5 flex flex-col gap-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <div>
          <p className="font-semibold text-base" style={{ color: "#1C1A17" }}>Quiz de conjugaison</p>
          <p className="text-sm mt-0.5" style={{ color: "#8B857A" }}>
            Conjugue tes verbes, ou retrouve la personne d’une forme conjuguée.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="conj-tense" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B857A" }}>
            Temps
          </label>
          <select
            id="conj-tense"
            value={tense}
            onChange={(e) => setTense(e.target.value)}
            className="w-full rounded-[13px] px-3.5 outline-none"
            style={{ height: 46, background: "#FBF9F5", border: "1.5px solid #E9E3D8", fontSize: 14, color: "#1C1A17" }}
          >
            <option value="all">Tous les temps</option>
            <option value="madi">Passé (الماضي)</option>
            <option value="mudari">Présent (المضارع)</option>
            <option value="amr">Impératif (الأمر)</option>
          </select>
        </div>
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
    const progress = (current / questions.length) * 100;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 rounded-full overflow-hidden" style={{ background: "#EFEAE0", height: 6 }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: GREEN }} />
          </div>
          <span className="text-xs font-semibold shrink-0" style={{ color: "#8B857A" }}>
            {current + 1} / {questions.length}
          </span>
        </div>

        <div className="rounded-[18px] p-5" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "#8B857A" }}>
            {q.qtype === "conjugate"
              ? `Conjugue au ${TENSE_LABEL[q.tense] ?? q.tense}`
              : "À quelle personne est cette forme ?"}
          </p>
          {q.qtype === "conjugate" ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2.5">
                <ArabicBig size={28}>{q.verb_ar}</ArabicBig>
                <span style={{ color: "#8B857A", fontSize: 13 }}>{q.verb_fr}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: "#4A463F", fontSize: 14 }}>pour</span>
                <span
                  className="inline-flex items-center gap-2 rounded-[10px] px-3 py-1"
                  style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}
                >
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "#0A6B4E" }}>
                    {pron(q.person_code)}
                  </span>
                  <span style={{ color: "#0A6B4E", fontSize: 12 }}>{pronFr(q.person_code)}</span>
                </span>
              </div>
            </div>
          ) : (
            <ArabicBig size={36}>{q.shown_form}</ArabicBig>
          )}
        </div>

        {/* Choix : 1 clic valide et avance */}
        <div className="flex flex-col gap-2.5">
          {q.qtype === "conjugate"
            ? q.choices.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => choose(c)}
                  disabled={loading}
                  className="w-full rounded-[14px] px-4 py-3.5 text-right transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "#fff", border: "1.5px solid #EFEAE0" }}
                >
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "#1C1A17" }}>{c}</span>
                </button>
              ))
            : q.choices.map((code, idx) => (
                <button
                  key={idx}
                  onClick={() => choose(code)}
                  disabled={loading}
                  className="w-full rounded-[14px] px-4 py-3 flex items-center justify-between gap-3 transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "#fff", border: "1.5px solid #EFEAE0" }}
                >
                  <span style={{ color: "#4A463F", fontSize: 14 }}>{pronFr(code)}</span>
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "#0A553F", fontWeight: 700 }}>{pron(code)}</span>
                </button>
              ))}
        </div>

        {current > 0 && (
          <button
            onClick={goPrev}
            disabled={loading}
            className="self-start rounded-[14px] px-5 py-3.5 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
          >
            Précédent
          </button>
        )}
        {loading && <p className="text-center text-sm" style={{ color: "#8B857A" }}>Calcul du score…</p>}
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const { result } = phase;
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const isGood = pct >= 70;
  const wrong = result.answers.filter((a) => !a.is_correct);
  const hasWrong = wrong.length > 0;
  const clamped = Math.min(reviewIndex, Math.max(0, wrong.length - 1));
  const a = hasWrong ? wrong[clamped] : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-[18px] p-6 text-center"
        style={{ background: isGood ? "#ECFAF4" : "#FDECEC", border: `1px solid ${isGood ? "#C8EBDB" : "#F3B0B2"}` }}
      >
        <p className="text-5xl font-bold" style={{ color: isGood ? GREEN : RED, fontFamily: "var(--font-spectral)" }}>
          {result.score}/{result.total}
        </p>
        <p className="text-lg font-semibold mt-1" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>{pct}%</p>
        <p className="text-sm mt-2" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>
          {pct === 100 ? "Parfait !" : pct >= 70 ? "Bien joué !" : "Continue à réviser !"}
        </p>
      </div>

      {!hasWrong ? (
        <div className="rounded-[18px] p-5 text-center" style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}>
          <p className="text-sm font-semibold" style={{ color: "#0A6B4E" }}>Aucune erreur, bravo !</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B857A" }}>
            Erreur {clamped + 1} / {wrong.length}
          </p>
          <div className="rounded-[14px] p-3.5 space-y-1.5" style={{ background: "#FFF8F8", border: "1px solid #F3B0B2" }}>
            {a && a.qtype === "conjugate" ? (
              <>
                <p className="text-xs font-semibold" style={{ color: "#8B857A" }}>
                  {TENSE_LABEL[a.tense] ?? a.tense} — {pronFr(a.person_code)}
                </p>
                <div className="flex items-baseline gap-2">
                  <ArabicBig size={22}>{a.verb_ar}</ArabicBig>
                  <span style={{ color: "#8B857A", fontSize: 12 }}>{a.verb_fr}</span>
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 18, color: "#0A6B4E" }}>{pron(a.person_code)}</span>
                </div>
                <p className="text-xs" style={{ color: RED }}>
                  Ta réponse : <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 17 }}>{a.chosen}</span>
                </p>
                <p className="text-xs font-semibold" style={{ color: "#0A6B4E" }}>
                  Bonne réponse : <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 17 }}>{a.correct}</span>
                </p>
              </>
            ) : a && a.qtype === "which_person" ? (
              <>
                <p className="text-xs font-semibold" style={{ color: "#8B857A" }}>
                  {TENSE_LABEL[a.tense] ?? a.tense} — quelle personne ?
                </p>
                <ArabicBig size={24}>{a.shown_form}</ArabicBig>
                <p className="text-xs" style={{ color: RED }}>
                  Ta réponse : {pronFr(a.chosen)}{" "}
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 16 }}>{pron(a.chosen)}</span>
                </p>
                {a.correct_person && (
                  <p className="text-xs font-semibold" style={{ color: "#0A6B4E" }}>
                    Bonne réponse : {pronFr(a.correct_person)}{" "}
                    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 16 }}>{pron(a.correct_person)}</span>
                  </p>
                )}
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
              disabled={clamped === 0}
              className="flex-1 rounded-[14px] py-3 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
            >
              Précédent
            </button>
            <button
              onClick={() => setReviewIndex((i) => Math.min(wrong.length - 1, i + 1))}
              disabled={clamped === wrong.length - 1}
              className="flex-1 rounded-[14px] py-3 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
            >
              Suivant
            </button>
          </div>
        </div>
      )}

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
