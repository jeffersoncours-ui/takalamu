"use server";

import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

export async function requestPasswordReset(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email requis." };

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Toujours renvoyer un succès générique (ne pas révéler si l'email existe).
  return { success: true };
}
