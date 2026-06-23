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

  // Récupérer le student profile_id avant la confirmation pour la notification
  const { data: payment } = await supabase
    .from("payments")
    .select("student_id, students(profile_id)")
    .eq("id", paymentId)
    .maybeSingle();

  const { error } = await supabase.rpc("confirm_payment", { p_payment_id: paymentId });
  if (error) return { error: "Échec de la confirmation." };

  // Notifier l'élève que son paiement est confirmé
  const student = Array.isArray(payment?.students) ? payment?.students[0] : payment?.students;
  if (student?.profile_id) {
    await supabase.rpc("insert_notification", {
      p_user_id: student.profile_id,
      p_type: "payment_confirmed",
      p_payload: { url: "/dashboard/payments" },
    });
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
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_payment", { p_payment_id: paymentId });
  if (error) return { error: "Échec de l'annulation." };

  revalidatePath("/teacher/payments");
  return {};
}
