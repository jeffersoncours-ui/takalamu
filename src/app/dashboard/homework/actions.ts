"use server";

import { revalidatePath } from "next/cache";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

export async function submitHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { studentId } = await requireStudent();

  const file = formData.get("submission_file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Ajoute une photo de ton devoir." };
  }

  const supabase = await createClient();

  const storagePath = `${studentId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error: uploadError } = await supabase.storage
    .from("homework-submissions")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
    });

  if (uploadError) return { error: "Échec de l'envoi du fichier." };

  const { error } = await supabase.rpc("submit_homework", {
    p_homework_id: homeworkId,
    p_submission_file: storagePath,
  });

  if (error) return { error: "Échec de la soumission." };

  revalidatePath("/dashboard/homework");
  return { success: true };
}
