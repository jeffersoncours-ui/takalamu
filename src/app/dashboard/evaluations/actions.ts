"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";

// ── Quiz individuel auto-généré (vocabulaire OU formulation) ─────────────────
// Contrat client générique : `item_id` masque la clé réelle (vocab_id / form_id)
// des RPC, ce qui permet à un seul composant QuizPlayer de servir les deux.

export type QuizQuestion = {
  item_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  prompt: string;
  choices: string[];
  /** Question de compréhension orale (formulation AR→FR) : URL signée courte
   *  de la voix du prof — le texte arabe n'est jamais transmis au client. */
  audio_url?: string;
};

export type QuizAnswer = {
  item_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  chosen: string;
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
  form_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  prompt?: string;
  audio_path?: string;
  choices: string[];
};

export async function generateVocabQuiz(lessonRecordId?: string): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_individual_quiz", {
    p_student_id: studentId,
    ...(lessonRecordId ? { p_lesson_record_id: lessonRecordId } : {}),
  });

  if (error) throw new Error(error.message);
  return ((data as RawVocabQuestion[]) ?? []).map((q) => ({
    item_id: q.vocab_id,
    direction: q.direction,
    prompt: q.prompt,
    choices: q.choices,
  }));
}

export async function submitVocabQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_individual_quiz", {
    p_student_id: studentId,
    p_answers: answers.map((a) => ({ vocab_id: a.item_id, direction: a.direction, chosen: a.chosen })),
  });

  if (error) throw new Error(error.message);
  return data as QuizResult;
}

export async function generateFormulationQuiz(lessonRecordId?: string): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_formulation_quiz", {
    p_student_id: studentId,
    ...(lessonRecordId ? { p_lesson_record_id: lessonRecordId } : {}),
  });

  if (error) throw new Error(error.message);
  const raw = (data as RawFormQuestion[]) ?? [];

  // URLs signées courtes pour les questions audio (AR→FR). La RLS Storage
  // limite l'élève à son propre dossier — la signature échoue sinon.
  const audioPaths = raw
    .map((q) => q.audio_path)
    .filter((p): p is string => !!p);
  const urlByPath = new Map<string, string>();
  if (audioPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("formulation-audio")
      .createSignedUrls(audioPaths, 3600);
    for (const item of signed ?? []) {
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    }
  }

  const questions: QuizQuestion[] = [];
  for (const q of raw) {
    const audioUrl = q.audio_path ? urlByPath.get(q.audio_path) : undefined;
    // Une question AR→FR est inécoutable sans URL signée (le texte arabe n'est
    // volontairement pas transmis) — on l'écarte plutôt que d'afficher un vide.
    if (q.direction === "ar_to_fr" && !audioUrl) continue;
    questions.push({
      item_id: q.form_id,
      direction: q.direction,
      prompt: q.prompt ?? "",
      choices: q.choices,
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    });
  }
  return questions;
}

export async function submitFormulationQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_formulation_quiz", {
    p_student_id: studentId,
    p_answers: answers.map((a) => ({ form_id: a.item_id, direction: a.direction, chosen: a.chosen })),
  });

  if (error) throw new Error(error.message);
  return data as QuizResult;
}

// ── Grammar quiz (teacher-authored QCM) ──────────────────────────────────────

export type GrammarQuizQuestion = {
  question_id: string;
  prompt: string;
  choices: string[];
};

export type GrammarAnswer = {
  question_id: string;
  chosen: string;
};

export type GrammarAnswerDetail = {
  question_id: string;
  chosen: string;
  correct: string;
  is_correct: boolean;
};

export type GrammarQuizResult = {
  score: number;
  total: number;
  quiz_attempt_id: string;
  answers: GrammarAnswerDetail[];
};

export async function fetchGrammarQuizQuestions(
  quizId: string
): Promise<GrammarQuizQuestion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_grammar_quiz_questions", {
    p_quiz_id: quizId,
  });
  if (error) throw new Error(error.message);
  return (data as GrammarQuizQuestion[]) ?? [];
}

export async function submitGrammarQuiz(
  quizId: string,
  answers: GrammarAnswer[]
): Promise<GrammarQuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_grammar_quiz", {
    p_student_id: studentId,
    p_quiz_id: quizId,
    p_answers: answers,
  });
  if (error) throw new Error(error.message);
  return data as GrammarQuizResult;
}
