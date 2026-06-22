"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type StudentStatus = Database["public"]["Enums"]["student_status"];
type ActionState = { error?: string };

const VALID_STATUSES: StudentStatus[] = [
  "active",
  "suspended_payment",
  "suspended_absences",
];

export async function updateStudentStatus(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const status = String(formData.get("status") ?? "").trim() as StudentStatus;
  if (!VALID_STATUSES.includes(status)) return { error: "Statut invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", studentId);

  if (error) return { error: "Échec de la mise à jour du statut." };

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
  return {};
}

export async function upsertProfileNote(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await requireTeacher();

  const content = String(formData.get("content") ?? "").trim();

  const supabase = await createClient();

  // Récupère l'id du teacher courant pour l'insert.
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!teacher) return { error: "Enseignant introuvable." };

  const { error } = await supabase.from("student_profile_notes").upsert(
    { student_id: studentId, teacher_id: teacher.id, content },
    { onConflict: "student_id,teacher_id" },
  );

  if (error) return { error: "Échec de la sauvegarde de la note." };

  revalidatePath(`/teacher/students/${studentId}`);
  return {};
}
