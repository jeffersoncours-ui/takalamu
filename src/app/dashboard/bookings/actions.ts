"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { checkBookingEligibility } from "@/lib/booking";

type ActionState = { error?: string; success?: boolean };

export async function createBooking(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  // Re-vérifier l'éligibilité côté serveur (jamais faire confiance au client)
  const eligibility = await checkBookingEligibility(studentId, supabase);
  if (!eligibility.eligible) {
    return { error: eligibility.reason };
  }

  const scheduledAt = String(formData.get("scheduled_at") ?? "").trim();
  if (!scheduledAt) return { error: "Créneau invalide." };

  const slotDate = new Date(scheduledAt);
  if (isNaN(slotDate.getTime())) return { error: "Créneau invalide." };

  // S'assurer que le créneau est bien futur (> 0 min)
  if (slotDate <= new Date()) return { error: "Ce créneau est déjà passé." };

  // Récupérer l'enseignant de l'élève
  const { data: student } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) return { error: "Profil élève introuvable." };

  // Vérifier qu'aucun autre booking ne chevauche ce créneau (± 30 min)
  const slotStart = new Date(slotDate.getTime() - 30 * 60 * 1000);
  const slotEnd = new Date(slotDate.getTime() + 30 * 60 * 1000);

  const { count } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", student.teacher_id)
    .eq("status", "booked")
    .gte("scheduled_at", slotStart.toISOString())
    .lte("scheduled_at", slotEnd.toISOString());

  if ((count ?? 0) > 0) {
    return { error: "Ce créneau vient d'être pris. Choisis-en un autre." };
  }

  const { error } = await supabase.from("bookings").insert({
    student_id: studentId,
    teacher_id: student.teacher_id,
    type: "individual",
    scheduled_at: scheduledAt,
    status: "booked",
  });

  if (error) return { error: "Impossible de créer la réservation." };

  revalidatePath("/dashboard/bookings");
  return { success: true };
}
