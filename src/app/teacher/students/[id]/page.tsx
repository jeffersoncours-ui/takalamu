import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, attendanceBadge } from "@/components/status-badge";
import { ProfileNoteForm } from "./profile-note-form";
import { StatusForm } from "./status-form";

const PHASE_LABEL: Record<string, string> = {
  dechiffrage: "Déchiffrage",
  lecture_oral: "Lecture/Oral",
  grammaire: "Grammaire",
};

export default async function StudentCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const { id } = await params;
  const { all } = await searchParams;
  const showAll = all === "true";
  await requireTeacher();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, status, unjustified_absences_count, gender, profiles(full_name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [progressRes, recordsRes, noteRes, hwRes, vocabRes, grammarRes] =
    await Promise.all([
      supabase
        .from("student_progress")
        .select("current_lesson_id, lessons(title, phase)")
        .eq("student_id", id)
        .maybeSingle(),
      supabase
        .from("lesson_records")
        .select("id, session_date, attendance, public_recap, lessons(title)", { count: "exact" })
        .eq("student_id", id)
        .order("session_date", { ascending: false })
        .limit(showAll ? 200 : 8),
      supabase
        .from("student_profile_notes")
        .select("content")
        .eq("student_id", id)
        .maybeSingle(),
      supabase
        .from("homework")
        .select("id, instructions, status, assigned_at")
        .eq("student_id", id)
        .eq("status", "rendu")
        .order("assigned_at", { ascending: true }),
      supabase
        .from("vocabulary")
        .select("id, arabic_word, french_definition, created_at", {
          count: "exact",
        })
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("grammar_rules")
        .select("id, title, content, created_at", { count: "exact" })
        .eq("student_id", id)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const profile = Array.isArray(student.profiles)
    ? student.profiles[0]
    : student.profiles;
  const progress = progressRes.data;
  const currentLesson = progress
    ? Array.isArray(progress.lessons)
      ? progress.lessons[0]
      : progress.lessons
    : null;
  const records = recordsRes.data ?? [];
  const totalRecords = recordsRes.count ?? records.length;
  const noteContent = noteRes.data?.content ?? "";
  const pendingHw = hwRes.data ?? [];
  const recentVocab = vocabRes.data ?? [];
  const vocabCount = vocabRes.count ?? recentVocab.length;
  const recentGrammar = grammarRes.data ?? [];
  const grammarCount = grammarRes.count ?? recentGrammar.length;

  const name = profile?.full_name ?? "—";

  return (
    <div className="space-y-5">
      {/* Retour */}
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Mes élèves
      </Link>

      {/* En-tête */}
      <div className="flex items-center gap-[14px]">
        <span
          className="flex shrink-0 items-center justify-center rounded-[17px] text-white font-bold"
          style={{ width: 58, height: 58, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 23 }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="flex-1 min-w-0">
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "#1C1A17" }}
          >
            {name}
          </h1>
          {profile?.email && (
            <p className="truncate" style={{ color: "#8B857A", fontSize: 13 }}>{profile.email}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/teacher/messages/${id}`}
          className="flex-1 text-center font-semibold rounded-[12px] py-2.5"
          style={{ color: "#1C1A17", fontSize: 13, border: "1.5px solid #E9E3D8", background: "#fff" }}
        >
          Chat
        </Link>
        <StatusForm studentId={id} currentStatus={student.status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "séances", value: totalRecords, accent: false },
          { label: "abs. injust.", value: student.unjustified_absences_count, accent: false },
          { label: "mots", value: vocabCount, accent: false },
          { label: "règles", value: grammarCount, accent: false },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-[16px] p-3 text-center"
            style={{ background: "#fff", border: "1px solid #EFEAE0" }}
          >
            <p style={{ fontWeight: 800, fontSize: 22, color: "#1C1A17", lineHeight: 1 }}>{value}</p>
            <p className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 11 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Note privée épinglée */}
      <ProfileNoteForm studentId={id} initialContent={noteContent} />

      {/* CTA nouvelle fiche */}
      <Link
        href={`/teacher/session/new?student_id=${id}`}
        className="flex items-center gap-3 rounded-[16px] p-[15px]"
        style={{ background: "#0F9D6E", boxShadow: "0 8px 18px rgba(15,157,110,.26)" }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-[12px]"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,.20)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <span className="flex-1 font-bold text-white" style={{ fontSize: 15 }}>
          Nouvelle fiche de fin de cours
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

      {/* Leçon en cours */}
      <div
        className="rounded-[16px] p-4 space-y-1"
        style={{ background: "#fff", border: "1px solid #EFEAE0" }}
      >
        <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
          Leçon en cours
        </p>
        {currentLesson ? (
          <div>
            <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{currentLesson.title}</p>
            {currentLesson.phase && (
              <p style={{ color: "#8B857A", fontSize: 12 }}>
                {PHASE_LABEL[currentLesson.phase] ?? currentLesson.phase}
              </p>
            )}
          </div>
        ) : (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun curseur défini.</p>
        )}
      </div>

      {/* Devoirs en attente */}
      {pendingHw.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-900">
              Devoirs à corriger ({pendingHw.length})
            </p>
            <Link
              href="/teacher/homework"
              className="text-xs text-amber-700 hover:underline"
            >
              Corriger →
            </Link>
          </div>
          {pendingHw.map((hw) => (
            <div key={hw.id} className="text-sm text-amber-800">
              • {hw.instructions ?? "Devoir sans instructions"}{" "}
              <span className="text-xs text-amber-600">
                ({format(new Date(hw.assigned_at), "d MMM", { locale: fr })})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Historique des séances */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}>
            Historique des séances ({totalRecords})
          </p>
          {showAll ? (
            <Link
              href={`/teacher/students/${id}`}
              className="font-semibold"
              style={{ color: "#0F9D6E", fontSize: 12 }}
            >
              Voir moins
            </Link>
          ) : totalRecords > 8 ? (
            <Link
              href={`/teacher/students/${id}?all=true`}
              className="font-semibold"
              style={{ color: "#0F9D6E", fontSize: 12 }}
            >
              Voir tout ({totalRecords})
            </Link>
          ) : null}
        </div>
        {records.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune séance enregistrée.</p>
        )}
        {records.map((r) => {
          const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
          const badge = attendanceBadge(r.attendance);
          return (
            <div
              key={r.id}
              className="rounded-[14px] p-[13px] space-y-1"
              style={{ background: "#fff", border: "1px solid #EFEAE0" }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold" style={{ color: "#1C1A17", fontSize: 14 }}>
                  {lesson?.title ?? "Sans leçon"}
                </p>
                <StatusBadge hue={badge.hue} label={badge.label} />
              </div>
              <p style={{ color: "#A8A29E", fontSize: 11 }}>
                {format(new Date(r.session_date), "d MMMM yyyy", { locale: fr })}
              </p>
              {r.public_recap && (
                <p className="leading-relaxed" style={{ color: "#4A463F", fontSize: 13 }}>
                  {r.public_recap}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Vocabulaire récent */}
      {recentVocab.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Vocabulaire récent (total : {vocabCount})
          </p>
          <div className="space-y-1">
            {recentVocab.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
                <span dir="rtl" lang="ar" className="font-medium text-slate-900">
                  {v.arabic_word}
                </span>
                <span className="text-slate-600">{v.french_definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammaire récente */}
      {recentGrammar.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">
            Règles récentes (total : {grammarCount})
          </p>
          {recentGrammar.map((g) => (
            <div key={g.id} className="text-sm">
              <p className="font-medium text-slate-900">{g.title}</p>
              <p className="text-slate-600 text-xs mt-0.5 line-clamp-2">
                {g.content}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
