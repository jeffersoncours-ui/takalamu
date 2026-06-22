import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
      <h1 className="text-xl font-semibold text-slate-900">Réservations</h1>

      {/* À venir */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">
          À venir ({upcoming?.length ?? 0})
        </p>

        {!upcoming?.length && (
          <p className="text-sm text-slate-500">Aucune réservation à venir.</p>
        )}

        {upcoming?.map((b) => (
          <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{studentName(b)}</p>
                <p className="text-sm text-slate-600">
                  {format(new Date(b.scheduled_at), "EEEE d MMMM yyyy · HH:mm", { locale: fr })}{" "}
                  <span className="text-xs text-slate-400">UTC</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Réservé
              </span>
            </div>
            <BookingActions bookingId={b.id} currentZoomLink={b.zoom_link} />
          </div>
        ))}
      </div>

      {/* Passées */}
      {!!past?.length && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">Récentes (passées)</p>
          {past.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="text-slate-700">{studentName(b)}</span>
              <span className="text-slate-500">
                {format(new Date(b.scheduled_at), "d MMM HH:mm", { locale: fr })}
              </span>
              <span className={b.status === "completed" ? "text-emerald-600" : "text-slate-400"}>
                {b.status === "completed" ? "Terminé" : "Annulé"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
