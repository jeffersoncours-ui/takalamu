import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { SessionForm } from "../session-form";

export default async function NewSessionPage() {
  await requireTeacher();
  const supabase = await createClient();

  // Élèves de l'enseignant (RLS) + leur leçon courante (pour pré-sélection).
  const { data: studentRows } = await supabase
    .from("students")
    .select(
      "id, status, profiles(full_name), student_progress(current_lesson_id)",
    );

  // Programme commun, ordonné.
  const { data: lessonRows } = await supabase
    .from("lessons")
    .select("id, title, order_index, phase")
    .order("order_index", { ascending: true });

  const students = (studentRows ?? []).map((s) => ({
    id: s.id,
    name: s.profiles?.full_name ?? "Élève",
    status: s.status,
    currentLessonId: s.student_progress?.current_lesson_id ?? null,
  }));

  const lessons = (lessonRows ?? []).map((l) => ({
    id: l.id,
    title: l.title,
  }));

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Fin de cours</h1>
        <p className="text-sm text-slate-600">
          Une seule fiche : présence, leçon, vocabulaire, grammaire, devoir,
          récap et note privée.
        </p>
      </div>

      {students.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Aucun élève rattaché pour l&apos;instant.
        </p>
      ) : (
        <SessionForm students={students} lessons={lessons} />
      )}
    </div>
  );
}
