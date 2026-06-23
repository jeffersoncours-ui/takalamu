import Link from "next/link";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteQuestion, deleteGrammarQuiz, notifyStudents } from "../actions";
import { QuestionForm } from "./question-form";

export default async function GrammarQuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const { userId } = await requireTeacher();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, teacher_id")
    .eq("id", quizId)
    .eq("source_type", "grammar")
    .maybeSingle();

  if (!quiz || quiz.teacher_id !== teacher?.id) {
    return (
      <div className="px-0.5 py-8 text-center" style={{ color: "#8B857A" }}>
        Quiz introuvable.
      </div>
    );
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("id, prompt, correct_answer, distractors")
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: true });

  const items = questions ?? [];
  const deleteQuestionAction = deleteQuestion.bind(null, quizId);
  const notifyAction = notifyStudents.bind(null, quizId, quiz.title ?? "Évaluation");
  const deleteQuizAction = deleteGrammarQuiz.bind(null, quizId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 px-0.5">
        <Link
          href="/teacher/evaluations"
          className="flex items-center justify-center rounded-[10px] transition-opacity hover:opacity-70"
          style={{ width: 36, height: 36, background: "#F7F4EE", border: "1px solid #EFEAE0" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1
            className="leading-tight truncate"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "#1C1A17" }}
          >
            {quiz.title}
          </h1>
          <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
            {items.length} question{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <form action={notifyAction} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-[12px] py-2.5 font-semibold text-sm transition-opacity hover:opacity-85"
            style={{ background: "#EAEFFD", color: "#2C4BB8", border: "1px solid #C5D2F7" }}
          >
            Notifier mes élèves
          </button>
        </form>
        <form action={deleteQuizAction}>
          <button
            type="submit"
            className="rounded-[12px] px-4 py-2.5 font-semibold text-sm transition-opacity hover:opacity-85"
            style={{ background: "#FDECEC", color: "#B4292E", border: "1px solid #F3B0B2" }}
          >
            Supprimer
          </button>
        </form>
      </div>

      {/* Questions list */}
      {items.length === 0 ? (
        <div
          className="rounded-[18px] p-5 text-center"
          style={{ background: "#FBF9F5", border: "1px dashed #D8D2C6" }}
        >
          <p style={{ color: "#8B857A", fontSize: 14 }}>
            Aucune question pour l&apos;instant. Ajoutes-en une ci-dessous.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-[18px] p-4 space-y-2.5"
              style={{ background: "#fff", border: "1px solid #EFEAE0" }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 flex items-center justify-center rounded-[10px] font-bold text-xs"
                  style={{ width: 28, height: 28, background: "#F7F4EE", color: "#8B857A" }}
                >
                  {idx + 1}
                </span>
                <p className="flex-1 font-medium text-sm leading-snug" style={{ color: "#1C1A17" }}>
                  {q.prompt}
                </p>
                <form action={deleteQuestionAction.bind(null, q.id)}>
                  <button
                    type="submit"
                    className="shrink-0 flex items-center justify-center rounded-[8px] transition-opacity hover:opacity-70"
                    style={{ width: 28, height: 28, background: "#FDECEC", border: "1px solid #F3B0B2" }}
                    aria-label="Supprimer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4292E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </form>
              </div>

              <div
                className="rounded-[12px] px-3 py-2.5 space-y-1.5"
                style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#0A6B4E", letterSpacing: ".05em" }}>
                  Bonne réponse
                </p>
                <p className="text-sm font-medium" style={{ color: "#0A553F" }}>
                  {q.correct_answer}
                </p>
              </div>

              {Array.isArray(q.distractors) && q.distractors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {q.distractors.map((d, i) => (
                    <span
                      key={i}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      style={{ background: "#F4F1EB", color: "#8B857A", border: "1px solid #EFEAE0" }}
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add question form */}
      <QuestionForm quizId={quizId} />
    </div>
  );
}
