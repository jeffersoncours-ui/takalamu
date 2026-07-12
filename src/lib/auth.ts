import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Renvoie l'utilisateur courant + son profil (soumis aux RLS), ou null si
 * non connecté. À utiliser dans les Composants Serveur / Server Actions.
 *
 * Mémoïsé par requête via `cache()` : layout + page + composants appellent
 * tous les gardes (`requireStudent`/`requireTeacher`) sur un même rendu, sans
 * ça chaque appel refaisait un aller-retour Auth + une requête `profiles`.
 */
export const getProfile = cache(async (): Promise<{
  userId: string;
  profile: Profile | null;
} | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, profile };
});

/** Lookup `students.id` d'un profil, mémoïsé par requête (même raison). */
const getStudentId = cache(async (profileId: string): Promise<string | null> => {
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return student?.id ?? null;
});

/**
 * Garde-fou : exige un rôle teacher ou admin. Redirige sinon
 * (anon → /login, élève → /dashboard). Renvoie le profil pour réutilisation.
 */
export async function requireTeacher() {
  const result = await getProfile();
  if (!result) redirect("/login");

  const role = result.profile?.role;
  if (role !== "teacher" && role !== "admin") {
    redirect("/dashboard");
  }
  return result;
}

/**
 * Garde-fou : exige un rôle student. Redirige sinon
 * (anon → /login, enseignant → /teacher). Renvoie profil + studentId.
 */
export async function requireStudent(): Promise<{
  userId: string;
  profile: Profile;
  studentId: string;
}> {
  const result = await getProfile();
  if (!result) redirect("/login");

  const role = result.profile?.role;
  if (role === "teacher" || role === "admin") redirect("/teacher");
  if (!result.profile) redirect("/login");

  const studentId = await getStudentId(result.userId);
  if (!studentId) redirect("/login");

  return { userId: result.userId, profile: result.profile, studentId };
}

/**
 * Garde-fou : exige le rôle admin. Redirige sinon
 * (anon → /login, teacher → /teacher, élève → /dashboard).
 */
export async function requireAdmin() {
  const result = await getProfile();
  if (!result) redirect("/login");

  if (result.profile?.role !== "admin") {
    redirect(homePathForRole(result.profile?.role));
  }
  return result;
}

/** Chemin du tableau de bord adapté au rôle (pour les redirections post-login). */
export function homePathForRole(role: Profile["role"] | undefined): string {
  return role === "teacher" || role === "admin" ? "/teacher" : "/dashboard";
}
