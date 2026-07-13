"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { UploadedFile } from "@/lib/upload-files";

type ActionState = { error?: string; success?: boolean };

/**
 * Enregistre le dépôt d'un devoir. Les fichiers ont déjà été uploadés en direct
 * depuis le navigateur vers Storage — cette action ne reçoit que leurs chemins
 * (aucun octet ne transite par le serveur, donc pas de plafond de taille). La RPC
 * `submit_homework(uuid, jsonb)` remplace la liste, gère le statut et la notif, et
 * vérifie que chaque chemin est bien dans le dossier de l'élève.
 */
export async function saveHomeworkSubmission(
  homeworkId: string,
  files: UploadedFile[],
): Promise<ActionState> {
  await requireStudent();
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_homework", {
    p_homework_id: homeworkId,
    p_files: files,
  });

  if (error) return { error: "Échec de l'enregistrement du devoir." };

  revalidatePath("/dashboard/homework");
  return { success: true };
}
