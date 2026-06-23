import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

  const now = new Date().toISOString();

  const [eligibility, availsRes, myBookingsRes, teacherSlotsRes] =
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
      // Tous les créneaux déjà pris chez cet enseignant (via RPC sécurisée)
      supabase.rpc("get_teacher_booked_slots", {
        p_teacher_id: student.teacher_id,
        p_from: now,
      }),
    ]);

  const availabilities = availsRes.data ?? [];
  const upcomingBookings = myBookingsRes.data ?? [];
  const allTeacherBookings = teacherSlotsRes.data ?? [];

  const freeSlots = eligibility.eligible
    ? generateAvailableSlots(availabilities, allTeacherBookings)
    : [];

  const slotData = freeSlots.map((s) => ({
    scheduledAt: s.scheduledAt.toISOString(),
  }));

  return (
    <div className="space-y-7">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Réserver
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Choisis un créneau proposé par ton enseignant.
        </p>
      </div>

      {/* Cours à venir */}
      {upcomingBookings.length > 0 && (
        <section className="space-y-3">
          <p
            className="px-0.5 font-bold uppercase"
            style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
          >
            Mes cours à venir
          </p>
          {upcomingBookings.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-[16px] px-4 py-[14px]"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
            >
              <div>
                <p className="font-bold capitalize" style={{ color: "#1C1A17", fontSize: 15 }} suppressHydrationWarning>
                  {format(new Date(b.scheduled_at), "EEEE d MMMM", { locale: fr })}
                </p>
                <p className="font-medium" style={{ color: "#8B857A", fontSize: 12 }} suppressHydrationWarning>
                  {format(new Date(b.scheduled_at), "HH:mm", { locale: fr })} (UTC)
                </p>
              </div>
              <JoinButton scheduledAt={b.scheduled_at} zoomLink={b.zoom_link} />
            </div>
          ))}
        </section>
      )}

      {/* Réserver un nouveau créneau */}
      <section className="space-y-4">
        {!eligibility.eligible ? (
          <div
            className="rounded-[16px] px-4 py-3"
            style={{ background: "#FDF4E3", border: "1px solid #F4D193" }}
          >
            <p style={{ color: "#9A6206", fontSize: 14 }}>{eligibility.reason}</p>
          </div>
        ) : (
          <BookingSlots slots={slotData} />
        )}
      </section>
    </div>
  );
}
