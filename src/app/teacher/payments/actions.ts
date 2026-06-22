"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = { error?: string };

export async function confirmPayment(
  paymentId: string,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const admin = createAdminClient();

  const { error } = await admin
    .from("payments")
    .update({ status: "paid" })
    .eq("id", paymentId)
    .eq("status", "pending");

  if (error) return { error: "Échec de la confirmation." };

  // Mettre à jour le statut de l'élève si suspendu pour paiement
  const { data: payment } = await admin
    .from("payments")
    .select("student_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (payment?.student_id) {
    await admin
      .from("students")
      .update({ status: "active" })
      .eq("id", payment.student_id)
      .eq("status", "suspended_payment");
  }

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
  const admin = createAdminClient();

  const { error } = await admin
    .from("payments")
    .update({ status: "cancelled" })
    .eq("id", paymentId)
    .in("status", ["pending", "paid"]);

  if (error) return { error: "Échec de l'annulation." };

  revalidatePath("/teacher/payments");
  return {};
}
