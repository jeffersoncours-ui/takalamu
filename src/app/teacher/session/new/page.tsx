import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

import { SessionForm } from "../session-form";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>;
}) {
  const { student_id: defaultStudentId } = await searchParams;
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
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Fiche de fin de cours
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Présence, leçon, vocabulaire, grammaire, devoir, récap et note privée.
        </p>
      </div>

      {students.length === 0 ? (
        <p
          className="rounded-[16px] p-4"
          style={{ background: "#FDF4E3", border: "1px solid #F4D193", color: "#9A6206", fontSize: 14 }}
        >
          Aucun élève rattaché pour l&apos;instant.
        </p>
      ) : (
        <SessionForm students={students} lessons={lessons} defaultStudentId={defaultStudentId} />
      )}
    </div>
  );
}
