"use client";

import { useRef, useState } from "react";
import type { QuizQuestion, QuizAnswer, QuizResult } from "./actions";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";
import { KhatamOrnament } from "@/components/khatam-ornament";

type Phase =
  | { name: "idle" }
  | { name: "playing"; questions: QuizQuestion[]; current: number; answers: (QuizAnswer | null)[] }
  | { name: "done"; result: QuizResult; questions: QuizQuestion[] };

const GREEN = "var(--tk-emerald-btn-from)";

/** Un seul audio à la fois sur tout l'écran quiz : lancer une lecture coupe
 *  celle en cours, où qu'elle soit (question, propositions, correction). */
let activeAudioEl: HTMLAudioElement | null = null;

/** Lecteur de question audio (compréhension orale) : gros bouton Écouter,
 *  réécoutable à volonté — aucun texte arabe affiché. Variante `neutral`
 *  (contour) pour les boutons d'écoute des propositions, où le vert est
 *  réservé au bouton « Choisir ». */
function AudioPrompt({
  url,
  compact,
  neutral,
}: {
  url: string;
  compact?: boolean;
  neutral?: boolean;
}) {
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
      if (activeAudioEl && activeAudioEl !== el) {
        activeAudioEl.pause();
        activeAudioEl.currentTime = 0;
      }
      activeAudioEl = el;
      void el.play();
      setPlaying(true);
    }
  };

  const fill = neutral ? (playing ? "var(--tk-green-active)" : "var(--tk-ink-text-soft)") : "#fff";
  const btnStyle: React.CSSProperties = neutral
    ? {
        background: playing ? "rgba(12,107,78,.10)" : "var(--tk-parchment-field)",
        color: playing ? "var(--tk-green-active)" : "var(--tk-ink-text-soft)",
        border: `1.5px solid ${playing ? "rgba(12,107,78,.28)" : "var(--tk-parchment-border)"}`,
        fontSize: compact ? 12 : 14,
        padding: compact ? "6px 14px" : "10px 18px",
      }
    : {
        background: playing ? "var(--tk-green-active)" : GREEN,
        color: "#fff",
        fontSize: compact ? 12 : 15,
        padding: compact ? "6px 14px" : "12px 22px",
      };

  return (
    <span className="inline-flex">
      <audio
        ref={audioRef}
        src={url}
        preload="auto"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full font-bold transition-opacity hover:opacity-85"
        style={btnStyle}
      >
        {playing ? (
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill={fill}>
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width={compact ? 12 : 16} height={compact ? 12 : 16} viewBox="0 0 24 24" fill={fill}>
            <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.9-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14Z" />
          </svg>
        )}
        {playing ? "Stop" : "Écouter"}
      </button>
    </span>
  );
}

export type QuizLabels = {
  title: string;
  unit: string;
  unitPlural: string;
  intro: string;
  emptyTitle: string;
  emptyBody: string;
  arToFrQuestion: string;
  frToArQuestion: string;
  /** Question de compréhension orale AR→FR (formulation avec audio). */
  arToFrAudioQuestion?: string;
  /** Mode « FR → écoute des 4 audios » (formulation seulement). */
  frToArAudioQuestion?: string;
};

const LENGTH_OPTIONS = [10, 20, 30, 50] as const;

export default function QuizPlayer({
  count,
  generate,
  submit,
  labels,
  onActiveChange,
}: {
  count: number;
  generate: (size: number) => Promise<QuizQuestion[]>;
  submit: (answers: QuizAnswer[]) => Promise<QuizResult>;
  labels: QuizLabels;
  /** Prévient le parent qu'un quiz est en cours (dès le clic, avant même la
   *  réponse serveur) — permet de masquer le reste de la page et d'empêcher
   *  le lancement simultané d'un autre quiz. */
  onActiveChange?: (active: boolean) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "idle" });
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState<number>(20);
  const [reviewIndex, setReviewIndex] = useState(0);

  const start = async () => {
    setLoading(true);
    onActiveChange?.(true);
    try {
      const questions = await generate(size);
      if (questions.length > 0) {
        setPhase({ name: "playing", questions, current: 0, answers: questions.map(() => null) });
      } else {
        onActiveChange?.(false);
      }
    } catch {
      // silent — edge case, user can retry
      onActiveChange?.(false);
    } finally {
      setLoading(false);
    }
  };

  // Choisir une réponse la valide et avance directement à la question
  // suivante (un seul clic, pas de bouton "Suivant"/"Terminer" à part) —
  // sur la dernière question, soumet directement. "Précédent" permet d'y
  // revenir et de la changer (le clic ré-écrit alors la réponse et
  // ré-avance), sans jamais bloquer sur une validation à part.
  const choose = async (chosen: string) => {
    if (phase.name !== "playing") return;
    const { questions, current, answers } = phase;
    const q = questions[current];
    const answer: QuizAnswer = {
      source: q.source,
      item_id: q.item_id,
      direction: q.direction,
      chosen,
      // fr_to_ar_audio : `chosen` = token de la formulation écoutée, le prompt
      // français round-trip pour le scoring serveur (pas d'id-source échangé).
      ...(q.direction === "fr_to_ar_audio" ? { prompt: q.prompt } : {}),
    };
    const newAnswers = [...answers];
    newAnswers[current] = answer;

    if (current + 1 < questions.length) {
      setPhase({ name: "playing", questions, current: current + 1, answers: newAnswers });
      return;
    }

    setLoading(true);
    try {
      const result = await submit(newAnswers as QuizAnswer[]);
      setReviewIndex(0);
      setPhase({ name: "done", result, questions });
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
    if (count < 4) {
      return (
        <div
          className="rounded-[18px] p-5 text-center"
          style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
        >
          <p className="text-base font-semibold mb-1" style={{ color: "var(--tk-ink-text)" }}>
            {labels.emptyTitle}
          </p>
          <p className="text-sm" style={{ color: "var(--tk-muted-olive)" }}>
            {labels.emptyBody}
          </p>
        </div>
      );
    }

    const effective = Math.min(size, count);

    return (
      <div
        className="rounded-[18px] p-5 flex flex-col gap-4"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
      >
        <div>
          <p style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 19, color: "var(--tk-ink-text)" }}>
            {labels.title}
          </p>
          <p className="text-sm mt-0.5" style={{ color: "var(--tk-muted-olive)" }}>
            {count} {count > 1 ? labels.unitPlural : labels.unit}
          </p>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--tk-ink-text-soft)" }}>
          {labels.intro}
        </p>

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

        <p className="text-xs" style={{ color: "var(--tk-muted-olive)" }}>
          {effective} question{effective > 1 ? "s" : ""} pour ce quiz.
        </p>

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
    const { questions, current, answers } = phase;
    const q = questions[current];
    const currentAnswer = answers[current];
    const progress = ((current) / questions.length) * 100;
    const isArabicAnswer = q.direction === "fr_to_ar";

    return (
      <div className="-mx-4 -mt-5">
        {/* Progress, sur fond encre */}
        <div
          className="hachure-ink px-[22px] pb-6 pt-6"
          style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 15, color: "var(--tk-sage)" }}>
              {labels.title}
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
          {/* Question card */}
          <div
            className="rounded-[20px] p-6 text-center"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 16px 30px -18px rgba(10,20,15,.45)" }}
          >
            <p className="font-bold uppercase mb-3.5" style={{ fontSize: 11, letterSpacing: ".16em", color: "var(--tk-gold)" }}>
              {q.direction === "fr_to_ar_audio"
                ? labels.frToArAudioQuestion ?? labels.frToArQuestion
                : q.audio_url
                ? labels.arToFrAudioQuestion ?? labels.arToFrQuestion
                : q.direction === "ar_to_fr"
                ? labels.arToFrQuestion
                : labels.frToArQuestion}
            </p>
            {q.audio_url ? (
              <div className="py-1 flex justify-center">
                {/* key=current force un remontage complet à chaque question :
                    sans lui, React réutilise l'instance précédente et son état
                    "en lecture" reste bloqué sur l'ancienne question. */}
                <AudioPrompt key={current} url={q.audio_url} />
              </div>
            ) : (
              <p
                className="font-bold leading-snug"
                dir={q.direction === "ar_to_fr" ? "rtl" : undefined}
                lang={q.direction === "ar_to_fr" ? "ar" : undefined}
                style={{
                  color: "var(--tk-ink-hero-to)",
                  fontSize: q.direction === "ar_to_fr" ? 44 : 24,
                  fontFamily: q.direction === "ar_to_fr" ? "var(--font-amiri)" : "var(--font-spectral)",
                }}
              >
                {q.prompt}
              </p>
            )}
          </div>

          {/* Choices : audio (mode audio-choix) ou texte */}
          {q.audio_choices ? (
            <div className="flex flex-col gap-2.5">
              {q.audio_choices.map((c, idx) => {
                const isSelected = currentAnswer?.chosen === c.token;
                return (
                  <div
                    key={`${current}-${c.token}`}
                    className="w-full rounded-[14px] px-3.5 py-3 flex items-center gap-3"
                    style={{
                      background: isSelected
                        ? "linear-gradient(180deg, rgba(14,74,56,.1), rgba(12,58,44,.08))"
                        : "var(--tk-parchment-card)",
                      border: `1.5px solid ${isSelected ? "var(--tk-emerald-btn-from)" : "var(--tk-parchment-border)"}`,
                    }}
                  >
                    <span
                      className="shrink-0 inline-flex items-center justify-center rounded-full text-xs font-bold"
                      style={{ width: 24, height: 24, background: "var(--tk-parchment-field)", color: "var(--tk-muted-olive)" }}
                    >
                      {idx + 1}
                    </span>
                    <AudioPrompt url={c.audio_url} neutral compact />
                    <button
                      onClick={() => choose(c.token)}
                      disabled={loading}
                      className="ml-auto shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                      style={
                        isSelected
                          ? { background: "var(--tk-emerald-btn-from)", color: "#fff" }
                          : { background: "var(--tk-parchment-card)", color: "var(--tk-ink-text)", border: "1.5px solid var(--tk-parchment-border)" }
                      }
                    >
                      {isSelected ? "Sélectionné ✓" : "Choisir"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {q.choices.map((choice, idx) => {
                const isSelected = currentAnswer?.chosen === choice;
                return (
                  <button
                    key={idx}
                    onClick={() => choose(choice)}
                    disabled={loading}
                    className="w-full rounded-[14px] px-[17px] py-[15px] text-left font-medium text-sm transition-opacity hover:opacity-80 disabled:opacity-50 flex items-center justify-between"
                    style={{
                      background: isSelected
                        ? "linear-gradient(180deg, rgba(14,74,56,.1), rgba(12,58,44,.08))"
                        : "var(--tk-parchment-card)",
                      border: `1.5px solid ${isSelected ? "var(--tk-emerald-btn-from)" : "var(--tk-parchment-border)"}`,
                      color: isSelected ? "var(--tk-ink-hero-to)" : "#3C4A3F",
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: isArabicAnswer ? "right" : "left",
                      boxShadow: "0 8px 18px -14px rgba(10,20,15,.35)",
                    }}
                    dir={isArabicAnswer ? "rtl" : undefined}
                    lang={isArabicAnswer ? "ar" : undefined}
                  >
                    <span style={{ fontFamily: isArabicAnswer ? "var(--font-amiri)" : undefined }}>
                      {choice}
                    </span>
                    {isSelected && (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--tk-emerald-btn-from)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Retour possible sur une question déjà vue pour changer sa réponse
              (main glissée, erreur) — cliquer une option valide toujours et
              avance directement, aucun bouton de validation séparé. */}
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

          {loading && (
            <p className="text-center text-sm" style={{ color: "var(--tk-muted-olive)" }}>
              Calcul du score…
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  if (phase.name === "done") {
    const { result, questions } = phase;
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    const mood = pct === 100 ? "Excellent" : pct >= 70 ? "Bien joué" : "Continue à réviser";

    const wrongIndices = result.answers
      .map((_, idx) => idx)
      .filter((idx) => !result.answers[idx].is_correct);
    const hasWrong = wrongIndices.length > 0;
    const clampedReviewIndex = Math.min(reviewIndex, Math.max(0, wrongIndices.length - 1));
    const idx = hasWrong ? wrongIndices[clampedReviewIndex] : -1;
    const a = hasWrong ? result.answers[idx] : undefined;
    const q = hasWrong ? questions[idx] : undefined;
    // Réponses en arabe pour les deux sens FR→AR (texte et audio-choix).
    const isAr = a ? a.direction !== "ar_to_fr" : false;

    // Anneau de progression (r=42, C=2πr) — même technique que la maquette.
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
          {labels.title} terminé
        </h1>

        {/* Anneau de score */}
        <div className="relative mt-6" style={{ width: 190, height: 190 }}>
          <KhatamOrnament
            size={190}
            strokeWidth={0.4}
            circle={false}
            className="absolute inset-0"
            style={{ opacity: 0.4 }}
          />
          <svg width="190" height="190" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={RING_R} fill="none" stroke="rgba(199,154,62,.15)" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r={RING_R}
              fill="none"
              stroke="url(#quizGoldRing)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={ringOffset}
            />
            <defs>
              <linearGradient id="quizGoldRing" x1="0" y1="0" x2="1" y2="1">
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

        {/* Stats */}
        <div className="w-full flex gap-3 mt-8">
          <div className="flex-1 rounded-[16px] p-3.5 text-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.25)" }}>
            <div style={{ fontFamily: "var(--font-spectral)", fontSize: 26, fontWeight: 700, color: "var(--tk-sage-bright)" }}>
              {result.total - wrongIndices.length}
            </div>
            <div className="mt-1" style={{ fontSize: 10.5, color: "var(--tk-sage)" }}>Correctes</div>
          </div>
          <div className="flex-1 rounded-[16px] p-3.5 text-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(199,154,62,.25)" }}>
            <div style={{ fontFamily: "var(--font-spectral)", fontSize: 26, fontWeight: 700, color: "var(--tk-danger-dot)" }}>
              {wrongIndices.length}
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

        {/* Correction : uniquement les mauvaises réponses, une par une */}
        {!hasWrong ? (
          <div
            className="w-full rounded-[16px] p-4 mt-5 text-center"
            style={{ background: "rgba(143,203,168,.08)", border: "1px solid rgba(143,203,168,.3)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--tk-sage-bright)" }}>
              Aucune erreur, bravo !
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3 mt-5">
            <div
              className="rounded-[16px] p-4"
              style={{ background: "rgba(217,139,126,.08)", border: "1px solid rgba(217,139,126,.3)" }}
            >
              <p className="font-bold uppercase mb-2" style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--tk-danger-dot)" }}>
                À revoir · {clampedReviewIndex + 1}/{wrongIndices.length}
              </p>
              {q?.audio_url ? (
                <div className="mt-1">
                  <AudioPrompt url={q.audio_url} compact />
                </div>
              ) : (
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--tk-cream-text)" }}
                  dir={q?.direction === "ar_to_fr" ? "rtl" : undefined}
                >
                  {q?.prompt}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span style={{ fontSize: 13.5, color: "#C7D2C1" }}>
                  Ta réponse :{" "}
                  <span dir={isAr ? "rtl" : undefined} style={{ fontFamily: isAr ? "var(--font-amiri)" : undefined, color: "var(--tk-danger-dot)" }}>
                    {a?.chosen}
                  </span>
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span style={{ fontSize: 13.5, color: "#C7D2C1" }}>Bonne réponse :</span>
                <span dir={isAr ? "rtl" : undefined} lang={isAr ? "ar" : undefined} className={isAr ? "font-arabic" : undefined} style={{ fontSize: isAr ? 20 : 13.5, color: "var(--tk-cream-text)", fontWeight: 600 }}>
                  {a?.correct}
                </span>
              </div>
            </div>

            {wrongIndices.length > 1 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setReviewIndex((i) => Math.max(0, i - 1))}
                  disabled={clampedReviewIndex === 0}
                  className="flex-1 rounded-[14px] py-3 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-40"
                  style={{ background: "transparent", color: "var(--tk-gold-light)", border: "1px solid rgba(199,154,62,.4)" }}
                >
                  Précédent
                </button>
                <button
                  onClick={() => setReviewIndex((i) => Math.min(wrongIndices.length - 1, i + 1))}
                  disabled={clampedReviewIndex === wrongIndices.length - 1}
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

  return null;
}
