import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentsList } from "./students-list";
import { NewStudentForm } from "./new-student-form";

export default async function StudentsPage() {
  const { profile } = await requireTeacher();
  const supabase = await createClient();

  const isAdmin = profile?.role === "admin";

  const [{ data: students }, { data: teacherRows }] = await Promise.all([
    supabase
      .from("students")
      .select("id, status, unjustified_absences_count, gender, profiles(full_name, email)")
      .order("created_at", { ascending: true }),
    supabase.from("teachers").select("id, display_name"),
  ]);

  const teachers = (teacherRows ?? []).map((t) => ({ id: t.id, name: t.display_name ?? "Enseignant" }));

  const list = (students ?? []).map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    return {
      id: s.id,
      status: s.status,
      name: profile?.full_name ?? profile?.email ?? "—",
      absCount: s.unjustified_absences_count,
    };
  });

  return (
    <div className="space-y-5">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Mes élèves
      </h1>

      <NewStudentForm teachers={isAdmin ? teachers : undefined} />

      {list.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun élève rattaché pour le moment.</p>
      ) : (
        <StudentsList students={list} />
      )}
    </div>
  );
}
