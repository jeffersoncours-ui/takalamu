"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type ActionState = { error?: string; success?: boolean };

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: "Échec de la mise à jour." };

  revalidatePath("/teacher/bookings");
  revalidatePath("/teacher");
  return {};
}

/** Crée une séance pour un élève de l'enseignant courant — aucun verrou paiement (arrangement direct). */
export async function createBookingByTeacher(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("student_id") ?? "").trim();
  const scheduledAt = String(formData.get("scheduled_at_iso") ?? "").trim();
  const zoomLink = String(formData.get("zoom_link") ?? "").trim() || null;

  if (!studentId) return { error: "Sélectionne un élève." };
  if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
    return { error: "Date et heure invalides." };
  }

  // La policy students_select_teacher filtre déjà ce SELECT aux élèves de l'enseignant courant.
  const { data: student } = await supabase
    .from("students")
    .select("id, teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) return { error: "Élève introuvable." };

  const { error } = await supabase.from("bookings").insert({
    student_id: studentId,
    teacher_id: student.teacher_id,
    type: "individual",
    scheduled_at: scheduledAt,
    status: "booked",
    zoom_link: zoomLink,
  });

  if (error) return { error: "Échec de la création de la séance." };

  revalidatePath("/teacher/bookings");
  revalidatePath("/teacher");
  return { success: true };
}

export async function updateZoomLink(
  bookingId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const zoomLink = String(formData.get("zoom_link") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ zoom_link: zoomLink })
    .eq("id", bookingId);

  if (error) return { error: "Échec de la mise à jour du lien." };

  revalidatePath("/teacher/bookings");
  return {};
}
