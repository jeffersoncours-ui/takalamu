"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type PaymentPlan = Database["public"]["Enums"]["payment_plan"];
type ActionState = { error?: string; success?: boolean };

const VALID_PLANS: PaymentPlan[] = ["1x", "2x", "3x", "12x"];

export async function requestPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { studentId } = await requireStudent();
  const plan = String(formData.get("plan") ?? "") as PaymentPlan;

  if (!VALID_PLANS.includes(plan)) {
    return { error: "Plan invalide." };
  }

  const admin = createAdminClient();

  // Vérifier s'il n'y a pas déjà un paiement pending ou paid actif
  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("product", "individual_sub")
    .in("status", ["pending", "paid"])
    .maybeSingle();

  if (existing?.status === "paid") {
    return { error: "Tu as déjà un abonnement actif." };
  }
  if (existing?.status === "pending") {
    return { error: "Une demande est déjà en attente de confirmation." };
  }

  const { error } = await admin.from("payments").insert({
    student_id: studentId,
    product: "individual_sub",
    plan,
    status: "pending",
  });

  if (error) return { error: "Impossible de créer la demande." };

  revalidatePath("/dashboard/payments");
  return { success: true };
}
