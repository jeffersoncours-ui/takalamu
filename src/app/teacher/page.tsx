import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import type { Database } from "@/lib/supabase/database.types";

type StudentStatus = Database["public"]["Enums"]["student_status"];

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Actif",
  suspended_payment: "Paiement en attente",
  suspended_absences: "Trop d'absences",
};

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; prep?: string }>;
}) {
  const { session, prep } = await searchParams;
  await requireTeacher();
  const supabase = await createClient();

  const now = new Date();
  const nowISO = now.toISOString();

  // Bornes UTC
  const startOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const endOfDayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    hwResult,
    suspendedResult,
    todayCountResult,
    pastBookingsResult,
    recentRecordsResult,
    upcomingBookingsResult,
  ] = await Promise.all([
    supabase.from("homework").select("id", { count: "exact", head: true }).eq("status", "rendu"),
    supabase
      .from("students")
      .select("id, status, profiles(full_name)")
      .in("status", ["suspended_payment", "suspended_absences"]),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_at", startOfDayUTC.toISOString())
      .lte("scheduled_at", endOfDayUTC.toISOString())
      .in("status", ["booked", "completed"]),
    // Séances passées des 7 derniers jours
    supabase
      .from("bookings")
      .select("id, scheduled_at, student_id, students(id, profiles(full_name))")
      .lt("scheduled_at", nowISO)
      .gte("scheduled_at", sevenDaysAgo.toISOString())
      .eq("status", "booked")
      .order("scheduled_at", { ascending: false })
      .limit(10),
    // Fiches existantes sur cette période
    supabase
      .from("lesson_records")
      .select("student_id, session_date")
      .gte("session_date", sevenDaysAgo.toISOString().split("T")[0])
      .lte("session_date", nowISO.split("T")[0]),
    // Prochains cours (7 jours)
    supabase
      .from("bookings")
      .select("id, scheduled_at, prep_notes, student_id, students(id, profiles(full_name))")
      .gte("scheduled_at", nowISO)
      .lte("scheduled_at", sevenDaysAhead.toISOString())
      .eq("status", "booked")
      .order("scheduled_at", { ascending: true })
      .limit(5),
  ]);

  const pendingHwCount = hwResult.count ?? 0;
  const suspended = suspendedResult.data ?? [];
  const coursToday = todayCountResult.count ?? 0;

  // Séances passées sans fiche
  const documentedKeys = new Set(
    (recentRecordsResult.data ?? []).map((r) => `${r.student_id}-${r.session_date}`),
  );
  const toDocument = (pastBookingsResult.data ?? []).filter((b) => {
    const dateStr = new Date(b.scheduled_at).toISOString().split("T")[0];
    return !documentedKeys.has(`${b.student_id}-${dateStr}`);
  });

  const upcomingBookings = upcomingBookingsResult.data ?? [];

  return (
    <div className="space-y-4">
      <p className="px-0.5 font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
        {format(now, "EEEE d MMMM", { locale: fr })} · {coursToday} cours aujourd&apos;hui
      </p>

      {session === "ok" && (
        <div
          className="rounded-[14px] px-4 py-3"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
        >
          Séance enregistrée.
        </div>
      )}

      {prep === "ok" && (
        <div
          className="rounded-[14px] px-4 py-3"
          style={{ background: "#EEF4FF", border: "1px solid #C3D5FF", color: "#2B4CA8", fontSize: 13 }}
        >
          Notes de préparation enregistrées.
        </div>
      )}

      {/* Grille stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-[18px] p-4"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
        >
          <span
            className="flex items-center justify-center rounded-[10px] mb-3"
            style={{ width: 36, height: 36, background: "#ECFAF4" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="3" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <div className="leading-none" style={{ fontWeight: 800, fontSize: 30, color: "#1C1A17" }}>{coursToday}</div>
          <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>Cours aujourd&apos;hui</div>
        </div>

        <Link
          href="/teacher/homework"
          className="rounded-[18px] p-4"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
        >
          <span
            className="flex items-center justify-center rounded-[10px] mb-3"
            style={{ width: 36, height: 36, background: "#F6EDFC" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8E4EC6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </span>
          <div className="leading-none" style={{ fontWeight: 800, fontSize: 30, color: "#1C1A17" }}>{pendingHwCount}</div>
          <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>À corriger</div>
        </Link>
      </div>

      {/* Alerte élèves suspendus */}
      {suspended.length > 0 && (
        <Link
          href="/teacher/students"
          className="flex items-center gap-[13px] rounded-[18px] p-[15px]"
          style={{ background: "#FDF4E3", border: "1.4px solid #F4D193" }}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-[11px]"
            style={{ width: 38, height: 38, background: "#F59E0B" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            </svg>
          </span>
          <span className="flex-1">
            <span className="block font-bold" style={{ color: "#9A6206", fontSize: 14 }}>
              {suspended.length} élève{suspended.length > 1 ? "s" : ""} suspendu{suspended.length > 1 ? "s" : ""}
            </span>
            <span className="block" style={{ color: "#B5862E", fontSize: 12 }}>
              {STATUS_LABEL[suspended[0].status]}
            </span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99A3A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      {/* Séances à documenter */}
      {toDocument.length > 0 && (
        <section className="space-y-3">
          <p
            className="px-0.5 font-bold uppercase"
            style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".06em" }}
          >
            À documenter
          </p>
          {toDocument.map((b) => {
            const student = Array.isArray(b.students) ? b.students[0] : b.students;
            const profile = student
              ? Array.isArray((student as { profiles: unknown }).profiles)
                ? ((student as { profiles: { full_name: string | null }[] }).profiles)[0]
                : (student as { profiles: { full_name: string | null } | null }).profiles
              : null;
            return (
              <div
                key={b.id}
                className="flex items-center gap-[14px] rounded-[16px] p-[15px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: "#1C1A17", fontSize: 15 }}>
                    {profile?.full_name ?? "—"}
                  </div>
                  <div className="font-medium" suppressHydrationWarning style={{ color: "#8B857A", fontSize: 12 }}>
                    {format(new Date(b.scheduled_at), "EEE d MMM · HH:mm", { locale: fr })}
                  </div>
                </div>
                <Link
                  href={`/teacher/session/new?student_id=${b.student_id}`}
                  className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 font-semibold transition-opacity hover:opacity-80"
                  style={{ background: "#0F9D6E", color: "#fff", fontSize: 13, whiteSpace: "nowrap" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  Documenter
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {/* Prochains cours */}
      {upcomingBookings.length > 0 && (
        <section className="space-y-3">
          <p
            className="px-0.5 font-bold uppercase"
            style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".06em" }}
          >
            Prochains cours
          </p>
          {upcomingBookings.map((b) => {
            const student = Array.isArray(b.students) ? b.students[0] : b.students;
            const profile = student
              ? Array.isArray((student as { profiles: unknown }).profiles)
                ? ((student as { profiles: { full_name: string | null }[] }).profiles)[0]
                : (student as { profiles: { full_name: string | null } | null }).profiles
              : null;
            const hasPrepNotes = b.prep_notes && b.prep_notes.trim().length > 0;
            return (
              <div
                key={b.id}
                className="flex items-center gap-[14px] rounded-[16px] p-[15px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: "#1C1A17", fontSize: 15 }}>
                    {profile?.full_name ?? "—"}
                  </div>
                  <div className="font-medium" suppressHydrationWarning style={{ color: "#8B857A", fontSize: 12 }}>
                    {format(new Date(b.scheduled_at), "EEE d MMM · HH:mm", { locale: fr })}
                  </div>
                </div>
                <Link
                  href={`/teacher/session/prep/${b.id}`}
                  className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 font-semibold transition-opacity hover:opacity-80"
                  style={{
                    background: hasPrepNotes ? "#F0FAF6" : "#F7F4EE",
                    color: hasPrepNotes ? "#0A553F" : "#1C1A17",
                    border: `1px solid ${hasPrepNotes ? "#C8EBDB" : "#DDD8D0"}`,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                  </svg>
                  {hasPrepNotes ? "Voir prépa" : "Préparer"}
                </Link>
              </div>
            );
          })}
        </section>
      )}

      {toDocument.length === 0 && upcomingBookings.length === 0 && (
        <p style={{ color: "#8B857A", fontSize: 14, paddingTop: 4 }}>
          Aucun cours à documenter ni à venir cette semaine.
        </p>
      )}
    </div>
  );
}
