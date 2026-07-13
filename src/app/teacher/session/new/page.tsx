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

  // Élèves de l'enseignant (RLS).
  const { data: studentRows, error: studentsError } = await supabase
    .from("students")
    .select("id, status, profiles(full_name)");
  if (studentsError) console.error("session/new students query failed:", studentsError.message);

  const students = (studentRows ?? []).map((s) => ({
    id: s.id,
    name: s.profiles?.full_name ?? "Élève",
    status: s.status,
  }));

  // Livres « à cours » (la grammaire est automatique, pas dans le choix).
  const { data: bookRows, error: booksError } = await supabase
    .from("course_books")
    .select("id, title, subtitle, kind, order_index")
    .eq("kind", "courses")
    .order("order_index");
  if (booksError) console.error("session/new books query failed:", booksError.message);
  const books = (bookRows ?? []).map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle }));

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
          Présence, vocabulaire, grammaire, devoir, récap et note privée.
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
        <SessionForm students={students} books={books} defaultStudentId={defaultStudentId} />
      )}
    </div>
  );
}
