import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KhatamOrnament } from "@/components/khatam-ornament";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;
  const { profile } = await requireTeacher();
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
      <div>
        <p style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 16, color: "var(--tk-muted-olive)" }}>
          {format(now, "EEEE d MMMM", { locale: fr })}
        </p>
        <p className="mt-0.5 leading-tight" style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 26, color: "var(--tk-ink-text)" }}>
          Bonjour {profile?.full_name ?? ""}
        </p>
      </div>

      {session === "ok" && (
        <div
          className="rounded-[14px] px-4 py-3"
          style={{ background: "rgba(12,107,78,.10)", border: "1px solid rgba(12,107,78,.28)", color: "var(--tk-green-active)", fontSize: 13 }}
        >
          Séance enregistrée.
        </div>
      )}

      <Link
        href="/teacher/homework"
        className="relative flex items-center gap-4 overflow-hidden rounded-[20px] p-5"
        style={{
          background: "linear-gradient(150deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
          border: "1px solid rgba(199,154,62,.3)",
          boxShadow: "0 20px 38px -20px rgba(10,20,15,.6)",
        }}
      >
        <KhatamOrnament
          size={110}
          strokeWidth={0.4}
          className="pointer-events-none absolute -right-3.5 -bottom-3.5"
          style={{ opacity: 0.4 }}
        />
        <div style={{ fontFamily: "var(--font-spectral)", fontSize: 52, fontWeight: 700, color: "var(--tk-gold-light)", lineHeight: 0.9 }}>
          {toArabicIndicDigits(pendingHwCount)}
        </div>
        <div className="relative z-10 flex-1">
          <div style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 20, color: "var(--tk-cream-text)", lineHeight: 1.1 }}>
            Devoirs à corriger
          </div>
          <div className="mt-1" style={{ fontSize: 12, color: "var(--tk-sage)" }}>En attente dans ta file</div>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="relative z-10 shrink-0">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

      {/* Alerte élèves suspendus */}
      {suspended.length > 0 && (
        <Link
          href="/teacher/students"
          className="flex items-center gap-[13px] rounded-[16px] px-4 py-[15px]"
          style={{ background: "rgba(184,120,42,.10)", border: "1px solid rgba(184,120,42,.35)" }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--tk-warning)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          <span className="flex-1 font-medium" style={{ color: "#7A5714", fontSize: 13.5 }}>
            {suspended.length} élève{suspended.length > 1 ? "s" : ""} suspendu{suspended.length > 1 ? "s" : ""}
          </span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-warning)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Link>
      )}

      <Link
        href="/teacher/session/new"
        className="flex items-center justify-center gap-2.5 rounded-[15px] py-[17px] font-bold w-full"
        style={{
          background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
          color: "var(--tk-ink-screen)",
          fontSize: 15.5,
          boxShadow: "var(--tk-shadow-cta)",
        }}
      >
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-screen)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
        Fiche de fin de cours
      </Link>
    </div>
  );
}
