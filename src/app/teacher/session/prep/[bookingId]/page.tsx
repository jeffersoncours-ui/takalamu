import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { savePrepNotes } from "./actions";

export default async function PrepPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, scheduled_at, prep_notes, student_id, students(id, profiles(full_name), student_progress(current_lesson_id, lessons:current_lesson_id(title)))")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) notFound();

  const student = Array.isArray(booking.students) ? booking.students[0] : booking.students;
  const profile = student
    ? Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
    : null;
  const progress = student
    ? Array.isArray(student.student_progress) ? student.student_progress[0] : student.student_progress
    : null;
  const currentLesson = progress
    ? Array.isArray(progress.lessons) ? progress.lessons[0] : progress.lessons
    : null;

  // Dernière séance documentée de cet élève
  const { data: lastRecord } = await supabase
    .from("lesson_records")
    .select("session_date, public_recap, lessons(title)")
    .eq("student_id", booking.student_id)
    .order("session_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastLesson = lastRecord
    ? Array.isArray(lastRecord.lessons) ? lastRecord.lessons[0] : lastRecord.lessons
    : null;

  const saveAction = savePrepNotes.bind(null, bookingId);

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Préparer le cours
        </h1>
        <p className="font-medium mt-0.5" suppressHydrationWarning style={{ color: "#8B857A", fontSize: 14 }}>
          {profile?.full_name ?? "—"} · {format(new Date(booking.scheduled_at), "EEE d MMMM · HH:mm", { locale: fr })}
        </p>
      </div>

      {/* Contexte élève */}
      <div className="space-y-2">
        <p className="px-0.5 font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".06em" }}>
          Contexte
        </p>

        <div
          className="rounded-[16px] p-4 space-y-3"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <div>
            <p className="font-semibold" style={{ color: "#8B857A", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
              Leçon en cours
            </p>
            <p className="font-bold mt-0.5" style={{ color: "#1C1A17", fontSize: 15 }}>
              {currentLesson?.title ?? "Aucune leçon assignée"}
            </p>
          </div>

          {lastRecord && (
            <div style={{ borderTop: "1px solid #F0EBE1", paddingTop: 12 }}>
              <p className="font-semibold" style={{ color: "#8B857A", fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em" }}>
                Dernière séance ({format(new Date(lastRecord.session_date), "d MMM", { locale: fr })})
              </p>
              {lastLesson && (
                <p className="font-semibold mt-0.5" style={{ color: "#4B4540", fontSize: 13 }}>
                  {lastLesson.title}
                </p>
              )}
              {lastRecord.public_recap && (
                <p className="mt-1" style={{ color: "#6B6560", fontSize: 13, lineHeight: 1.5 }}>
                  {lastRecord.public_recap}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notes de préparation */}
      <form action={saveAction} className="space-y-3">
        <p className="px-0.5 font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".06em" }}>
          Mes notes de préparation
        </p>
        <textarea
          name="prep_notes"
          defaultValue={booking.prep_notes ?? ""}
          rows={7}
          placeholder="Ce que je veux aborder, les points à travailler, les exercices prévus…"
          className="w-full rounded-[16px] px-4 py-3 resize-none focus:outline-none"
          style={{
            background: "#fff",
            border: "1px solid #DDD8D0",
            color: "#1C1A17",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        />
        <button
          type="submit"
          className="w-full rounded-[14px] py-[14px] font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "#0F9D6E", fontSize: 15 }}
        >
          Enregistrer les notes
        </button>
      </form>
    </div>
  );
}
