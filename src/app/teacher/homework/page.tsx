import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HwCorrectionForm } from "./hw-correction-form";

export default async function HomeworkQueuePage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select(
      "id, instructions, assigned_at, students(id, profiles(full_name)), lesson_records(session_date, lessons(title))",
    )
    .eq("status", "rendu")
    .order("assigned_at", { ascending: true });

  const items = homework ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">
        File de correction
      </h1>

      {items.length === 0 && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Aucun devoir en attente de correction. 🎉
        </p>
      )}

      {items.map((hw) => {
        const student = Array.isArray(hw.students) ? hw.students[0] : hw.students;
        const profile = student
          ? Array.isArray(student.profiles)
            ? student.profiles[0]
            : student.profiles
          : null;
        const record = Array.isArray(hw.lesson_records)
          ? hw.lesson_records[0]
          : hw.lesson_records;
        const lesson = record
          ? Array.isArray(record.lessons)
            ? record.lessons[0]
            : record.lessons
          : null;

        return (
          <div
            key={hw.id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">
                  {profile?.full_name ?? "—"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lesson?.title ?? "Sans leçon"} ·{" "}
                  {format(new Date(hw.assigned_at), "d MMM yyyy", {
                    locale: fr,
                  })}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Rendu
              </span>
            </div>

            {hw.instructions && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Consignes données
                </p>
                <p className="text-sm text-slate-700">{hw.instructions}</p>
              </div>
            )}

            <HwCorrectionForm homeworkId={hw.id} />
          </div>
        );
      })}
    </div>
  );
}
