import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import QuizRunner from "./quiz-runner";
import { GrammarQuizRunner } from "./grammar-quiz-runner";

export default async function EvaluationsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  // Fetch student's teacher for grammar quiz filtering
  const { data: student } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  const [{ data: vocab }, { data: attempts }, { data: grammarQuizzes }] =
    await Promise.all([
      supabase
        .from("vocabulary")
        .select("id, created_at, lesson_record_id, lesson_records(session_date)")
        .eq("student_id", studentId)
        .order("created_at", { ascending: true }),
      supabase
        .from("quiz_attempts")
        .select("id, score, taken_at, quizzes(scope, source_type, title)")
        .eq("student_id", studentId)
        .order("taken_at", { ascending: false })
        .limit(20),
      student?.teacher_id
        ? supabase
            .from("quizzes")
            .select("id, title")
            .eq("source_type", "grammar")
            .eq("teacher_id", student.teacher_id)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

  const vocabCount = vocab?.length ?? 0;

  // Cours (séances) ayant du vocabulaire, numérotés « Cours 1, 2… »
  const vocabGroups = groupByLesson(
    (vocab ?? []).map((v) => {
      const record = Array.isArray(v.lesson_records) ? v.lesson_records[0] : v.lesson_records;
      return { lessonRecordId: v.lesson_record_id, sessionDate: record?.session_date ?? null };
    }),
  );
  const courseOptions = vocabGroups
    .filter((g) => g.key !== "none")
    .map((g) => ({ id: g.key, label: g.label, count: g.items.length }));

  const vocabHistory = (attempts ?? []).filter((a) => {
    const q = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
    return q?.scope === "individual" && q?.source_type === "glossary";
  });

  const grammarHistory = (attempts ?? []).filter((a) => {
    const q = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
    return q?.source_type === "grammar";
  });

  return (
    <div className="space-y-8">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Évaluations
      </h1>

      {/* ── Vocabulaire ────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide px-0.5" style={{ color: "#8B857A" }}>
          Quiz vocabulaire
        </p>
        <QuizRunner vocabCount={vocabCount} courses={courseOptions} />

        {vocabHistory.length > 0 && (
          <div className="flex flex-col gap-2">
            {vocabHistory.map((a) => {
              const pct    = a.score != null ? Math.round(a.score * 100) : null;
              const isGood = pct != null && pct >= 70;
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/evaluations/${a.id}`}
                  className="flex items-center justify-between rounded-[14px] px-4 py-3 transition-opacity hover:opacity-80"
                  style={{ background: "#fff", border: "1px solid #EFEAE0" }}
                >
                  <span className="flex items-center gap-2 text-sm" style={{ color: "#4A463F" }}>
                    {format(new Date(a.taken_at), "d MMMM yyyy", { locale: fr })}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </span>
                  {pct != null && (
                    <span className="text-sm font-bold" style={{ color: isGood ? "#0F9D6E" : "#B4292E" }}>
                      {pct} %
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Grammaire ──────────────────────────────────────────────────────── */}
      {(grammarQuizzes ?? []).length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide px-0.5" style={{ color: "#8B857A" }}>
            Exercices de grammaire
          </p>
          <GrammarQuizRunner quizzes={grammarQuizzes ?? []} />

          {grammarHistory.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              {grammarHistory.map((a) => {
                const q      = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
                const pct    = a.score != null ? Math.round(a.score * 100) : null;
                const isGood = pct != null && pct >= 70;
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-[14px] px-4 py-3"
                    style={{ background: "#fff", border: "1px solid #EFEAE0" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#4A463F" }}>
                        {q?.title ?? "Exercice"}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "#8B857A" }}>
                        {format(new Date(a.taken_at), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                    {pct != null && (
                      <span className="text-sm font-bold" style={{ color: isGood ? "#0F9D6E" : "#B4292E" }}>
                        {pct} %
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
