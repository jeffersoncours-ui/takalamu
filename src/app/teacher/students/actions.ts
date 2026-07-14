"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type StudentStatus = Database["public"]["Enums"]["student_status"];
type Gender = Database["public"]["Enums"]["gender_type"];
type ActionState = { error?: string };
type CreateStudentState = { error?: string; success?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Création manuelle d'un compte élève — bouche-à-oreille, sans tunnel d'essai.
 * L'enseignant (ou l'admin, pour n'importe quel enseignant) saisit directement
 * les infos du prospect et l'invitation part immédiatement.
 */
export async function createStudentManually(
  _prev: CreateStudentState,
  formData: FormData,
): Promise<CreateStudentState> {
  const { userId, profile } = await requireTeacher();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { error: "Clé service_role absente : impossible d'envoyer l'invitation." };
  }

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const gender = String(formData.get("gender") ?? "").trim() as Gender;
  const teacherOverride = String(formData.get("teacher_id") ?? "").trim() || null;

  if (!firstName) return { error: "Le prénom est requis." };
  if (!lastName) return { error: "Le nom est requis." };
  if (!EMAIL_RE.test(email)) return { error: "Adresse e-mail invalide." };
  if (gender !== "m" && gender !== "f") return { error: "Sélectionne le genre de l'élève." };

  const supabase = await createClient();

  let teacherId: string | null = null;
  if (profile?.role === "admin" && teacherOverride) {
    teacherId = teacherOverride;
  } else {
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    teacherId = teacher?.id ?? null;
  }

  if (!teacherId) return { error: "Enseignant introuvable." };

  const admin = createAdminClient();
  const origin = (await headers()).get("origin") ?? "";
  const redirectTo = origin ? `${origin}/login` : undefined;
  const fullName = `${firstName} ${lastName}`;

  const { data, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role: "student", full_name: fullName, gender },
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
    teacher_id: teacherId,
    gender,
  });

  if (studentError) {
    return { error: "Invitation envoyée mais fiche élève non créée. Vérifie en base." };
  }

  revalidatePath("/teacher/students");
  return { success: `Invitation envoyée à ${email}.` };
}

const VALID_STATUSES: StudentStatus[] = [
  "active",
  "suspended_absences",
];

export async function updateStudentStatus(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const status = String(formData.get("status") ?? "").trim() as StudentStatus;
  if (!VALID_STATUSES.includes(status)) return { error: "Statut invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ status })
    .eq("id", studentId);

  if (error) return { error: "Échec de la mise à jour du statut." };

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
  return {};
}

export async function upsertProfileNote(
  studentId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await requireTeacher();

  const content = String(formData.get("content") ?? "").trim();

  const supabase = await createClient();

  // Récupère l'id du teacher courant pour l'insert.
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!teacher) return { error: "Enseignant introuvable." };

  const { error } = await supabase.from("student_profile_notes").upsert(
    { student_id: studentId, teacher_id: teacher.id, content },
    { onConflict: "student_id,teacher_id" },
  );

  if (error) return { error: "Échec de la sauvegarde de la note." };

  revalidatePath(`/teacher/students/${studentId}`);
  return {};
}
