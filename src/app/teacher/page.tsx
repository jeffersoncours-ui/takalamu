import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const STATUS_LABEL: Record<"active" | "suspended_absences", string> = {
  active: "Actif",
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

  const now = new Date();

  const [hwResult, suspendedResult] = await Promise.all([
    supabase.from("homework").select("id", { count: "exact", head: true }).eq("status", "rendu"),
    supabase
      .from("students")
      .select("id, status, profiles(full_name)")
      .eq("status", "suspended_absences"),
  ]);

  const pendingHwCount = hwResult.count ?? 0;
  const suspended = suspendedResult.data ?? [];

  return (
    <div className="space-y-4">
      <p className="px-0.5 font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
        {format(now, "EEEE d MMMM", { locale: fr })}
      </p>

      {session === "ok" && (
        <div
          className="rounded-[14px] px-4 py-3"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
        >
          Séance enregistrée.
        </div>
      )}

      <Link
        href="/teacher/homework"
        className="block rounded-[18px] p-4"
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
        <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>Devoirs à corriger</div>
      </Link>

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
              {STATUS_LABEL[suspended[0].status as "active" | "suspended_absences"]}
            </span>
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99A3A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      <Link
        href="/teacher/session/new"
        className="flex items-center justify-center gap-2 rounded-[14px] py-3 font-bold text-white w-full"
        style={{ background: "#0F9D6E", fontSize: 14, boxShadow: "0 8px 18px rgba(15,157,110,.28)" }}
      >
        Fiche de fin de cours
      </Link>
    </div>
  );
}
