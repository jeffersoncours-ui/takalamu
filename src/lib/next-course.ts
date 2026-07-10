import type { SupabaseClient } from "@supabase/supabase-js";

export type NextCourseContext = {
  scheduledAt: string;
  zoomLink: string | null;
  lessonTitle: string;
  teacherName: string;
} | null;

/** Prochain cours réservé d'un élève, avec le contexte pédagogique pour l'affichage. */
export async function getNextCourseContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  studentId: string,
): Promise<NextCourseContext> {
  const nowIso = new Date().toISOString();

  const [studentRes, nextBookingRes] = await Promise.all([
    supabase
      .from("students")
      .select("student_progress(lessons:current_lesson_id(title)), teachers:teacher_id(display_name)")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("scheduled_at, zoom_link")
      .eq("student_id", studentId)
      .eq("status", "booked")
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const nextBooking = nextBookingRes.data;
  if (!nextBooking) return null;

  const student = studentRes.data;
  const progress = student
    ? Array.isArray(student.student_progress)
      ? student.student_progress[0]
      : student.student_progress
    : null;
  const currentLesson = progress
    ? Array.isArray(progress.lessons)
      ? progress.lessons[0]
      : progress.lessons
    : null;
  const teacher = student
    ? Array.isArray(student.teachers)
      ? student.teachers[0]
      : student.teachers
    : null;

  return {
    scheduledAt: nextBooking.scheduled_at,
    zoomLink: nextBooking.zoom_link,
    lessonTitle: currentLesson?.title ?? "Cours individuel",
    teacherName: teacher?.display_name ?? "ton enseignant",
  };
}
