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

  // Récupérer le student_id et profile_id avant la mise à jour
  const { data: hw } = await supabase
    .from("homework")
    .select("id, student_id, instructions, students(profile_id)")
    .eq("id", homeworkId)
    .maybeSingle();

  if (!hw) return { error: "Devoir introuvable." };

  // Upload du fichier de correction si présent
  let correctionFilePath: string | null = null;
  const correctionFile = formData.get("correction_file");
  if (correctionFile instanceof File && correctionFile.size > 0) {
    const studentId = hw.student_id;
    const storagePath = `${studentId}/${Date.now()}_${correctionFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("homework-corrections")
      .upload(storagePath, correctionFile, { contentType: correctionFile.type || "application/octet-stream" });
    if (!uploadError) correctionFilePath = storagePath;
  }

  const { error } = await supabase
    .from("homework")
    .update({
      status: "corrige",
      feedback,
      grade,
      corrected_at: new Date().toISOString(),
      ...(correctionFilePath ? { correction_file: correctionFilePath } : {}),
    })
    .eq("id", homeworkId);

  if (error) return { error: "Échec de la correction." };

  // Notifier l'élève via RPC SECURITY DEFINER
  const student = Array.isArray(hw.students) ? hw.students[0] : hw.students;
  if (student?.profile_id) {
    const instructions = hw.instructions ?? "";
    await supabase.rpc("insert_notification", {
      p_user_id: student.profile_id,
      p_type: "homework_corrected",
      p_payload: {
        url: "/dashboard/homework",
        ...(grade ? { grade } : {}),
        ...(instructions
          ? { instructions_preview: instructions.length > 100 ? `${instructions.slice(0, 100)}…` : instructions }
          : {}),
      },
    });
  }

  revalidatePath("/teacher/homework");
  revalidatePath("/teacher");
  return {};
}
