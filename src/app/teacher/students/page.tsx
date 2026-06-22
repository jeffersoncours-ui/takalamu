import Link from "next/link";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type StudentStatus = Database["public"]["Enums"]["student_status"];

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Actif",
  suspended_payment: "Suspendu (paiement)",
  suspended_absences: "Suspendu (absences)",
};

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  suspended_payment: "bg-amber-100 text-amber-800",
  suspended_absences: "bg-red-100 text-red-800",
};

export default async function StudentsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: students } = await supabase
    .from("students")
    .select("id, status, unjustified_absences_count, gender, profiles(full_name, email)")
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-900">Mes élèves</h1>

      {!students?.length && (
        <p className="text-sm text-slate-500">Aucun élève rattaché pour le moment.</p>
      )}

      <div className="space-y-3">
        {students?.map((s) => {
          const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          const absCount = s.unjustified_absences_count;
          return (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-slate-900">
                    {profile?.full_name ?? profile?.email ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {absCount} absence{absCount !== 1 ? "s" : ""} injustifiée{absCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[s.status]}`}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/teacher/students/${s.id}`}
                  className="flex-1 text-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:border-emerald-300 hover:text-emerald-700 transition"
                >
                  Fiche élève
                </Link>
                <Link
                  href={`/teacher/session/new?student_id=${s.id}`}
                  className="flex-1 text-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Nouvelle séance
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
