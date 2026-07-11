"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAttendanceStatus } from "@/lib/attendance";
import { zipVocab, zipGrammar } from "@/lib/session-form-zip";

type ActionState = { error?: string };

export async function submitSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const studentIds = formData.getAll("student_ids").map((v) => String(v)).filter(Boolean);
  const attendance = String(formData.get("attendance") ?? "").trim();
  const sessionDateIso = String(formData.get("session_date_iso") ?? "").trim();

  if (studentIds.length === 0) return { error: "Sélectionne au moins un élève." };
  if (!isAttendanceStatus(attendance)) return { error: "Présence invalide." };

  const sessionDate = sessionDateIso || new Date().toISOString();
  if (Number.isNaN(Date.parse(sessionDate))) {
    return { error: "Date de séance invalide." };
  }

  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework = String(formData.get("homework_instructions") ?? "").trim() || null;
  const vocab = zipVocab(formData);
  const grammar = zipGrammar(formData);

  const supabase = await createClient();
  const rawFiles = formData
    .getAll("support_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  // La même fiche (vocabulaire, grammaire, devoir, récap, supports) est appliquée
  // à chaque élève sélectionné — utile pour les anciens élèves qui suivent le même
  // programme qu'un élève plus avancé (voir CLAUDE.md session courante).
  for (const studentId of studentIds) {
    const supportFiles: { path: string; name: string }[] = [];
    for (const raw of rawFiles) {
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
      p_vocab: vocab,
      p_grammar: grammar,
      p_support_files: supportFiles,
    });

    if (error || !recordId) {
      return { error: "Échec de l'enregistrement pour un des élèves sélectionnés." };
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
  }

  revalidatePath("/teacher");
  redirect("/teacher?session=ok");
}
