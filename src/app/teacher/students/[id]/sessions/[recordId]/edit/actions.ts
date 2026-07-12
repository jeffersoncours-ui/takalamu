"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAttendanceStatus } from "@/lib/attendance";
import { zipVocab, zipGrammar, zipFormulation } from "@/lib/session-form-zip";

type ActionState = { error?: string };
type SupportFile = { path: string; name: string };

export async function updateSession(
  studentId: string,
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeacher();

  const attendance = String(formData.get("attendance") ?? "").trim();
  const sessionDateIso = String(formData.get("session_date_iso") ?? "").trim();

  if (!isAttendanceStatus(attendance)) return { error: "Présence invalide." };

  const sessionDate = sessionDateIso || new Date().toISOString();
  if (Number.isNaN(Date.parse(sessionDate))) {
    return { error: "Date de séance invalide." };
  }

  const customTitle = String(formData.get("custom_title") ?? "").trim();
  if (!customTitle) return { error: "Le nom du cours est obligatoire." };

  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework = String(formData.get("homework_instructions") ?? "").trim() || null;

  const supabase = await createClient();

  // Fichiers existants conservés (cases cochées) + nouveaux uploads ajoutés
  const existingFiles: SupportFile[] = JSON.parse(
    String(formData.get("existing_files_json") ?? "[]")
  );
  const keptPaths = new Set(formData.getAll("keep_file").map((v) => String(v)));
  const removedFiles = existingFiles.filter((f) => !keptPaths.has(f.path));
  const keptExistingFiles: SupportFile[] = existingFiles.filter((f) => keptPaths.has(f.path));

  const rawFiles = formData.getAll("support_files").filter(
    (f): f is File => f instanceof File && f.size > 0
  );

  // Requêtes/uploads indépendants lancés en parallèle plutôt qu'un par un.
  const [uploadResults, oldFormsRes, formulations, existingHomeworkRes] = await Promise.all([
    Promise.all(
      rawFiles.map(async (raw) => {
        const ext = raw.name.split(".").pop() ?? "";
        const storagePath = `${studentId}/${Date.now()}_${raw.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("session-files")
          .upload(storagePath, raw, { contentType: raw.type || `application/${ext}` });
        return uploadError ? null : { path: storagePath, name: raw.name };
      })
    ),
    // Formulations : audios existants conservés, nouveaux uploadés, retirés nettoyés
    supabase.from("formulations").select("audio_path").eq("lesson_record_id", recordId),
    Promise.all(
      zipFormulation(formData).map(async (row) => {
        let audioPath: string | undefined;
        if (row.newAudio) {
          const ext = row.newAudio.name.split(".").pop() || "webm";
          const path = `${studentId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: audioError } = await supabase.storage
            .from("formulation-audio")
            .upload(path, row.newAudio, { contentType: row.newAudio.type || "audio/webm" });
          if (!audioError) audioPath = path;
        } else if (row.existingAudioPath) {
          audioPath = row.existingAudioPath;
        }
        return {
          arabic_text: row.arabic_text,
          french_text: row.french_text,
          ...(audioPath ? { audio_path: audioPath } : {}),
        };
      })
    ),
    // Notifie l'élève uniquement si un devoir apparaît (n'existait pas avant l'édition)
    supabase.from("homework").select("id").eq("lesson_record_id", recordId).maybeSingle(),
  ]);

  const newSupportFiles = uploadResults.filter(
    (f): f is { path: string; name: string } => f !== null
  );
  const supportFiles: SupportFile[] = [...keptExistingFiles, ...newSupportFiles];

  if (removedFiles.length > 0) {
    await supabase.storage.from("session-files").remove(removedFiles.map((f) => f.path));
  }

  const oldAudioPaths = (oldFormsRes.data ?? [])
    .map((f) => f.audio_path)
    .filter((p): p is string => !!p);

  // Nettoyage best-effort des audios qui ne sont plus référencés (remplacés,
  // retirés, ou dont la ligne a été supprimée).
  const keptAudio = new Set(formulations.map((f) => f.audio_path).filter(Boolean));
  const orphanedAudio = oldAudioPaths.filter((p) => !keptAudio.has(p));
  if (orphanedAudio.length > 0) {
    await supabase.storage.from("formulation-audio").remove(orphanedAudio);
  }

  const existingHomework = existingHomeworkRes.data;

  const { error } = await supabase.rpc("update_session_record", {
    p_record_id: recordId,
    p_session_date: sessionDate,
    p_attendance: attendance,
    p_custom_title: customTitle,
    p_public_recap: publicRecap ?? undefined,
    p_private_note: privateNote ?? undefined,
    p_homework_instructions: homework ?? undefined,
    p_vocab: zipVocab(formData),
    p_grammar: zipGrammar(formData),
    p_formulations: formulations,
    p_support_files: supportFiles,
  });

  if (error) {
    return { error: "Échec de la mise à jour de la séance." };
  }

  if (homework && !existingHomework) {
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

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}/sessions/${recordId}`);
  redirect(`/teacher/students/${studentId}/sessions/${recordId}`);
}
