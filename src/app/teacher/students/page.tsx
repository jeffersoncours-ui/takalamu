import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StudentsList } from "./students-list";

export default async function StudentsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, status, unjustified_absences_count, gender, profiles(full_name, email)")
    .order("created_at", { ascending: true });

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

      {list.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun élève rattaché pour le moment.</p>
      ) : (
        <StudentsList students={list} />
      )}
    </div>
  );
}
