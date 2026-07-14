"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";

// ── Quiz de langue auto-généré (vocabulaire + formulation fusionnés) ─────────
// Génération : on appelle les deux RPC éprouvées (generate_individual_quiz,
// generate_formulation_quiz) — distracteurs par type, jamais mélangés — puis on
// concatène et on mélange les questions côté serveur. Chaque question porte sa
// `source` pour que la correction sache l'aiguiller. Correction : une seule RPC
// (submit_language_quiz) → un seul score, une seule tentative.

export type QuizDirection = "fr_to_ar" | "ar_to_fr" | "fr_to_ar_audio";
export type QuizSource = "vocab" | "formulation";

export type QuizQuestion = {
  source: QuizSource;
  item_id: string;
  direction: QuizDirection;
  prompt: string;
  choices: string[];
  /** Question de compréhension orale (formulation AR→FR) : URL signée courte
   *  de la voix du prof — le texte arabe n'est jamais transmis au client. */
  audio_url?: string;
  /** Mode « FR → écoute des 4 audios » (formulation) : question en texte français,
   *  réponses en audio arabe. `token` = id opaque de la formulation choisie. */
  audio_choices?: { token: string; audio_url: string }[];
};

export type QuizAnswer = {
  source: QuizSource;
  item_id: string;
  direction: QuizDirection;
  chosen: string;
  /** Renvoyé uniquement pour `fr_to_ar_audio` : le prompt français round-trip,
   *  le serveur score par correspondance FR (pas d'id-source échangé). */
  prompt?: string;
};

export type AnswerDetail = {
  direction: string;
  chosen: string;
  correct: string;
  is_correct: boolean;
};

export type QuizResult = {
  score: number;
  total: number;
  quiz_attempt_id: string;
  answers: AnswerDetail[];
};

type RawVocabQuestion = { vocab_id: string; direction: "fr_to_ar" | "ar_to_fr"; prompt: string; choices: string[] };
type RawFormQuestion = {
  form_id?: string;
  direction: QuizDirection;
  prompt?: string;
  audio_path?: string;
  choices?: string[];
  audio_choices?: { id: string; audio_path: string }[];
};

/** Mélange Fisher-Yates (copie) — quiz mixte dans un ordre imprévisible. */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function generateLanguageQuiz(lessonRecordId?: string): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const [vocabRes, formRes] = await Promise.all([
    supabase.rpc("generate_individual_quiz", {
      p_student_id: studentId,
      ...(lessonRecordId ? { p_lesson_record_id: lessonRecordId } : {}),
    }),
    supabase.rpc("generate_formulation_quiz", {
      p_student_id: studentId,
      // Opt-in explicite au mode audio-choix (base partagée preview/prod).
      p_allow_audio_choices: true,
      ...(lessonRecordId ? { p_lesson_record_id: lessonRecordId } : {}),
    }),
  ]);

  if (vocabRes.error) throw new Error(vocabRes.error.message);
  if (formRes.error) throw new Error(formRes.error.message);

  // ── Vocabulaire (texte pur, aucun audio) ──────────────────────────────────
  const vocabQuestions: QuizQuestion[] = ((vocabRes.data as RawVocabQuestion[]) ?? []).map((q) => ({
    source: "vocab" as const,
    item_id: q.vocab_id,
    direction: q.direction,
    prompt: q.prompt,
    choices: q.choices,
  }));

  // ── Formulation : URLs signées courtes pour tous les audios ───────────────
  const rawForms = (formRes.data as RawFormQuestion[]) ?? [];
  const audioPaths = new Set<string>();
  for (const q of rawForms) {
    if (q.audio_path) audioPaths.add(q.audio_path);
    for (const c of q.audio_choices ?? []) audioPaths.add(c.audio_path);
  }
  const urlByPath = new Map<string, string>();
  if (audioPaths.size > 0) {
    const { data: signed } = await supabase.storage
      .from("formulation-audio")
      .createSignedUrls([...audioPaths], 3600);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    }
  }

  const formQuestions: QuizQuestion[] = [];
  for (const q of rawForms) {
    if (q.direction === "fr_to_ar_audio") {
      const choices = (q.audio_choices ?? []).map((c) => ({
        token: c.id,
        audio_url: urlByPath.get(c.audio_path),
      }));
      if (choices.length < 4 || choices.some((c) => !c.audio_url)) continue;
      formQuestions.push({
        source: "formulation",
        item_id: "", // scoring via prompt round-trip
        direction: "fr_to_ar_audio",
        prompt: q.prompt ?? "",
        choices: [],
        audio_choices: choices as { token: string; audio_url: string }[],
      });
      continue;
    }

    const audioUrl = q.audio_path ? urlByPath.get(q.audio_path) : undefined;
    if (q.direction === "ar_to_fr" && !audioUrl) continue;
    formQuestions.push({
      source: "formulation",
      item_id: q.form_id ?? "",
      direction: q.direction,
      prompt: q.prompt ?? "",
      choices: q.choices ?? [],
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    });
  }

  return shuffle([...vocabQuestions, ...formQuestions]);
}

export async function submitLanguageQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const payload = answers.map((a) => {
    if (a.source === "vocab") {
      return { vocab_id: a.item_id, direction: a.direction, chosen: a.chosen };
    }
    if (a.direction === "fr_to_ar_audio") {
      return { direction: a.direction, chosen: a.chosen, prompt: a.prompt ?? "" };
    }
    return { form_id: a.item_id, direction: a.direction, chosen: a.chosen };
  });

  const { data, error } = await supabase.rpc("submit_language_quiz", {
    p_student_id: studentId,
    p_answers: payload,
  });

  if (error) throw new Error(error.message);
  return data as QuizResult;
}
