"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Gender = Database["public"]["Enums"]["gender_type"];
type ActionState = { error?: string; success?: boolean };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function requestTrial(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const gender = String(formData.get("gender") ?? "") as Gender;
  const message = String(formData.get("message") ?? "").trim() || null;

  if (!firstName) return { error: "Le prénom est requis." };
  if (!lastName) return { error: "Le nom est requis." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };
  if (gender !== "m" && gender !== "f") return { error: "Merci d'indiquer ton genre." };

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("trial_requests").insert({
    first_name: firstName,
    last_name: lastName,
    email,
    gender,
    message,
  });

  if (insertError) {
    return { error: "Une erreur est survenue. Merci de réessayer." };
  }

  // Notifier l'enseignant du bon genre (RPC SECURITY DEFINER, accessible par anon)
  await supabase.rpc("notify_teachers_by_gender", {
    p_gender: gender,
    p_type: "trial_request",
    p_payload: { email, first_name: firstName, url: "/teacher/trials" },
  });

  return { success: true };
}
