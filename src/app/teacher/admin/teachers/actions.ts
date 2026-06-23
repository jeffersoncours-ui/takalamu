"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type Gender = Database["public"]["Enums"]["gender_type"];
type ActionState = { error?: string; success?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteTeacher(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const gender = String(formData.get("gender") ?? "").trim() as Gender;

  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };
  if (!fullName) return { error: "Le nom complet est requis." };
  if (gender !== "m" && gender !== "f") return { error: "Sélectionne le genre de l'enseignant." };

  // L'invitation Supabase Auth requiert la clé service_role : aucune alternative
  // RLS/RPC ne peut créer un compte auth ni envoyer l'e-mail d'invitation.
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error:
        "Clé service_role absente côté serveur : impossible d'envoyer l'invitation. Ajoute SUPABASE_SERVICE_ROLE_KEY aux variables d'environnement.",
    };
  }

  const admin = createAdminClient();

  // Origine de la requête → lien de retour après que l'enseignant a choisi son mot de passe.
  const origin = (await headers()).get("origin") ?? "";
  const redirectTo = origin ? `${origin}/login` : undefined;

  // Le trigger handle_new_user crée le profil avec role=teacher (depuis user_metadata).
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role: "teacher", full_name: fullName, gender },
    redirectTo,
  });

  if (error || !data?.user) {
    const msg = error?.message ?? "";
    if (msg.toLowerCase().includes("already")) {
      return { error: "Un compte existe déjà avec cette adresse." };
    }
    return { error: "Échec de l'envoi de l'invitation." };
  }

  // Créer la fiche enseignant (vitrine) liée au nouveau profil.
  const { error: teacherError } = await admin.from("teachers").insert({
    profile_id: data.user.id,
    display_name: fullName,
  });

  if (teacherError) {
    return {
      error:
        "L'invitation a été envoyée mais la fiche enseignant n'a pas pu être créée. Vérifie en base.",
    };
  }

  revalidatePath("/teacher/admin/teachers");
  return { success: `Invitation envoyée à ${email}.` };
}
