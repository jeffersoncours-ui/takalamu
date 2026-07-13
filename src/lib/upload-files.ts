"use client";

import { createClient } from "@/lib/supabase/client";

export type UploadedFile = { path: string; name: string };

/**
 * Uploade des fichiers **directement depuis le navigateur** vers un bucket Storage.
 * La RLS s'applique via la session de l'utilisateur (clé anon). Le fichier ne
 * transite jamais par un server action → contourne le plafond du corps de requête
 * (1 Mo par défaut côté Next, ~4,5 Mo côté Vercel) qui faisait planter le dépôt de
 * gros fichiers (photos de téléphone). Ne renvoie que les chemins.
 */
export async function uploadFilesToBucket(
  bucket: string,
  folder: string,
  files: File[],
): Promise<UploadedFile[]> {
  const supabase = createClient();
  const out: UploadedFile[] = [];
  for (const file of files) {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });
    if (error) throw new Error(error.message);
    out.push({ path, name: file.name });
  }
  return out;
}

/** Supprime des chemins d'un bucket (best-effort — les erreurs sont ignorées). */
export async function removeFilesFromBucket(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from(bucket).remove(paths);
}
