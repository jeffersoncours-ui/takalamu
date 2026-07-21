"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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

  const sessionDateIso = String(formData.get("session_date_iso") ?? "").trim();

  const sessionDate = sessionDateIso || new Date().toISOString();
  if (Number.isNaN(Date.parse(sessionDate))) {
    return { error: "Date de séance invalide." };
  }

  const customTitle = String(formData.get("custom_title") ?? "").trim();
  if (!customTitle) return { error: "Le nom du cours est obligatoire." };

  const bookId = String(formData.get("book_id") ?? "").trim();
  if (!bookId) return { error: "Choisis un livre pour ce cours." };

  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework = String(formData.get("homework_instructions") ?? "").trim() || null;

  const supabase = await createClient();

  const { data: book } = await supabase
    .from("course_books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle(); // RLS : uniquement les livres de l'enseignant
  if (!book) return { error: "Livre invalide." };

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

  const grammarRows = zipGrammar(formData);

  // Requêtes/uploads indépendants lancés en parallèle plutôt qu'un par un.
  const [uploadResults, oldFormsRes, formulations, oldGrammarRes, grammarRules, existingHomeworkRes] = await Promise.all([
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
    // Photos de règle de grammaire : existantes conservées, nouvelles uploadées
    supabase.from("grammar_rules").select("photos").eq("lesson_record_id", recordId),
    Promise.all(
      grammarRows.map(async (row) => {
        const uploaded = (
          await Promise.all(
            row.newPhotos.map(async (raw) => {
              const ext = raw.name.split(".").pop() ?? "jpg";
              const path = `${studentId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
              const { error: photoError } = await supabase.storage
                .from("grammar-photos")
                .upload(path, raw, { contentType: raw.type || `image/${ext}` });
              return photoError ? null : { path, name: raw.name };
            })
          )
        ).filter((f): f is { path: string; name: string } => f !== null);
        return {
          title: row.title,
          content: row.content,
          photos: [...row.existingPhotos, ...uploaded],
          rule_group_id: row.existingGroupId ?? undefined,
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

  // Nettoyage best-effort des photos de grammaire qui ne sont plus référencées
  // (retirées côté formulaire, ou dont la règle a été supprimée).
  const oldPhotoPaths = (oldGrammarRes.data ?? [])
    .flatMap((g) => ((g.photos as SupportFile[] | null) ?? []).map((p) => p.path));
  const keptPhotos = new Set(grammarRules.flatMap((g) => g.photos.map((p) => p.path)));
  const orphanedPhotos = oldPhotoPaths.filter((p) => !keptPhotos.has(p));
  if (orphanedPhotos.length > 0) {
    await supabase.storage.from("grammar-photos").remove(orphanedPhotos);
  }

  const existingHomework = existingHomeworkRes.data;

  const { error } = await supabase.rpc("update_session_record", {
    p_record_id: recordId,
    p_session_date: sessionDate,
    p_custom_title: customTitle,
    p_public_recap: publicRecap ?? undefined,
    p_private_note: privateNote ?? undefined,
    p_homework_instructions: homework ?? undefined,
    p_vocab: zipVocab(formData),
    p_grammar: grammarRules,
    p_formulations: formulations,
    p_support_files: supportFiles,
  });

  if (error) {
    return { error: "Échec de la mise à jour de la séance." };
  }

  // Rangement dans le livre choisi (mise à jour directe, RLS enseignant).
  await supabase.from("lesson_records").update({ book_id: bookId }).eq("id", recordId);

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
        p_payload: {
          url: "/dashboard/homework",
          instructions_preview: homework.length > 100 ? `${homework.slice(0, 100)}…` : homework,
        },
      });
    }
  }

  revalidatePath(`/teacher/students/${studentId}`);
  revalidatePath(`/teacher/students/${studentId}/sessions/${recordId}`);
  redirect(`/teacher/students/${studentId}/sessions/${recordId}`);
}
