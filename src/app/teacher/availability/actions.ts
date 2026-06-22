"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };

const DAYS = [0, 1, 2, 3, 4, 5, 6];

export async function createSlot(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time_utc") ?? "").trim();
  const endTime = String(formData.get("end_time_utc") ?? "").trim();

  if (!DAYS.includes(dayOfWeek)) return { error: "Jour invalide." };
  if (!startTime || !endTime) return { error: "Heures requises." };
  if (startTime >= endTime) return { error: "L'heure de fin doit être après le début." };

  const supabase = await createClient();

  // teacher_id dérivé par la RLS (ta_write_owner)
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .maybeSingle();

  if (!teacher) return { error: "Enseignant introuvable." };

  const { error } = await supabase.from("teacher_availability").insert({
    teacher_id: teacher.id,
    day_of_week: dayOfWeek,
    start_time: startTime,
    end_time: endTime,
  });

  if (error) return { error: "Échec de l'ajout du créneau." };

  revalidatePath("/teacher/availability");
  return {};
}

export async function deleteSlot(
  slotId: string,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase
    .from("teacher_availability")
    .delete()
    .eq("id", slotId);

  if (error) return { error: "Échec de la suppression." };

  revalidatePath("/teacher/availability");
  return {};
}
