"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string; success?: boolean };

async function teacherId(): Promise<string | null> {
  const { userId } = await requireTeacher();
  const supabase = await createClient();
  const { data } = await supabase.from("teachers").select("id").eq("profile_id", userId).maybeSingle();
  return data?.id ?? null;
}

export async function createBook(input: {
  title: string;
  subtitle: string;
  kind: "courses" | "grammar";
  coverUrl: string;
}): Promise<ActionState> {
  const tid = await teacherId();
  if (!tid) return { error: "Enseignant introuvable." };
  const title = input.title.trim();
  if (!title) return { error: "Le titre du livre est obligatoire." };

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("course_books")
    .select("order_index")
    .eq("teacher_id", tid)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle();
  const order = (maxRow?.order_index ?? 0) + 1;

  const { error } = await supabase.from("course_books").insert({
    teacher_id: tid,
    title,
    subtitle: input.subtitle.trim() || null,
    kind: input.kind === "grammar" ? "grammar" : "courses",
    cover_url: input.coverUrl.trim() || null,
    order_index: order,
  });
  if (error) return { error: "Échec de la création du livre." };

  revalidatePath("/teacher/books");
  return { success: true };
}

export async function updateBook(
  id: string,
  input: { title: string; subtitle: string; coverUrl?: string },
): Promise<ActionState> {
  if (!(await teacherId())) return { error: "Enseignant introuvable." };
  const title = input.title.trim();
  if (!title) return { error: "Le titre du livre est obligatoire." };

  const supabase = await createClient();
  const patch: { title: string; subtitle: string | null; cover_url?: string } = {
    title,
    subtitle: input.subtitle.trim() || null,
  };
  if (input.coverUrl) patch.cover_url = input.coverUrl;

  // RLS book_teacher_all : ne met à jour que les livres de l'enseignant.
  const { error } = await supabase.from("course_books").update(patch).eq("id", id);
  if (error) return { error: "Échec de la mise à jour du livre." };

  revalidatePath("/teacher/books");
  return { success: true };
}

export async function deleteBook(id: string): Promise<ActionState> {
  if (!(await teacherId())) return { error: "Enseignant introuvable." };
  const supabase = await createClient();

  // Refuse la suppression si des cours y sont encore rattachés.
  const { count } = await supabase
    .from("lesson_records")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id);
  if ((count ?? 0) > 0) {
    return { error: "Ce livre contient des cours : range-les ailleurs avant de le supprimer." };
  }

  const { error } = await supabase.from("course_books").delete().eq("id", id);
  if (error) return { error: "Échec de la suppression du livre." };

  revalidatePath("/teacher/books");
  return { success: true };
}
