"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

  // Vérifier doublon
  const { data: existing } = await admin
    .from("payments")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("product", "individual_sub")
    .in("status", ["pending", "paid"])
    .maybeSingle();

  if (existing?.status === "paid") return { error: "Tu as déjà un abonnement actif." };
  if (existing?.status === "pending") return { error: "Une demande est déjà en attente de confirmation." };

  const { error } = await admin.from("payments").insert({
    student_id: studentId,
    product: "individual_sub",
    plan,
    status: "pending",
  });

  if (error) return { error: "Impossible de créer la demande." };

  // Notifier le teacher via RPC SECURITY DEFINER (client standard, session élève)
  const supabase = await createClient();
  const { data: studentRow } = await supabase
    .from("students")
    .select("teacher_id, teachers(profile_id)")
    .eq("id", studentId)
    .maybeSingle();

  const teacher = Array.isArray(studentRow?.teachers) ? studentRow?.teachers[0] : studentRow?.teachers;
  if (teacher?.profile_id) {
    await supabase.rpc("insert_notification", {
      p_user_id: teacher.profile_id,
      p_type: "payment_requested",
      p_payload: { url: "/teacher/payments" },
    });
  }

  revalidatePath("/dashboard/payments");
  return { success: true };
}
