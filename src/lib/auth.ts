import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Renvoie l'utilisateur courant + son profil (soumis aux RLS), ou null si
 * non connecté. À utiliser dans les Composants Serveur / Server Actions.
 */
export async function getProfile(): Promise<{
  userId: string;
  profile: Profile | null;
} | null> {
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
}

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

/** Chemin du tableau de bord adapté au rôle (pour les redirections post-login). */
export function homePathForRole(role: Profile["role"] | undefined): string {
  return role === "teacher" || role === "admin" ? "/teacher" : "/dashboard";
}
