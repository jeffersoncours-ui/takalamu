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
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  await requireTeacher();
  const supabase = await createClient();

  // Bornes du jour (heure serveur)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [hwResult, suspendedResult, todayBookingsResult] = await Promise.all([
    supabase
      .from("homework")
      .select("id", { count: "exact", head: true })
      .eq("status", "rendu"),
    supabase
      .from("students")
      .select("id, status, profiles(full_name)")
      .in("status", ["suspended_payment", "suspended_absences"]),
    supabase
      .from("bookings")
      .select("id, scheduled_at, status, students(profiles(full_name))")
      .gte("scheduled_at", startOfDay.toISOString())
      .lte("scheduled_at", endOfDay.toISOString())
      .order("scheduled_at", { ascending: true }),
  ]);

  const pendingHwCount = hwResult.count ?? 0;
  const suspended = suspendedResult.data ?? [];
  const todayBookings = todayBookingsResult.data ?? [];
  const coursToday = todayBookings.filter((b) => b.status === "booked" || b.status === "completed").length;

  return (
    <div className="space-y-4">
      <p className="px-0.5 font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
        {format(new Date(), "EEEE d MMMM", { locale: fr })} · {coursToday} cours aujourd&apos;hui
      </p>

      {session === "ok" && (
        <div
          className="rounded-[14px] px-4 py-3"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
        >
          Séance enregistrée.
        </div>
      )}

      {/* Action vedette */}
      <Link
        href="/teacher/session/new"
        className="flex items-center gap-[14px] rounded-[20px] p-[18px]"
        style={{ background: "#0F9D6E", boxShadow: "0 14px 28px rgba(15,157,110,.30)" }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-[14px]"
          style={{ width: 48, height: 48, background: "rgba(255,255,255,.20)" }}
        >
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block font-bold text-white" style={{ fontSize: 17 }}>Fiche de fin de cours</span>
          <span className="block" style={{ color: "#CFF0E2", fontSize: 12 }}>Saisir la séance qui vient de finir</span>
        </span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

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

      {/* Cours du jour */}
      <div
        className="pt-2 pb-1 px-0.5"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 600, fontSize: 19, color: "#1C1A17" }}
      >
        Cours du jour
      </div>

      {todayBookings.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun cours programmé aujourd&apos;hui.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {todayBookings.map((b) => {
            const student = Array.isArray(b.students) ? b.students[0] : b.students;
            const profile = student
              ? Array.isArray(student.profiles)
                ? student.profiles[0]
                : student.profiles
              : null;
            const isDone = b.status === "completed";
            return (
              <div
                key={b.id}
                className="flex items-center gap-[14px] rounded-[16px] p-[15px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <div className="shrink-0 text-center" style={{ width: 52 }}>
                  <div style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 17, color: "#1C1A17" }} suppressHydrationWarning>
                    {format(new Date(b.scheduled_at), "HH:mm")}
                  </div>
                  <div style={{ color: "#A8A29E", fontSize: 10 }}>60 min</div>
                </div>
                <div className="shrink-0" style={{ width: 1, height: 36, background: "#EDE7DC" }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate" style={{ color: "#1C1A17", fontSize: 15 }}>
                    {profile?.full_name ?? "—"}
                  </div>
                  <div className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                    Cours individuel
                  </div>
                </div>
                <StatusBadge
                  hue={isDone ? "green" : "blue"}
                  label={isDone ? "Terminé" : "À venir"}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
