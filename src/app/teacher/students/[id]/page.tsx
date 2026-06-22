import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { attendanceLabel } from "@/lib/attendance";
import type { Database } from "@/lib/supabase/database.types";
import { ProfileNoteForm } from "./profile-note-form";
import { StatusForm } from "./status-form";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];
type HomeworkStatus = Database["public"]["Enums"]["homework_status"];

const ATTENDANCE_COLOR: Record<AttendanceStatus, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent_justified: "bg-slate-100 text-slate-600",
  absent_unjustified: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
};

const HW_STATUS_LABEL: Record<HomeworkStatus, string> = {
  a_rendre: "À rendre",
  rendu: "Rendu",
  corrige: "Corrigé",
  vu: "Vu",
};

const PHASE_LABEL: Record<string, string> = {
  dechiffrage: "Déchiffrage",
  lecture_oral: "Lecture/Oral",
  grammaire: "Grammaire",
};

export default async function StudentCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
        .select("id, session_date, attendance, public_recap, lessons(title)")
        .eq("student_id", id)
        .order("session_date", { ascending: false })
        .limit(8),
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
  const noteContent = noteRes.data?.content ?? "";
  const pendingHw = hwRes.data ?? [];
  const recentVocab = vocabRes.data ?? [];
  const vocabCount = vocabRes.count ?? recentVocab.length;
  const recentGrammar = grammarRes.data ?? [];
  const grammarCount = grammarRes.count ?? recentGrammar.length;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link
          href="/teacher/students"
          className="text-xs text-slate-500 hover:text-slate-700"
        >
          ← Mes élèves
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              {profile?.full_name ?? "—"}
            </h1>
            {profile?.email && (
              <p className="text-sm text-slate-500">{profile.email}</p>
            )}
          </div>
          <StatusForm studentId={id} currentStatus={student.status} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "séances", value: records.length },
          { label: "abs. injust.", value: student.unjustified_absences_count },
          { label: "mots", value: vocabCount },
          { label: "règles", value: grammarCount },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-3 text-center"
          >
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Note privée épinglée */}
      <ProfileNoteForm studentId={id} initialContent={noteContent} />

      {/* Leçon en cours */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-sm font-medium text-slate-700">Leçon en cours</p>
        {currentLesson ? (
          <div>
            <p className="font-medium text-slate-900">{currentLesson.title}</p>
            {currentLesson.phase && (
              <p className="text-xs text-slate-500 mt-0.5">
                {PHASE_LABEL[currentLesson.phase] ?? currentLesson.phase}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aucun curseur défini.</p>
        )}
        <Link
          href={`/teacher/session/new?student_id=${id}`}
          className="inline-block rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition"
        >
          Nouvelle séance →
        </Link>
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
        <p className="text-sm font-medium text-slate-700">
          Historique des séances ({records.length})
        </p>
        {records.length === 0 && (
          <p className="text-sm text-slate-500">Aucune séance enregistrée.</p>
        )}
        {records.map((r) => {
          const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
          return (
            <div
              key={r.id}
              className="rounded-lg border border-slate-200 bg-white p-3 space-y-1"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-900">
                  {lesson?.title ?? "Sans leçon"}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ATTENDANCE_COLOR[r.attendance]}`}
                >
                  {attendanceLabel(r.attendance)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {format(new Date(r.session_date), "d MMMM yyyy", { locale: fr })}
              </p>
              {r.public_recap && (
                <p className="text-sm text-slate-600 leading-relaxed">
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
