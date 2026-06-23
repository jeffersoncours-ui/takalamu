"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };

export async function confirmPayment(
  paymentId: string,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase.rpc("confirm_payment", { p_payment_id: paymentId });

  if (error) return { error: "Échec de la confirmation." };

  revalidatePath("/teacher/payments");
  revalidatePath("/teacher");
  return {};
}

export async function cancelPayment(
  paymentId: string,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_payment", { p_payment_id: paymentId });

  if (error) return { error: "Échec de l'annulation." };

  revalidatePath("/teacher/payments");
  return {};
}
