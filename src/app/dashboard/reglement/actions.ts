"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };

export async function acceptHouseRules(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  await requireStudent();
  const supabase = await createClient();

  const { error } = await supabase.rpc("accept_house_rules");
  if (error) return { error: "Échec de la validation. Réessaie." };

  revalidatePath("/dashboard/reglement");
  return {};
}
