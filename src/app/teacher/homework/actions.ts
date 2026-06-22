"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };

export async function correctHomework(
  homeworkId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const grade = String(formData.get("grade") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("homework")
    .update({
      status: "corrige",
      feedback,
      grade,
      corrected_at: new Date().toISOString(),
    })
    .eq("id", homeworkId);

  if (error) return { error: "Échec de la correction." };

  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
  return {};
}
