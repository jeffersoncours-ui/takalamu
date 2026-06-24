"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRIAL_PRICE_CENTS } from "@/lib/pricing";
import type { Database } from "@/lib/supabase/database.types";

type TrialStatus = Database["public"]["Enums"]["trial_status"];
type ActionState = { error?: string; success?: string };

export async function updateTrialStatus(
  trialId: string,
  status: TrialStatus,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase
    .from("trial_requests")
    .update({ status })
    .eq("id", trialId);

  if (error) return { error: "Impossible de mettre à jour le statut." };

  revalidatePath("/teacher/trials");
  return { success: "Statut mis à jour." };
}

export async function inviteStudent(trialRequestId: string): Promise<ActionState> {
  const { userId } = await requireTeacher();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Clé service_role absente : impossible d'envoyer l'invitation." };
  }

  const supabase = await createClient();

  // Récupérer la demande d'essai (RLS filtre déjà par genre du teacher)
  const { data: req, error: reqError } = await supabase
    .from("trial_requests")
    .select("*")
    .eq("id", trialRequestId)
    .maybeSingle();

  if (reqError || !req) return { error: "Demande introuvable." };
  if (req.status === "converted") return { error: "Cet élève a déjà été invité." };

  // Récupérer teachers.id du teacher connecté
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

  // Créer la fiche élève
  const { error: studentError } = await admin.from("students").insert({
    profile_id: data.user.id,
    teacher_id: teacher.id,
    gender: req.gender,
    trial_credit_cents: req.trial_paid ? TRIAL_PRICE_CENTS : 0,
  });

  if (studentError) {
    return { error: "Invitation envoyée mais fiche élève non créée. Vérifie en base." };
  }

  // Marquer la demande comme convertie
  await supabase
    .from("trial_requests")
    .update({ status: "converted", assigned_teacher_id: teacher.id })
    .eq("id", trialRequestId);

  revalidatePath("/teacher/trials");
  return { success: `Invitation envoyée à ${req.email}.` };
}
