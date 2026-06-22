import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { attendanceLabel } from "@/lib/attendance";
import type { Database } from "@/lib/supabase/database.types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

const ATTENDANCE_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent_justified: "bg-slate-100 text-slate-600",
  absent_unjustified: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
};

export default async function CoursPage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: records } = await supabase
    .from("lesson_records")
    .select("id, session_date, attendance, public_recap, lessons(title, phase)")
    .order("session_date", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">Mes cours</h1>

      {!records?.length && (
        <p className="text-sm text-slate-500">Aucun cours enregistré pour le moment.</p>
      )}

      {records?.map((r) => {
        const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
        return (
          <div
            key={r.id}
            className="rounded-xl border border-slate-200 bg-white p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {lesson?.title ?? "Cours sans leçon"}
                </p>
                <p className="text-xs text-slate-500">
                  {format(new Date(r.session_date), "d MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ATTENDANCE_COLOR[r.attendance]}`}
              >
                {attendanceLabel(r.attendance)}
              </span>
            </div>

            {r.public_recap && (
              <p className="text-sm text-slate-700 leading-relaxed">{r.public_recap}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
