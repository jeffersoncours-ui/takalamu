import Link from "next/link";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherEvaluationsPage() {
  const { userId } = await requireTeacher();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  const { data: quizzes, error: quizzesError } = teacher
    ? await supabase
        .from("quizzes")
        .select("id, title, created_at, quiz_questions(id)")
        .eq("source_type", "grammar")
        .eq("teacher_id", teacher.id)
        .order("created_at", { ascending: false })
    : { data: [], error: null };

  if (quizzesError) console.error("teacher/evaluations query failed:", quizzesError.message);
  const items = quizzes ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between px-0.5">
        <div>
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
          >
            Évaluations
          </h1>
          <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
            Quiz de grammaire rédigés à la main
          </p>
        </div>
        <Link
          href="/teacher/evaluations/new"
          className="shrink-0 rounded-[12px] px-4 py-2.5 font-semibold text-sm text-white transition-opacity hover:opacity-85"
          style={{ background: "#0A553F" }}
        >
          + Nouveau quiz
        </Link>
      </div>

      {items.length === 0 && (
        <div
          className="rounded-[18px] p-6 text-center"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="font-semibold mb-1" style={{ color: "#1C1A17", fontSize: 15 }}>
            Aucun quiz pour l&apos;instant
          </p>
          <p style={{ color: "#8B857A", fontSize: 14 }}>
            Crée un premier quiz de grammaire à soumettre à tes élèves.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((quiz) => {
          const count = Array.isArray(quiz.quiz_questions) ? quiz.quiz_questions.length : 0;
          return (
            <div
              key={quiz.id}
              className="rounded-[18px] px-4 py-3.5 flex items-center gap-3"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 15 }}>
                  {quiz.title ?? "Sans titre"}
                </p>
                <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
                  {count} question{count !== 1 ? "s" : ""}
                </p>
              </div>
              <Link
                href={`/teacher/evaluations/${quiz.id}`}
                className="shrink-0 rounded-[10px] px-3.5 py-2 font-semibold text-xs transition-opacity hover:opacity-80"
                style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #EFEAE0" }}
              >
                Gérer
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
