import { addWeeks, startOfWeek, setDay } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Génération des créneaux disponibles ─────────────────────────────────────

type AvailSlot = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type ExistingBooking = {
  scheduled_at: string;
  status: string;
};

export type FreeSlot = {
  scheduledAt: Date;
  startTime: string;
  endTime: string;
};

/**
 * Explose les règles récurrentes sur `weeksAhead` semaines et filtre
 * les créneaux déjà réservés. Renvoie au max 20 slots futurs triés par date.
 * Requiert au moins 2 h de préavis.
 */
export function generateAvailableSlots(
  availabilities: AvailSlot[],
  existingBookings: ExistingBooking[],
  weeksAhead = 4,
): FreeSlot[] {
  const now = new Date();
  const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Clé de déduplication : YYYY-M-D-H-MM (UTC)
  function slotKey(d: Date) {
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}-${d.getUTCHours()}-${d.getUTCMinutes()}`;
  }

  const bookedKeys = new Set(
    existingBookings
      .filter((b) => b.status === "booked")
      .map((b) => slotKey(new Date(b.scheduled_at))),
  );

  const slots: FreeSlot[] = [];
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 }); // dimanche = 0

  for (let w = 0; w <= weeksAhead; w++) {
    const weekBase = addWeeks(thisWeekStart, w);
    for (const avail of availabilities) {
      const dayDate = setDay(weekBase, avail.day_of_week, { weekStartsOn: 0 });
      const [hh, mm] = avail.start_time.split(":").map(Number);

      const slotDate = new Date(dayDate);
      slotDate.setUTCHours(hh, mm, 0, 0);

      if (slotDate < minTime) continue;
      if (bookedKeys.has(slotKey(slotDate))) continue;

      slots.push({ scheduledAt: slotDate, startTime: avail.start_time, endTime: avail.end_time });
    }
  }

  return slots
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    .slice(0, 20);
}

// ── Éligibilité à la réservation ────────────────────────────────────────────

type EligibilityResult =
  | { eligible: true }
  | { eligible: false; reason: string };

export async function checkBookingEligibility(
  studentId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
): Promise<EligibilityResult> {
  const { data: student } = await supabase
    .from("students")
    .select("status")
    .eq("id", studentId)
    .maybeSingle();

  if (!student || student.status !== "active") {
    return { eligible: false, reason: "Ton compte est suspendu." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id")
    .eq("student_id", studentId)
    .eq("product", "individual_sub")
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (!payment) {
    return {
      eligible: false,
      reason:
        "Aucun paiement confirmé pour l'abonnement individuel. Contacte ton enseignant.",
    };
  }

  // Quota : max 4 bookings actifs dans le mois UTC courant
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const monthEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("type", "individual")
    .eq("status", "booked")
    .gte("scheduled_at", monthStart.toISOString())
    .lt("scheduled_at", monthEnd.toISOString());

  if ((count ?? 0) >= 4) {
    return {
      eligible: false,
      reason: "Tu as atteint les 4 réservations pour ce mois.",
    };
  }

  return { eligible: true };
}
