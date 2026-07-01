"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendTrialCode } from "@/lib/resend";
import { HOURLY_PRICE_CENTS, installmentCents, isAnnualPlanKey } from "@/lib/pricing";
import type { Database } from "@/lib/supabase/database.types";

type TrialStatus = Database["public"]["Enums"]["trial_status"];
type ActionState = { error?: string; success?: string };

// Génère un code de 8 caractères non-ambigus (sans 0/O/I/1/L)
function generateCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("");
}

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus,
): Promise<ActionState> {
  const { userId } = await requireTeacher();
  const supabase = await createClient();

  // Quand l'essai est marqué "completed", générer + envoyer le code d'accès
  if (status === "completed") {
    // Récupérer le teacher_id pour l'assigner sur la demande
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    const { data: trial } = await supabase
      .from("trial_requests")
      .select("first_name, email, scheduled_at, trial_code")
      .eq("id", trialId)
      .maybeSingle();

    if (trial && !trial.trial_code) {
      const code = generateCode();
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const { error: updateErr } = await supabase
        .from("trial_requests")
        .update({
          status,
          trial_code: code,
          trial_code_expires_at: expiresAt,
          assigned_teacher_id: teacher?.id ?? null,
        })
        .eq("id", trialId);

      if (updateErr) return { error: "Impossible de confirmer l'essai." };

      const { error: emailErr } = await sendTrialCode({
        to: trial.email,
        firstName: trial.first_name,
        code,
        scheduledAt: trial.scheduled_at,
      });

      revalidatePath("/teacher/trials");
      if (emailErr) {
        return {
          success: `Essai confirmé. Code : ${code} — email non envoyé (${emailErr}).`,
        };
      }
      return { success: `Essai confirmé. Code envoyé à ${trial.email}.` };
    }
  }

  const { error } = await supabase
    .from("trial_requests")
    .update({ status })
    .eq("id", trialId);

  if (error) return { error: "Impossible de mettre à jour le statut." };

  revalidatePath("/teacher/trials");
  return { success: "Statut mis à jour." };
}

/** Renvoie le code d'essai par email (ou en génère un nouveau si absent). */
export async function resendTrialCode(trialId: string): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { data: trial } = await supabase
    .from("trial_requests")
    .select("first_name, email, scheduled_at, trial_code, trial_code_used")
    .eq("id", trialId)
    .maybeSingle();

  if (!trial) return { error: "Demande introuvable." };
  if (trial.trial_code_used) return { error: "Ce code a déjà été utilisé." };

  let code = trial.trial_code;

  if (!code) {
    code = generateCode();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    await supabase
      .from("trial_requests")
      .update({ trial_code: code, trial_code_expires_at: expiresAt })
      .eq("id", trialId);
  }

  const { error: emailErr } = await sendTrialCode({
    to: trial.email,
    firstName: trial.first_name,
    code,
    scheduledAt: trial.scheduled_at,
  });

  revalidatePath("/teacher/trials");
  if (emailErr) return { error: `Email non envoyé : ${emailErr}` };
  return { success: `Code renvoyé à ${trial.email}.` };
}

export async function inviteStudent(trialRequestId: string): Promise<ActionState> {
  const { userId } = await requireTeacher();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Clé service_role absente : impossible d'envoyer l'invitation." };
  }

  const supabase = await createClient();

  const { data: req, error: reqError } = await supabase
    .from("trial_requests")
    .select("*")
    .eq("id", trialRequestId)
    .maybeSingle();

  if (reqError || !req) return { error: "Demande introuvable." };
  if (req.status === "converted") return { error: "Cet élève a déjà été invité." };

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!teacher) return { error: "Profil enseignant introuvable." };

  const admin = createAdminClient();
  const origin = (await headers()).get("origin") ?? "";
  const redirectTo = origin ? `${origin}/login` : undefined;

  const fullName = `${req.first_name} ${req.last_name}`;

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(req.email, {
    data: { role: "student", full_name: fullName, gender: req.gender },
    redirectTo,
  });

  if (inviteError || !data?.user) {
    const msg = inviteError?.message ?? "";
    if (msg.toLowerCase().includes("already")) {
      return { error: "Un compte existe déjà avec cette adresse." };
    }
    return { error: "Échec de l'envoi de l'invitation." };
  }

  const { error: studentError } = await admin.from("students").insert({
    profile_id: data.user.id,
    teacher_id: teacher.id,
    gender: req.gender,
    trial_credit_cents: 0,
  });

  if (studentError) {
    return { error: "Invitation envoyée mais fiche élève non créée. Vérifie en base." };
  }

  // Si un plan a été choisi via /inscription, enregistrer le 1er paiement comme reçu :
  // l'enseignant n'invite qu'après avoir vérifié l'arrivée de l'argent sur PayPal.
  if (req.chosen_plan) {
    const { data: newStudent } = await admin
      .from("students")
      .select("id")
      .eq("profile_id", data.user.id)
      .maybeSingle();

    if (newStudent) {
      const plan = req.chosen_plan;
      const amountCents = isAnnualPlanKey(plan)
        ? installmentCents(plan)
        : HOURLY_PRICE_CENTS;

      await admin.from("payments").insert({
        student_id: newStudent.id,
        product: isAnnualPlanKey(plan) ? "individual_sub" : "individual_hour",
        plan: plan as Database["public"]["Enums"]["payment_plan"],
        status: "paid",
        amount_cents: amountCents,
        revolut_reference: req.revolut_order_id,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
      });
    }
  }

  await supabase
    .from("trial_requests")
    .update({ status: "converted", assigned_teacher_id: teacher.id })
    .eq("id", trialRequestId);

  revalidatePath("/teacher/trials");
  return { success: `Invitation envoyée à ${req.email}.` };
}
