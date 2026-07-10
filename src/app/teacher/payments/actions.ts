"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paypalMeUrl } from "@/lib/paypal";
import { sendPaymentLink } from "@/lib/resend";

type ActionState = { error?: string; success?: boolean };

/**
 * Envoie une demande de paiement libre (montant + libellé au choix de l'enseignant).
 * Plus de formule/abonnement : chaque demande est ad-hoc, arrangée directement
 * avec l'élève (à la séance, au mois, peu importe).
 */
export async function sendPaymentRequest(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const studentId = String(formData.get("student_id") ?? "").trim();
  const amountRaw = String(formData.get("amount_euros") ?? "").trim().replace(",", ".");
  const label = String(formData.get("label") ?? "").trim() || null;

  if (!studentId) return { error: "Sélectionne un élève." };
  const amountEuros = Number(amountRaw);
  if (!Number.isFinite(amountEuros) || amountEuros <= 0) {
    return { error: "Montant invalide." };
  }
  const amountCents = Math.round(amountEuros * 100);

  const supabase = await createClient();

  // La policy students_select_teacher (RLS) filtre déjà cette lecture aux élèves
  // de l'enseignant courant — pas d'accès cross-teacher possible ici.
  const { data: student } = await supabase
    .from("students")
    .select("id, profile_id, profiles(email, full_name)")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) return { error: "Élève introuvable." };
  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles;

  const reference = `TK-${randomBytes(4).toString("hex").toUpperCase()}`;

  const admin = createAdminClient();
  const { error: insertErr } = await admin.from("payments").insert({
    student_id: studentId,
    product: "individual_hour",
    status: "pending",
    amount_cents: amountCents,
    label,
    revolut_reference: reference,
  });

  if (insertErr) return { error: "Échec de la création de la demande." };

  const paypalUrl = paypalMeUrl(amountCents);
  if (paypalUrl && profile?.email) {
    const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "élève";
    await sendPaymentLink({
      to: profile.email,
      firstName,
      amountCents,
      reference,
      paypalUrl,
      label: label ?? "Cours d'arabe",
    }).catch(() => {/* non bloquant */});
  }

  await supabase.rpc("insert_notification", {
    p_user_id: student.profile_id,
    p_type: "payment_requested",
    p_payload: { url: "/dashboard/payments" },
  });

  revalidatePath("/teacher/payments");
  return { success: true };
}

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
