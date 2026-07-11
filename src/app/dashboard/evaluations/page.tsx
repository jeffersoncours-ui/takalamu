import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import QuizRunner from "./quiz-runner";
import FormulationQuizRunner from "./formulation-quiz-runner";
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

  const [{ data: vocab }, { data: forms }, { data: grammarQuizzes }] = await Promise.all([
    supabase
      .from("vocabulary")
      .select("id, created_at, lesson_record_id, lesson_records(session_date, custom_title)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true }),
    supabase
      .from("formulations")
      .select("id, created_at, lesson_record_id, lesson_records(session_date, custom_title)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: true }),
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
  const formCount = forms?.length ?? 0;

  // Cours (séances) ayant du vocabulaire / des formulations, numérotés « Cours 1, 2… »
  const toCourseOptions = (
    rows: {
      lesson_record_id: string | null;
      lesson_records:
        | { session_date: string; custom_title: string | null }[]
        | { session_date: string; custom_title: string | null }
        | null;
    }[],
  ) =>
    groupByLesson(
      rows.map((r) => {
        const record = Array.isArray(r.lesson_records) ? r.lesson_records[0] : r.lesson_records;
        return {
          lessonRecordId: r.lesson_record_id,
          sessionDate: record?.session_date ?? null,
          customTitle: record?.custom_title ?? null,
        };
      }),
    )
      .filter((g) => g.key !== "none")
      .map((g) => ({ id: g.key, label: g.label, count: g.items.length }));

  const courseOptions = toCourseOptions(vocab ?? []);
  const formCourseOptions = toCourseOptions(forms ?? []);

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
      </section>

      {/* ── Formulations ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide px-0.5" style={{ color: "#8B857A" }}>
          Quiz formulation
        </p>
        <FormulationQuizRunner formCount={formCount} courses={formCourseOptions} />
      </section>

      {/* ── Grammaire ──────────────────────────────────────────────────────── */}
      {(grammarQuizzes ?? []).length > 0 && (
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide px-0.5" style={{ color: "#8B857A" }}>
            Exercices de grammaire
          </p>
          <GrammarQuizRunner quizzes={grammarQuizzes ?? []} />
        </section>
      )}
    </div>
  );
}
