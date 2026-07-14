import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import { EvaluationsClient } from "./evaluations-client";

export default async function EvaluationsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const [vocabRes, formsRes] = await Promise.all([
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
  ]);
  if (vocabRes.error) console.error("evaluations vocab query failed:", vocabRes.error.message);
  if (formsRes.error) console.error("evaluations formulations query failed:", formsRes.error.message);
  const { data: vocab } = vocabRes;
  const { data: forms } = formsRes;

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
    <EvaluationsClient
      vocabCount={vocabCount}
      courseOptions={courseOptions}
      formCount={formCount}
      formCourseOptions={formCourseOptions}
    />
  );
}
