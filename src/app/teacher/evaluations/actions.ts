"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

async function getTeacherId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createGrammarQuiz(formData: FormData): Promise<void> {
  const { userId } = await requireTeacher();
  const title = (formData.get("title") as string)?.trim();
  if (!title) return;

  const teacherId = await getTeacherId(userId);
  if (!teacherId) return;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("quizzes")
    .insert({ scope: "individual", source_type: "grammar", teacher_id: teacherId, title })
    .select("id")
    .single();

  if (error || !data) return;
  redirect(`/teacher/evaluations/${data.id}`);
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function addQuestion(
  quizId: string,
  prevState: { error?: string; ver?: number },
  formData: FormData
): Promise<{ error?: string; ver?: number }> {
  const { userId } = await requireTeacher();
  const prompt  = (formData.get("prompt")  as string)?.trim();
  const correct = (formData.get("correct") as string)?.trim();
  const d1      = (formData.get("d1")      as string)?.trim();
  const d2      = (formData.get("d2")      as string)?.trim();
  const d3      = (formData.get("d3")      as string)?.trim();

  if (!prompt || !correct || !d1 || !d2 || !d3) {
    return { error: "Tous les champs sont requis.", ver: prevState.ver };
  }

  const teacherId = await getTeacherId(userId);
  if (!teacherId) return { error: "Enseignant introuvable.", ver: prevState.ver };

  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("teacher_id")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz || quiz.teacher_id !== teacherId) {
    return { error: "Accès refusé.", ver: prevState.ver };
  }

  const { error } = await supabase.from("quiz_questions").insert({
    quiz_id: quizId,
    prompt,
    correct_answer: correct,
    distractors: [d1, d2, d3],
  });

  if (error) return { error: error.message, ver: prevState.ver };

  revalidatePath(`/teacher/evaluations/${quizId}`);
  return { ver: (prevState.ver ?? 0) + 1 };
}

export async function deleteQuestion(
  quizId: string,
  questionId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await requireTeacher();
  const teacherId = await getTeacherId(userId);
  if (!teacherId) return;

  const supabase = await createClient();

  const { data: q } = await supabase
    .from("quiz_questions")
    .select("quiz_id, quizzes(teacher_id)")
    .eq("id", questionId)
    .maybeSingle();

  const qt = (Array.isArray(q?.quizzes) ? q.quizzes[0] : q?.quizzes) as
    | { teacher_id: string | null }
    | null;
  if (qt?.teacher_id !== teacherId) return;

  await supabase.from("quiz_questions").delete().eq("id", questionId);
  revalidatePath(`/teacher/evaluations/${quizId}`);
}

// ── Delete quiz ───────────────────────────────────────────────────────────────

export async function deleteGrammarQuiz(
  quizId: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await requireTeacher();
  const teacherId = await getTeacherId(userId);
  if (!teacherId) return;

  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("teacher_id")
    .eq("id", quizId)
    .maybeSingle();

  if (!quiz || quiz.teacher_id !== teacherId) return;

  await supabase.from("quizzes").delete().eq("id", quizId);
  redirect("/teacher/evaluations");
}

// ── Notify students ───────────────────────────────────────────────────────────

export async function notifyStudents(
  quizId: string,
  quizTitle: string,
  _formData: FormData
): Promise<void> {
  const { userId } = await requireTeacher();
  const teacherId = await getTeacherId(userId);
  if (!teacherId) return;

  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("profile_id")
    .eq("teacher_id", teacherId)
    .eq("status", "active");

  await Promise.all(
    (students ?? []).map((s) =>
      supabase.rpc("insert_notification", {
        p_user_id: s.profile_id,
        p_type: "eval_due",
        p_payload: { quiz_id: quizId, title: quizTitle },
      })
    )
  );

  revalidatePath(`/teacher/evaluations/${quizId}`);
}
