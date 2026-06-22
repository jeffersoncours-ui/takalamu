import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { attendanceLabel } from "@/lib/attendance";
import type { Database } from "@/lib/supabase/database.types";

type StudentStatus = Database["public"]["Enums"]["student_status"];

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Actif",
  suspended_payment: "Suspendu — paiement",
  suspended_absences: "Suspendu — absences",
};

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  await requireTeacher();
  const supabase = await createClient();

  const [hwResult, suspendedResult, sessionsResult, pendingPaymentsResult] =
    await Promise.all([
    supabase
      .from("homework")
      .select(
        "id, instructions, assigned_at, students(profiles(full_name))",
      )
      .eq("status", "rendu")
      .order("assigned_at", { ascending: true })
      .limit(5),
    supabase
      .from("students")
      .select("id, status, profiles(full_name)")
      .in("status", ["suspended_payment", "suspended_absences"]),
    supabase
      .from("lesson_records")
      .select(
        "id, session_date, attendance, students(id, profiles(full_name)), lessons(title)",
      )
      .order("session_date", { ascending: false })
      .limit(5),
    supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const pendingHw = hwResult.data ?? [];
  const suspended = suspendedResult.data ?? [];
  const recentSessions = sessionsResult.data ?? [];
  const pendingPaymentsCount = pendingPaymentsResult.count ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">Tableau de bord</h1>
        <p className="text-sm text-slate-500">
          {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {session === "ok" && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Séance enregistrée.
        </p>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/teacher/session/new"
          className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <p className="font-medium text-emerald-900">Fin de cours</p>
          <p className="text-xs text-emerald-700 mt-0.5">Saisir une séance</p>
        </Link>
        <Link
          href="/teacher/students"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <p className="font-medium text-slate-900">Mes élèves</p>
          <p className="text-xs text-slate-500 mt-0.5">Fiches & suivi</p>
        </Link>
        <Link
          href="/teacher/homework"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40 relative"
        >
          <p className="font-medium text-slate-900">Devoirs</p>
          <p className="text-xs text-slate-500 mt-0.5">File de correction</p>
          {pendingHw.length > 0 && (
            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {pendingHw.length}
            </span>
          )}
        </Link>
        <Link
          href="/teacher/program"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <p className="font-medium text-slate-900">Programme</p>
          <p className="text-xs text-slate-500 mt-0.5">Bibliothèque de leçons</p>
        </Link>
        <Link
          href="/teacher/payments"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40 relative"
        >
          <p className="font-medium text-slate-900">Paiements</p>
          <p className="text-xs text-slate-500 mt-0.5">Confirmer les règlements</p>
          {pendingPaymentsCount > 0 && (
            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              {pendingPaymentsCount}
            </span>
          )}
        </Link>
      </div>

      {/* Élèves suspendus */}
      {suspended.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-medium text-amber-900">
            ⚠ {suspended.length} élève{suspended.length > 1 ? "s" : ""} suspendu{suspended.length > 1 ? "s" : ""}
          </p>
          {suspended.map((s) => {
            const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
            return (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm text-amber-800">{profile?.full_name ?? "—"}</span>
                <span className="text-xs text-amber-700">{STATUS_LABEL[s.status]}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Devoirs à corriger */}
      {pendingHw.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">
              Devoirs à corriger ({pendingHw.length})
            </p>
            <Link href="/teacher/homework" className="text-xs text-emerald-700 hover:underline">
              Tout voir →
            </Link>
          </div>
          {pendingHw.map((hw) => {
            const student = Array.isArray(hw.students) ? hw.students[0] : hw.students;
            const profile = student
              ? Array.isArray(student.profiles)
                ? student.profiles[0]
                : student.profiles
              : null;
            return (
              <div
                key={hw.id}
                className="rounded-lg border border-slate-200 bg-white p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name ?? "—"}
                  </p>
                  {hw.instructions && (
                    <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {hw.instructions}
                    </p>
                  )}
                </div>
                <Link
                  href="/teacher/homework"
                  className="shrink-0 text-xs font-medium text-emerald-700 hover:underline"
                >
                  Corriger
                </Link>
              </div>
            );
          })}
        </div>
      )}

      {/* Sessions récentes */}
      {recentSessions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Sessions récentes</p>
          {recentSessions.map((r) => {
            const student = Array.isArray(r.students) ? r.students[0] : r.students;
            const profile = student
              ? Array.isArray(student.profiles)
                ? student.profiles[0]
                : student.profiles
              : null;
            const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
            return (
              <div
                key={r.id}
                className="rounded-lg border border-slate-200 bg-white p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {profile?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lesson?.title ?? "Sans leçon"} ·{" "}
                    {format(new Date(r.session_date), "d MMM", { locale: fr })}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-500">
                  {attendanceLabel(r.attendance)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
