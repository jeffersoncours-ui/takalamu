"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isLessonPhase, type LessonPhase } from "@/lib/lessons";

type ActionState = { error?: string };

type LessonValues = {
  title: string;
  phase: LessonPhase;
  objective: string | null;
  grammar_point: string | null;
  reading_support: string | null;
  homework_template: string | null;
};

/** Champ texte optionnel : trim, et null si vide. */
function optional(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
}

function readLessonFields(
  formData: FormData,
): { ok: true; values: LessonValues } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  const phase = String(formData.get("phase") ?? "").trim();

  if (!title) return { ok: false, error: "Le titre est requis." };
  if (!isLessonPhase(phase)) return { ok: false, error: "Phase invalide." };

  return {
    ok: true,
    values: {
      title,
      phase,
      objective: optional(formData, "objective"),
      grammar_point: optional(formData, "grammar_point"),
      reading_support: optional(formData, "reading_support"),
      homework_template: optional(formData, "homework_template"),
    },
  };
}

export async function createLesson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const parsed = readLessonFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();

  // order_index = max existant + 1 (placée en fin de programme).
  const { data: last } = await supabase
    .from("lessons")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (last?.order_index ?? 0) + 1;

  const { error } = await supabase
    .from("lessons")
    .insert({ ...parsed.values, order_index: nextOrder });

  if (error) return { error: "Échec de la création de la leçon." };

  revalidatePath("/teacher/program");
  redirect("/teacher/program");
}

export async function updateLesson(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const parsed = readLessonFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update(parsed.values)
    .eq("id", id);

  if (error) return { error: "Échec de la mise à jour." };

  revalidatePath("/teacher/program");
  redirect("/teacher/program");
}

export async function uploadLessonAudio(
  lessonId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const file = formData.get("audio_file") as File | null;
  if (!file || file.size === 0) return { error: "Aucun fichier sélectionné." };
  if (file.size > 52_428_800) return { error: "Fichier trop volumineux (max 50 Mo)." };

  const supabase = await createClient();

  // Fetch existing audio_asset_id to remove it if present
  const { data: lesson } = await supabase
    .from("lessons")
    .select("audio_asset_id, audio_assets(id, storage_path)")
    .eq("id", lessonId)
    .maybeSingle();

  const existingAsset = lesson?.audio_asset_id
    ? (Array.isArray(lesson.audio_assets)
        ? lesson.audio_assets[0]
        : lesson.audio_assets) as { id: string; storage_path: string } | null
    : null;

  // Upload new file
  const ext = file.name.split(".").pop() ?? "mp3";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${lessonId}/${Date.now()}_${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("lesson-audio")
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return { error: "Échec de l'envoi du fichier." };

  // Insert audio_assets row
  const titleRaw = String(formData.get("audio_title") ?? "").trim();
  const title = titleRaw || file.name.replace(`.${ext}`, "");
  const { data: asset, error: assetError } = await supabase
    .from("audio_assets")
    .insert({ lesson_id: lessonId, storage_path: storagePath, title })
    .select("id")
    .single();

  if (assetError || !asset) {
    await supabase.storage.from("lesson-audio").remove([storagePath]);
    return { error: "Échec de l'enregistrement de l'audio." };
  }

  // Link to lesson
  const { error: linkError } = await supabase
    .from("lessons")
    .update({ audio_asset_id: asset.id })
    .eq("id", lessonId);

  if (linkError) {
    await supabase.from("audio_assets").delete().eq("id", asset.id);
    await supabase.storage.from("lesson-audio").remove([storagePath]);
    return { error: "Échec de la liaison à la leçon." };
  }

  // Remove old asset + file (after success so we don't lose data on failure)
  if (existingAsset) {
    await supabase.from("audio_assets").delete().eq("id", existingAsset.id);
    await supabase.storage.from("lesson-audio").remove([existingAsset.storage_path]);
  }

  revalidatePath(`/teacher/program/${lessonId}/edit`);
  return {};
}

export async function removeLessonAudio(
  lessonId: string,
  _formData: FormData,
): Promise<void> {
  await requireTeacher();
  const supabase = await createClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("audio_asset_id, audio_assets(id, storage_path)")
    .eq("id", lessonId)
    .maybeSingle();

  const asset = lesson?.audio_asset_id
    ? (Array.isArray(lesson.audio_assets)
        ? lesson.audio_assets[0]
        : lesson.audio_assets) as { id: string; storage_path: string } | null
    : null;

  if (!asset) return;

  // SET NULL via cascade happens when we delete the audio_assets row
  await supabase.from("audio_assets").delete().eq("id", asset.id);
  await supabase.storage.from("lesson-audio").remove([asset.storage_path]);

  revalidatePath(`/teacher/program/${lessonId}/edit`);
}

export async function deleteLesson(formData: FormData): Promise<void> {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("lessons").delete().eq("id", id);
  revalidatePath("/teacher/program");
}

/** Monte ou descend une leçon en échangeant son order_index avec le voisin. */
export async function moveLesson(formData: FormData): Promise<void> {
  await requireTeacher();
  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) return;

  const supabase = await createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, order_index")
    .order("order_index", { ascending: true });

  if (!lessons) return;
  const index = lessons.findIndex((l) => l.id === id);
  if (index === -1) return;

  const neighborIndex = direction === "up" ? index - 1 : index + 1;
  if (neighborIndex < 0 || neighborIndex >= lessons.length) return;

  const current = lessons[index];
  const neighbor = lessons[neighborIndex];

  // Échange des positions (deux mises à jour).
  await supabase
    .from("lessons")
    .update({ order_index: neighbor.order_index })
    .eq("id", current.id);
  await supabase
    .from("lessons")
    .update({ order_index: current.order_index })
    .eq("id", neighbor.id);

  revalidatePath("/teacher/program");
}
