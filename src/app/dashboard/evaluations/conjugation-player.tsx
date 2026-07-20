"use client";

import { useState } from "react";

import { personByCode, type PersonCode, type Tense } from "@/lib/conjugation";
import type { ConjQuestion, ConjAnswer, ConjResult } from "./actions";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";
import { KhatamOrnament } from "@/components/khatam-ornament";

const LENGTH_OPTIONS = [10, 20, 30, 50] as const;

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
    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: size, color: "var(--tk-ink-hero-to)", fontWeight: 700 }}>
      {children}
    </span>
  );
}

export function ConjugationQuizPlayer({
  unlockedTenses,
  generate,
  submit,
  onActiveChange,
}: {
  /** Temps débloqués pour cet élève (détectés depuis ses grammar_rules), dans
   *  l'ordre madi→mudari→amr. Toujours ≥1 (sinon la tuile n'est pas affichée). */
  unlockedTenses: Tense[];
  generate: (tenses: string[], size: number) => Promise<ConjQuestion[]>;
  submit: (answers: ConjAnswer[]) => Promise<ConjResult>;
  onActiveChange?: (active: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [loading, setLoading] = useState(false);
  const [tense, setTense] = useState<string>("mix");
  const [size, setSize] = useState<number>(20);
  const [reviewIndex, setReviewIndex] = useState(0);

  const start = async () => {
    setLoading(true);
    onActiveChange?.(true);
    try {
      const tenses = tense === "mix" ? unlockedTenses : [tense];
      const questions = await generate(tenses, size);
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
      <div
        className="rounded-[18px] p-5 flex flex-col gap-4"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 19, color: "var(--tk-ink-text)" }}>Quiz de conjugaison</p>
          <p className="text-sm mt-0.5" style={{ color: "var(--tk-muted-olive)" }}>
            Conjugue tes verbes, ou retrouve la personne d’une forme conjuguée.
          </p>
        </div>
        {unlockedTenses.length > 1 && (
          <div className="space-y-1.5">
            <label htmlFor="conj-tense" className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tk-muted-olive)" }}>
              Temps
            </label>
            <select
              id="conj-tense"
              value={tense}
              onChange={(e) => setTense(e.target.value)}
              className="w-full rounded-[13px] px-3.5 outline-none"
              style={{ height: 46, background: "var(--tk-parchment-field)", border: "1.5px solid var(--tk-parchment-border)", fontSize: 14, color: "var(--tk-ink-text)" }}
            >
              <option value="mix">Mix (tous les temps vus)</option>
              {unlockedTenses.map((t) => (
                <option key={t} value={t}>
                  {TENSE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Longueur du quiz : paliers, plafonnés au contenu réel disponible */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tk-muted-olive)" }}>
            Nombre de questions
          </label>
          <div className="grid grid-cols-4 gap-2">
            {LENGTH_OPTIONS.map((n) => {
              const selected = size === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSize(n)}
                  className="rounded-[12px] py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
                  style={
                    selected
                      ? { background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))", color: "#fff" }
                      : { background: "var(--tk-parchment-field)", color: "var(--tk-ink-text)", border: "1.5px solid var(--tk-parchment-border)" }
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={start}
          disabled={loading}
          className="w-full rounded-[14px] py-3.5 font-bold text-sm transition-opacity hover:opacity-85 disabled:opacity-60"
          style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)", boxShadow: "var(--tk-shadow-cta)" }}
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
      <div className="-mx-4 -mt-5">
        <div
          className="hachure-ink px-[22px] pb-6 pt-6"
          style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 15, color: "var(--tk-sage)" }}>
              Quiz de conjugaison
            </span>
            <span dir="ltr" className="font-bold" style={{ fontSize: 12, color: "var(--tk-gold-light)", unicodeBidi: "bidi-override" }}>
              {toArabicIndicDigits(current + 1)} / {toArabicIndicDigits(questions.length)}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,.12)", height: 7 }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--tk-gold-light), var(--tk-gold))" }}
            />
          </div>
        </div>

        <div className="px-[22px] pt-5 pb-2 flex flex-col gap-4">
          <div
            className="rounded-[20px] p-6"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 16px 30px -18px rgba(10,20,15,.45)" }}
          >
            <p className="font-bold uppercase mb-3.5" style={{ fontSize: 11, letterSpacing: ".16em", color: "var(--tk-gold)" }}>
              {q.qtype === "conjugate"
                ? `Conjugue au ${TENSE_LABEL[q.tense] ?? q.tense}`
                : "À quelle personne est cette forme ?"}
            </p>
            {q.qtype === "conjugate" ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline gap-2.5">
                  <ArabicBig size={28}>{q.verb_ar}</ArabicBig>
                  <span style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>{q.verb_fr}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--tk-ink-text-soft)", fontSize: 14 }}>pour</span>
                  <span
                    className="inline-flex items-center gap-2 rounded-[10px] px-3 py-1"
                    style={{ background: "rgba(12,107,78,.10)", border: "1px solid rgba(12,107,78,.28)" }}
                  >
                    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "var(--tk-green-active)" }}>
                      {pron(q.person_code)}
                    </span>
                    <span style={{ color: "var(--tk-green-active)", fontSize: 12 }}>{pronFr(q.person_code)}</span>
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
                    style={{ background: "var(--tk-parchment-card)", border: "1.5px solid var(--tk-parchment-border)", boxShadow: "0 8px 18px -14px rgba(10,20,15,.35)" }}
                  >
                    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "var(--tk-ink-text)" }}>{c}</span>
                  </button>
                ))
              : q.choices.map((code, idx) => (
                  <button
                    key={idx}
                    onClick={() => choose(code)}
                    disabled={loading}
                    className="w-full rounded-[14px] px-4 py-3 flex items-center justify-between gap-3 transition-opacity hover:opacity-80 disabled:opacity-50"
                    style={{ background: "var(--tk-parchment-card)", border: "1.5px solid var(--tk-parchment-border)", boxShadow: "0 8px 18px -14px rgba(10,20,15,.35)" }}
                  >
                    <span style={{ color: "var(--tk-ink-text-soft)", fontSize: 14 }}>{pronFr(code)}</span>
                    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "var(--tk-ink-hero-to)", fontWeight: 700 }}>{pron(code)}</span>
                  </button>
                ))}
          </div>

          {current > 0 && (
            <button
              onClick={goPrev}
              disabled={loading}
              className="self-start inline-flex items-center gap-1.5 rounded-[13px] px-4 py-2.5 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "transparent", color: "var(--tk-ink-hero-to)", border: "1px solid rgba(12,58,44,.3)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-hero-to)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Précédent
            </button>
          )}
          {loading && <p className="text-center text-sm" style={{ color: "var(--tk-muted-olive)" }}>Calcul du score…</p>}
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  const { result } = phase;
  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  const mood = pct === 100 ? "Excellent" : pct >= 70 ? "Bien joué" : "Continue à réviser";
  const wrong = result.answers.filter((a) => !a.is_correct);
  const hasWrong = wrong.length > 0;
  const clamped = Math.min(reviewIndex, Math.max(0, wrong.length - 1));
  const a = hasWrong ? wrong[clamped] : undefined;

  const RING_R = 42;
  const RING_C = 2 * Math.PI * RING_R;
  const ringOffset = RING_C * (1 - pct / 100);

  return (
    <div
      className="hachure-ink -mx-4 -mt-5 flex flex-col items-center px-6 pb-8 pt-10"
      style={{ background: "linear-gradient(180deg, var(--tk-ink-hero-from), var(--tk-ink-deep))", minHeight: "calc(100vh - 160px)" }}
    >
      <p style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 19, color: "var(--tk-sage)" }}>
        Mâ shâ Allah !
      </p>
      <h1
        className="text-center mt-1"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 30, color: "var(--tk-cream-text)" }}
      >
        Quiz de conjugaison terminé
      </h1>

      <div className="relative mt-6" style={{ width: 190, height: 190 }}>
        <KhatamOrnament size={190} strokeWidth={0.4} className="absolute inset-0" style={{ opacity: 0.4 }} />
        <svg width="190" height="190" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
          <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(199,154,62,.15)" strokeWidth="5" />
          <circle
            cx="50"
            cy="50"
            r={RING_R}
            fill="none"
            stroke="url(#conjGoldRing)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={ringOffset}
          />
          <defs>
            <linearGradient id="conjGoldRing" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--tk-gold-light)" />
              <stop offset="1" stopColor="var(--tk-gold)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div style={{ fontFamily: "var(--font-spectral)", fontSize: 56, fontWeight: 700, color: "var(--tk-gold-light)", lineHeight: 0.9 }}>
            {result.score}
            <span style={{ fontSize: 26, color: "var(--tk-sage)" }}>/{result.total}</span>
          </div>
          <div
            className="mt-1 text-center uppercase"
            style={{ fontSize: 10, letterSpacing: ".15em", color: "var(--tk-sage)", maxWidth: 118, lineHeight: 1.3 }}
          >
            {mood}
          </div>
        </div>
      </div>

      <div className="w-full flex gap-3 mt-8">
        <div className="flex-1 rounded-[16px] p-3.5 text-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.25)" }}>
          <div style={{ fontFamily: "var(--font-spectral)", fontSize: 26, fontWeight: 700, color: "var(--tk-sage-bright)" }}>
            {result.total - wrong.length}
          </div>
          <div className="mt-1" style={{ fontSize: 10.5, color: "var(--tk-sage)" }}>Correctes</div>
        </div>
        <div className="flex-1 rounded-[16px] p-3.5 text-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.25)" }}>
          <div style={{ fontFamily: "var(--font-spectral)", fontSize: 26, fontWeight: 700, color: "var(--tk-danger-dot)" }}>
            {wrong.length}
          </div>
          <div className="mt-1" style={{ fontSize: 10.5, color: "var(--tk-sage)" }}>À revoir</div>
        </div>
        <div className="flex-1 rounded-[16px] p-3.5 text-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.25)" }}>
          <div style={{ fontFamily: "var(--font-spectral)", fontSize: 26, fontWeight: 700, color: "var(--tk-gold-light)" }}>
            {pct}%
          </div>
          <div className="mt-1" style={{ fontSize: 10.5, color: "var(--tk-sage)" }}>Score</div>
        </div>
      </div>

      {!hasWrong ? (
        <div className="w-full rounded-[16px] p-4 mt-5 text-center" style={{ background: "rgba(143,203,168,.08)", border: "1px solid rgba(143,203,168,.3)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--tk-sage-bright)" }}>Aucune erreur, bravo !</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3 mt-5">
          <div className="rounded-[16px] p-4 space-y-1.5" style={{ background: "rgba(217,139,126,.08)", border: "1px solid rgba(217,139,126,.3)" }}>
            <p className="font-bold uppercase mb-1" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--tk-danger-dot)" }}>
              À revoir · {clamped + 1}/{wrong.length}
            </p>
            {a && a.qtype === "conjugate" ? (
              <>
                <p className="text-xs" style={{ color: "var(--tk-sage)" }}>
                  {TENSE_LABEL[a.tense] ?? a.tense} — {pronFr(a.person_code)}
                </p>
                <div className="flex items-baseline gap-2">
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 22, color: "var(--tk-cream-text)", fontWeight: 700 }}>{a.verb_ar}</span>
                  <span style={{ color: "var(--tk-sage)", fontSize: 12 }}>{a.verb_fr}</span>
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 18, color: "var(--tk-gold-light)" }}>{pron(a.person_code)}</span>
                </div>
                <p className="text-xs" style={{ color: "#C7D2C1" }}>
                  Ta réponse : <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 17, color: "var(--tk-danger-dot)" }}>{a.chosen}</span>
                </p>
                <p className="text-xs font-semibold" style={{ color: "var(--tk-cream-text)" }}>
                  Bonne réponse : <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 17 }}>{a.correct}</span>
                </p>
              </>
            ) : a && a.qtype === "which_person" ? (
              <>
                <p className="text-xs" style={{ color: "var(--tk-sage)" }}>
                  {TENSE_LABEL[a.tense] ?? a.tense} — quelle personne ?
                </p>
                <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 24, color: "var(--tk-cream-text)", fontWeight: 700 }}>{a.shown_form}</span>
                <p className="text-xs" style={{ color: "#C7D2C1" }}>
                  Ta réponse : {pronFr(a.chosen)}{" "}
                  <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 16, color: "var(--tk-danger-dot)" }}>{pron(a.chosen)}</span>
                </p>
                {a.correct_person && (
                  <p className="text-xs font-semibold" style={{ color: "var(--tk-cream-text)" }}>
                    Bonne réponse : {pronFr(a.correct_person)}{" "}
                    <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 16 }}>{pron(a.correct_person)}</span>
                  </p>
                )}
              </>
            ) : null}
          </div>
          {wrong.length > 1 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                disabled={clamped === 0}
                className="flex-1 rounded-[14px] py-3 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-40"
                style={{ background: "transparent", color: "var(--tk-gold-light)", border: "1px solid rgba(199,154,62,.4)" }}
              >
                Précédent
              </button>
              <button
                onClick={() => setReviewIndex((i) => Math.min(wrong.length - 1, i + 1))}
                disabled={clamped === wrong.length - 1}
                className="flex-1 rounded-[14px] py-3 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-40"
                style={{ background: "transparent", color: "var(--tk-gold-light)", border: "1px solid rgba(199,154,62,.4)" }}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      <div className="w-full flex gap-3 mt-6">
        <button
          onClick={restart}
          className="flex-1 rounded-[14px] py-3.5 font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "transparent", color: "var(--tk-gold-light)", border: "1px solid rgba(199,154,62,.4)" }}
        >
          Revoir
        </button>
        <button
          onClick={restart}
          className="flex-1 rounded-[14px] py-3.5 font-bold text-sm transition-opacity hover:opacity-85"
          style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)", boxShadow: "var(--tk-shadow-cta)" }}
        >
          Continuer
        </button>
      </div>
    </div>
  );
}
