"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Gender = Database["public"]["Enums"]["gender_type"];
export type ActionState = { error?: string; success?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AvailabilityRule = {
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type SlotData = {
  availability: AvailabilityRule[];
  takenSlots: string[];
  error?: string;
};

/** Récupère les règles de dispo + créneaux pris pour un genre — appelable par anon. */
export async function fetchTrialSlots(gender: Gender): Promise<SlotData> {
  const supabase = await createClient();

  const [availRes, takenRes] = await Promise.all([
    supabase.rpc("get_teacher_availability_by_gender", { p_gender: gender }),
    supabase.rpc("get_trial_taken_slots", { p_gender: gender }),
  ]);

  if (availRes.error) {
    return { availability: [], takenSlots: [], error: "Impossible de charger les créneaux." };
  }

  return {
    availability: (availRes.data ?? []) as AvailabilityRule[],
    takenSlots: ((takenRes.data ?? []) as Array<{ slot_at: string }>).map((r) => r.slot_at),
  };
}

/** Soumet une demande d'essai avec le créneau choisi. */
export async function requestTrial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const gender = String(formData.get("gender") ?? "") as Gender;
  const level = String(formData.get("level") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim() || null;
  const scheduledAtStr = String(formData.get("scheduled_at") ?? "").trim();

  if (!firstName) return { error: "Le prénom est requis." };
  if (!lastName) return { error: "Le nom est requis." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };
  if (gender !== "m" && gender !== "f") return { error: "Merci d'indiquer ton genre." };

  // scheduled_at est optionnel (si aucun créneau dispo, on envoie sans)
  let scheduledAt: string | null = null;
  if (scheduledAtStr) {
    const d = new Date(scheduledAtStr);
    if (isNaN(d.getTime())) return { error: "Créneau invalide." };
    scheduledAt = d.toISOString();
  }

  const supabase = await createClient();

  // Anti-double-booking : re-vérifier via la RPC (le client anon n'a pas de
  // policy SELECT sur trial_requests — un SELECT direct renverrait toujours 0 ligne).
  if (scheduledAt) {
    const { data: taken } = await supabase.rpc("get_trial_taken_slots", {
      p_gender: gender,
    });

    const isTaken = (taken ?? []).some(
      (r) => new Date(r.slot_at).toISOString() === scheduledAt,
    );
    if (isTaken) {
      return { error: "Ce créneau vient d'être réservé. Merci d'en choisir un autre." };
    }
  }

  const { error: insertError } = await supabase.from("trial_requests").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    gender,
    message,
    level,
    scheduled_at: scheduledAt,
  });

  if (insertError) {
    return { error: "Une erreur est survenue. Merci de réessayer." };
  }

  await supabase.rpc("notify_teachers_by_gender", {
    p_gender: gender,
    p_type: "trial_request",
    p_payload: { email, first_name: firstName, url: "/teacher/trials" },
  });

  return { success: true };
}
