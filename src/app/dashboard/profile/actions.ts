"use server";

import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

export async function updateProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "");
  const address = String(formData.get("address") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const schoolBackground = String(formData.get("school_background") ?? "").trim();

  if (!fullName) {
    return { error: "Le prénom et nom sont requis." };
  }
  if (gender !== "m" && gender !== "f") {
    return { error: "Genre invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("update_own_student_info", {
    p_full_name: fullName,
    p_gender: gender,
    p_address: address || undefined,
    p_birth_date: birthDate || undefined,
    p_school_background: schoolBackground || undefined,
  });

  if (error) return { error: "Échec de l'enregistrement." };
  return { success: true };
}
