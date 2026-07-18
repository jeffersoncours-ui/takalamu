import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import { EvaluationsClient } from "./evaluations-client";

type LessonRow = {
  lesson_record_id: string | null;
  lesson_records:
    | { session_date: string; custom_title: string | null }[]
    | { session_date: string; custom_title: string | null }
    | null;
};

export default async function EvaluationsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const [vocabRes, formsRes, conjRes] = await Promise.all([
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
    supabase
      .from("verb_conjugations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
  ]);
  const hasConjugations = (conjRes.count ?? 0) > 0;
  if (vocabRes.error) console.error("evaluations vocab query failed:", vocabRes.error.message);
  if (formsRes.error) console.error("evaluations formulations query failed:", formsRes.error.message);
  const { data: vocab } = vocabRes;
  const { data: forms } = formsRes;

  // Contenu total (vocabulaire + formulations) : seuil et taille du quiz.
  const count = (vocab?.length ?? 0) + (forms?.length ?? 0);

  // Options de cours fusionnées : un cours (lesson_record) qui a du vocabulaire
  // ET/OU des formulations apparaît une seule fois, avec le total des deux.
  // groupByLesson est appelé UNE fois sur la liste combinée pour que la
  // numérotation "Cours N" (et le libellé custom_title) reste cohérente.
  const combined = [...(vocab ?? []), ...(forms ?? [])].map((r) => {
    const row = r as LessonRow;
    const record = Array.isArray(row.lesson_records) ? row.lesson_records[0] : row.lesson_records;
    return {
      lessonRecordId: row.lesson_record_id,
      sessionDate: record?.session_date ?? null,
      customTitle: record?.custom_title ?? null,
    };
  });

  const courseOptions = groupByLesson(combined)
    .filter((g) => g.key !== "none")
    .map((g) => ({ id: g.key, label: g.label, count: g.items.length }));

  return <EvaluationsClient count={count} courseOptions={courseOptions} hasConjugations={hasConjugations} />;
}
