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
  lessonId?: string,
  size = 10
): Promise<QuizQuestion[]> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("generate_individual_quiz", {
    p_student_id: studentId,
    ...(lessonId ? { p_lesson_id: lessonId } : {}),
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
