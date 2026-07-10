"use server";

import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/auth";

export type QuizQuestion = {
  vocab_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  prompt: string;
  choices: string[];
};

export type QuizAnswer = {
  vocab_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  chosen: string;
};

export type AnswerDetail = {
  vocab_id: string;
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

export async function generateQuiz(
  lessonRecordId?: string,
  size = 10
): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_individual_quiz", {
    p_student_id: studentId,
    ...(lessonRecordId ? { p_lesson_record_id: lessonRecordId } : {}),
    p_size: size,
  });

  if (error) throw new Error(error.message);
  return (data as QuizQuestion[]) ?? [];
}

export async function submitQuiz(answers: QuizAnswer[]): Promise<QuizResult> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_individual_quiz", {
    p_student_id: studentId,
    p_answers: answers,
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
