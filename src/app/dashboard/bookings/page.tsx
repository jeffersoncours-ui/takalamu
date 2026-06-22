import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkBookingEligibility, generateAvailableSlots } from "@/lib/booking";
import { BookingSlots } from "./booking-slots";
import { JoinButton } from "./join-button";

export default async function BookingsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) {
    return <p className="text-sm text-slate-500">Profil élève introuvable.</p>;
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  const [eligibility, availsRes, myBookingsRes, teacherBookingsRes] =
    await Promise.all([
      checkBookingEligibility(studentId, supabase),
      supabase
        .from("teacher_availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("teacher_id", student.teacher_id)
        .order("day_of_week"),
      // Mes réservations à venir
      supabase
        .from("bookings")
        .select("id, scheduled_at, status, zoom_link")
        .eq("student_id", studentId)
        .eq("status", "booked")
        .gte("scheduled_at", now)
        .order("scheduled_at"),
      // Tous les créneaux déjà pris chez cet enseignant (via service role)
      adminClient
        .from("bookings")
        .select("scheduled_at, status")
        .eq("teacher_id", student.teacher_id)
        .eq("status", "booked")
        .gte("scheduled_at", now),
    ]);

  const availabilities = availsRes.data ?? [];
  const upcomingBookings = myBookingsRes.data ?? [];
  const allTeacherBookings = teacherBookingsRes.data ?? [];

  const freeSlots = eligibility.eligible
    ? generateAvailableSlots(availabilities, allTeacherBookings)
    : [];

  const slotData = freeSlots.map((s) => ({
    scheduledAt: s.scheduledAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold text-slate-900">Réservations</h1>

      {/* Cours à venir */}
      {upcomingBookings.length > 0 && (
        <section className="space-y-3">
          <p className="text-sm font-medium text-slate-700">
            Mes cours à venir ({upcomingBookings.length})
          </p>
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <div>
                <p className="font-medium text-slate-900 capitalize">
                  {format(new Date(b.scheduled_at), "EEEE d MMMM", {
                    locale: fr,
                  })}
                </p>
                <p className="text-sm text-slate-500">
                  {format(new Date(b.scheduled_at), "HH:mm", { locale: fr })}{" "}
                  <span className="text-xs text-slate-400">UTC</span>
                </p>
              </div>
              <JoinButton
                scheduledAt={b.scheduled_at}
                zoomLink={b.zoom_link}
              />
            </div>
          ))}
        </section>
      )}

      {/* Réserver un nouveau créneau */}
      <section className="space-y-3">
        <p className="text-sm font-medium text-slate-700">
          Réserver un cours
        </p>

        {!eligibility.eligible ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-800">{eligibility.reason}</p>
          </div>
        ) : (
          <BookingSlots slots={slotData} />
        )}
      </section>
    </div>
  );
}
