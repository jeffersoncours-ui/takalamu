"use server";

import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { paypalMeUrl } from "@/lib/paypal";
import { sendPaymentLink } from "@/lib/resend";
import { ANNUAL_PLANS, HOURLY_PRICE_CENTS, isAnnualPlanKey } from "@/lib/pricing";

export type VerifyResult =
  | { valid: true; firstName: string; lastName: string; email: string; gender: string; trialId: string }
  | { valid: false; error: string };

/** Vérifie un code d'essai et retourne les infos du prospect. */
export async function verifyTrialCode(code: string): Promise<VerifyResult> {
  const normalized = code.replace(/\s/g, "").toUpperCase();
  if (normalized.length !== 8) {
    return { valid: false, error: "Le code doit faire 8 caractères." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("trial_requests")
    .select("id, first_name, last_name, email, gender, trial_code_used, trial_code_expires_at, status")
    .eq("trial_code", normalized)
    .maybeSingle();

  if (!data) return { valid: false, error: "Code introuvable. Vérifie l'email reçu." };
  if (data.trial_code_used) return { valid: false, error: "Ce code a déjà été utilisé." };
  if (data.status !== "completed") return { valid: false, error: "Ce code n'est pas encore activé." };
  if (data.trial_code_expires_at && new Date(data.trial_code_expires_at) < new Date()) {
    return { valid: false, error: "Ce code a expiré. Contacte ton enseignant." };
  }

  return {
    valid: true,
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
    gender: data.gender,
    trialId: data.id,
  };
}

export type EnrollmentResult =
  | {
      ok: true;
      orderRef: string;
      amountCents: number;
      /** Lien PayPal.Me à montant exact — null si PAYPAL_ME_USERNAME absent. */
      paypalUrl: string | null;
    }
  | { ok: false; error: string };

/** Crée l'intention d'inscription et le lien de paiement PayPal.Me. */
export async function createEnrollment(params: {
  trialCode: string;
  trialId: string;
  plan: string;          // '1x'|'2x'|'3x'|'12x'|'hourly'
  firstName: string;
  lastName: string;
  email: string;
}): Promise<EnrollmentResult> {
  const { trialCode, trialId, plan, email } = params;

  // Re-vérification serveur (prévient toute manipulation côté client)
  const verification = await verifyTrialCode(trialCode);
  if (!verification.valid) return { ok: false, error: verification.error };
  if (verification.trialId !== trialId) return { ok: false, error: "Identifiant de demande invalide." };

  const isAnnual = isAnnualPlanKey(plan);
  if (!isAnnual && plan !== "hourly") {
    return { ok: false, error: "Plan invalide." };
  }
  const annualPlan = isAnnual ? ANNUAL_PLANS.find((p) => p.key === plan) : null;
  const amountCents = isAnnual
    ? (annualPlan?.installmentAmount ?? 0) * 100
    : HOURLY_PRICE_CENTS;
  const product = isAnnual ? "individual_sub" : "individual_hour";

  const orderRef = `TK-${randomBytes(4).toString("hex").toUpperCase()}`;

  const label =
    isAnnual && annualPlan
      ? `Abonnement annuel (${annualPlan.label}) — 1er versement`
      : "Heure à la carte";

  const admin = createAdminClient();

  // Stocker l'intention d'inscription (service_role contourne la RLS).
  // `revolut_order_id` sert de référence de paiement générique (héritage Revolut).
  const { error: updateErr } = await admin
    .from("trial_requests")
    .update({
      chosen_plan: plan,
      chosen_product: product,
      revolut_order_id: orderRef,
    })
    .eq("id", trialId);

  if (updateErr) return { ok: false, error: "Erreur lors de la création de la commande." };

  const paypalUrl = paypalMeUrl(amountCents);

  // Envoyer le lien par email (non bloquant : l'écran de succès l'affiche aussi)
  if (paypalUrl) {
    await sendPaymentLink({
      to: email,
      firstName: verification.firstName,
      amountCents,
      reference: orderRef,
      paypalUrl,
      label,
    }).catch(() => {/* non bloquant */});
  }

  return { ok: true, orderRef, amountCents, paypalUrl };
}
