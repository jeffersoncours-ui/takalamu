"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { HOURLY_PRICE_CENTS, installmentCents, isAnnualPlanKey, type AnnualPlanKey } from "@/lib/pricing";

type ActionState = { error?: string; success?: boolean };

export async function requestPayment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { studentId } = await requireStudent();
  const plan = String(formData.get("plan") ?? "");

  const isHourly = plan === "hourly";
  if (!isHourly && !isAnnualPlanKey(plan)) {
    return { error: "Plan invalide." };
  }

  const admin = createAdminClient();

  // Abonnement annuel : un seul actif/en attente à la fois.
  // Heure à la carte : achats multiples autorisés (pas de verrou doublon).
  if (!isHourly) {
    const { data: existing } = await admin
      .from("payments")
      .select("id, status")
      .eq("student_id", studentId)
      .eq("product", "individual_sub")
      .in("status", ["pending", "paid"])
      .maybeSingle();

    if (existing?.status === "paid") return { error: "Tu as déjà un abonnement actif." };
    if (existing?.status === "pending") return { error: "Une demande est déjà en attente de confirmation." };
  }

  const amountCents = isHourly ? HOURLY_PRICE_CENTS : installmentCents(plan as AnnualPlanKey);

  const { error } = await admin.from("payments").insert({
    student_id: studentId,
    product: isHourly ? "individual_hour" : "individual_sub",
    plan: isHourly ? "hourly" : plan,
    status: "pending",
    amount_cents: amountCents,
  });

  if (error) return { error: "Impossible de créer la demande." };

  // Notifier le teacher
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
