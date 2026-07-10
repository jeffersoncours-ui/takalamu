"use server";

import { createClient } from "@/lib/supabase/server";
import { requireTeacher } from "@/lib/auth";

type ActionState = { error?: string; success?: boolean };

export async function updateTeacherName(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await requireTeacher();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!fullName) return { error: "Le nom est requis." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", userId);

  if (error) return { error: "Échec de l'enregistrement." };
  return { success: true };
}
