import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRevolutSignature } from "@/lib/revolut";
import { sendTrialCode } from "@/lib/resend";
import { headers } from "next/headers";

// Désactiver le body parsing automatique de Next.js pour lire le raw body
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const hdrs = await headers();
  const signature = hdrs.get("revolut-signature") ?? "";

  if (!verifyRevolutSignature(body, signature)) {
    console.error("[webhook/revolut] signature invalide");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (event.event ?? event.type) as string | undefined;

  if (eventType === "ORDER_COMPLETED") {
    const order = (event.order ?? event) as Record<string, unknown>;
    const orderRef = order.merchant_order_ext_ref as string | undefined;
    if (orderRef) await handleOrderCompleted(orderRef, order);
  }

  return NextResponse.json({ received: true });
}

async function handleOrderCompleted(
  orderRef: string,
  _order: Record<string, unknown>,
) {
  const admin = createAdminClient();

  // Retrouver la demande d'essai liée à cette commande
  const { data: trial } = await admin
    .from("trial_requests")
    .select("*")
    .eq("revolut_order_id", orderRef)
    .maybeSingle();

  if (!trial) {
    console.warn(`[webhook/revolut] Aucune trial_request pour orderRef=${orderRef}`);
    return;
  }
  if (trial.status === "converted" || trial.trial_code_used) {
    console.info(`[webhook/revolut] Commande ${orderRef} déjà traitée.`);
    return;
  }

  const email = trial.email;
  const fullName = `${trial.first_name} ${trial.last_name}`;

  // Dedup : vérifier qu'aucun compte n'existe déjà pour cet email
  const { data: usersPage } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const alreadyExists = usersPage.users.some((u) => u.email === email);

  let profileId: string;

  if (alreadyExists) {
    const existing = usersPage.users.find((u) => u.email === email)!;
    profileId = existing.id;
  } else {
    // Créer le compte auth (Supabase enverra l'email de configuration de mot de passe)
    const { data: userData, error: userErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { role: "student", full_name: fullName, gender: trial.gender },
    });
    if (userErr || !userData.user) {
      console.error("[webhook/revolut] Création compte échouée:", userErr?.message);
      return;
    }
    profileId = userData.user.id;
  }

  // Trouver le teacher_id du bon genre (pour lier l'élève)
  const { data: teacherData } = await admin
    .from("teachers")
    .select("id, profiles!teachers_profile_id_fkey(gender)")
    .limit(10);

  const teacherRow = teacherData?.find(
    (t) => (t.profiles as { gender: string } | null)?.gender === trial.gender,
  );
  const teacherId = trial.assigned_teacher_id ?? teacherRow?.id ?? null;

  // Créer ou retrouver la fiche élève
  const { data: existingStudent } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!existingStudent && teacherId) {
    await admin.from("students").insert({
      profile_id: profileId,
      teacher_id: teacherId,
      gender: trial.gender,
    });
  }

  // Enregistrer le paiement
  const { data: student } = await admin
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (student) {
    await admin.from("payments").insert({
      student_id: student.id,
      product: (trial.chosen_product as "individual_sub" | "book" | "individual_hour") ?? "individual_sub",
      plan: (trial.chosen_plan as "1x" | "2x" | "3x" | "12x" | "single" | "monthly" | "hourly") ?? "1x",
      revolut_reference: orderRef,
      status: "paid",
    });
  }

  // Marquer la demande comme convertie + code utilisé
  await admin
    .from("trial_requests")
    .update({ status: "converted", trial_code_used: true, assigned_teacher_id: teacherId })
    .eq("id", trial.id);

  // Envoyer email de bienvenue via Resend (TODO: template plus riche)
  if (!alreadyExists) {
    await sendTrialCode({
      to: email,
      firstName: trial.first_name,
      code: "→ Connecte-toi via l'email d'invitation Supabase pour activer ton compte.",
      scheduledAt: null,
    }).catch(() => {/* non-bloquant */});
  }

  console.info(`[webhook/revolut] Compte créé pour ${email}, commande ${orderRef}`);
}
