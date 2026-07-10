"use server";

import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (newPassword.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Les mots de passe ne correspondent pas." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) return { error: "Échec de la mise à jour du mot de passe." };
  return { success: true };
}
