import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { BookingActions } from "./booking-actions";

export default async function TeacherBookingsPage() {
  await requireTeacher();
  const supabase = await createClient();

  const now = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("bookings")
    .select("id, scheduled_at, status, zoom_link, type, students(profiles(full_name))")
    .eq("status", "booked")
    .gte("scheduled_at", now)
    .order("scheduled_at", { ascending: true });

  const { data: past } = await supabase
    .from("bookings")
    .select("id, scheduled_at, status, zoom_link, type, students(profiles(full_name))")
    .in("status", ["completed", "cancelled"])
    .order("scheduled_at", { ascending: false })
    .limit(10);

  function studentName(b: NonNullable<typeof upcoming>[number]) {
    const s = Array.isArray(b.students) ? b.students[0] : b.students;
    const p = s ? (Array.isArray(s.profiles) ? s.profiles[0] : s.profiles) : null;
    return p?.full_name ?? "—";
  }

  return (
    <div className="space-y-6">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Réservations
      </h1>

      {/* À venir */}
      <div className="space-y-2">
        <p
          className="px-0.5 font-bold uppercase"
          style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
        >
          À venir ({upcoming?.length ?? 0})
        </p>

        {!upcoming?.length && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune réservation à venir.</p>
        )}

        {upcoming?.map((b) => (
          <div
            key={b.id}
            className="rounded-[18px] p-4 space-y-3"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{studentName(b)}</p>
                <p className="font-medium" style={{ color: "#8B857A", fontSize: 13 }} suppressHydrationWarning>
                  {format(new Date(b.scheduled_at), "EEEE d MMMM · HH:mm", { locale: fr })} (UTC)
                </p>
              </div>
              <StatusBadge hue="green" label="Réservé" />
            </div>
            <BookingActions bookingId={b.id} currentZoomLink={b.zoom_link} />
          </div>
        ))}
      </div>

      {/* Passées */}
      {!!past?.length && (
        <div className="space-y-2">
          <p
            className="px-0.5 font-bold uppercase"
            style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
          >
            Récentes (passées)
          </p>
          {past.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-[14px] px-4 py-3"
              style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
            >
              <span className="font-semibold" style={{ color: "#1C1A17", fontSize: 13 }}>{studentName(b)}</span>
              <span style={{ color: "#8B857A", fontSize: 12 }} suppressHydrationWarning>
                {format(new Date(b.scheduled_at), "d MMM HH:mm", { locale: fr })}
              </span>
              <span
                className="font-semibold"
                style={{ color: b.status === "completed" ? "#0A6B4E" : "#A8A29E", fontSize: 12 }}
              >
                {b.status === "completed" ? "Terminé" : "Annulé"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
