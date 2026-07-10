"use server";

import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadAvatar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choisis une image." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Le fichier doit être une image." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Image trop lourde (5 Mo max)." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${user.id}/avatar_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: "Échec de l'upload." };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: path })
    .eq("id", user.id);
  if (updateError) return { error: "Échec de l'enregistrement." };

  return { success: true };
}
