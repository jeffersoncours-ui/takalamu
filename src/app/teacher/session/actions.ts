"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAttendanceStatus } from "@/lib/attendance";

type ActionState = { error?: string };

/** Aligne les colonnes saisies (même longueur) en lignes, filtre les vides. */
function zipVocab(formData: FormData) {
  const arabic = formData.getAll("vocab_arabic").map((v) => String(v).trim());
  const french = formData
    .getAll("vocab_french")
    .map((v) => String(v).trim());
  const root = formData.getAll("vocab_root").map((v) => String(v).trim());

  const rows: { arabic_word: string; french_definition: string; root: string }[] =
    [];
  for (let i = 0; i < arabic.length; i++) {
    if (arabic[i] && french[i]) {
      rows.push({
        arabic_word: arabic[i],
        french_definition: french[i],
        root: root[i] ?? "",
      });
    }
  }
  return rows;
}

function zipGrammar(formData: FormData) {
  const title = formData.getAll("grammar_title").map((v) => String(v).trim());
  const content = formData
    .getAll("grammar_content")
    .map((v) => String(v).trim());

  const rows: { title: string; content: string }[] = [];
  for (let i = 0; i < title.length; i++) {
    if (title[i] && content[i]) {
      rows.push({ title: title[i], content: content[i] });
    }
  }
  return rows;
}

export async function submitSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const studentId = String(formData.get("student_id") ?? "").trim();
  const attendance = String(formData.get("attendance") ?? "").trim();
  const sessionDateIso = String(formData.get("session_date_iso") ?? "").trim();

  if (!studentId) return { error: "Sélectionne un élève." };
  if (!isAttendanceStatus(attendance)) return { error: "Présence invalide." };

  const sessionDate = sessionDateIso || new Date().toISOString();
  if (Number.isNaN(Date.parse(sessionDate))) {
    return { error: "Date de séance invalide." };
  }

  const lessonId = String(formData.get("lesson_id") ?? "").trim() || null;
  const advanceProgress = formData.get("advance_progress") === "on";
  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework =
    String(formData.get("homework_instructions") ?? "").trim() || null;

  const supabase = await createClient();
  const { data: recordId, error } = await supabase.rpc(
    "submit_session_record",
    {
      p_student_id: studentId,
      p_session_date: sessionDate,
      p_attendance: attendance,
      p_lesson_id: lessonId ?? undefined,
      p_advance_progress: advanceProgress,
      p_public_recap: publicRecap ?? undefined,
      p_private_note: privateNote ?? undefined,
      p_homework_instructions: homework ?? undefined,
      p_vocab: zipVocab(formData),
      p_grammar: zipGrammar(formData),
    },
  );

  if (error || !recordId) {
    return { error: "Échec de l'enregistrement de la séance." };
  }

  revalidatePath("/teacher");
  redirect("/teacher?session=ok");
}
