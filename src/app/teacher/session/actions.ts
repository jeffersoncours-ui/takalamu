"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAttendanceStatus } from "@/lib/attendance";

type ActionState = { error?: string };

function zipVocab(formData: FormData) {
  const arabic = formData.getAll("vocab_arabic").map((v) => String(v).trim());
  const french = formData.getAll("vocab_french").map((v) => String(v).trim());

  const rows: { arabic_word: string; french_definition: string }[] = [];
  for (let i = 0; i < arabic.length; i++) {
    if (arabic[i] && french[i]) {
      rows.push({ arabic_word: arabic[i], french_definition: french[i] });
    }
  }
  return rows;
}

function zipGrammar(formData: FormData) {
  const title = formData.getAll("grammar_title").map((v) => String(v).trim());
  const content = formData.getAll("grammar_content").map((v) => String(v).trim());

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

  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework = String(formData.get("homework_instructions") ?? "").trim() || null;

  const supabase = await createClient();

  // Upload support files to Storage
  const rawFiles = formData.getAll("support_files");
  const supportFiles: { path: string; name: string }[] = [];

  for (const raw of rawFiles) {
    if (!(raw instanceof File) || raw.size === 0) continue;
    const ext = raw.name.split(".").pop() ?? "";
    const storagePath = `${studentId}/${Date.now()}_${raw.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage
      .from("session-files")
      .upload(storagePath, raw, { contentType: raw.type || `application/${ext}` });
    if (!uploadError) {
      supportFiles.push({ path: storagePath, name: raw.name });
    }
  }

  const { data: recordId, error } = await supabase.rpc("submit_session_record", {
    p_student_id: studentId,
    p_session_date: sessionDate,
    p_attendance: attendance,
    p_public_recap: publicRecap ?? undefined,
    p_private_note: privateNote ?? undefined,
    p_homework_instructions: homework ?? undefined,
    p_vocab: zipVocab(formData),
    p_grammar: zipGrammar(formData),
    p_support_files: supportFiles,
  });

  if (error || !recordId) {
    return { error: "Échec de l'enregistrement de la séance." };
  }

  // Notifier l'élève si un devoir a été assigné pendant cette séance.
  if (homework) {
    const { data: student } = await supabase
      .from("students")
      .select("profile_id")
      .eq("id", studentId)
      .maybeSingle();

    if (student?.profile_id) {
      await supabase.rpc("insert_notification", {
        p_user_id: student.profile_id,
        p_type: "homework_due",
        p_payload: { url: "/dashboard/homework" },
      });
    }
  }

  revalidatePath("/teacher");
  redirect("/teacher?session=ok");
}
