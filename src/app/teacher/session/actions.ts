"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { zipVocab, zipGrammar, zipFormulation } from "@/lib/session-form-zip";

type ActionState = { error?: string };

export async function submitSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const studentIds = formData.getAll("student_ids").map((v) => String(v)).filter(Boolean);
  const sessionDateIso = String(formData.get("session_date_iso") ?? "").trim();

  if (studentIds.length === 0) return { error: "Sélectionne au moins un élève." };

  const sessionDate = sessionDateIso || new Date().toISOString();
  if (Number.isNaN(Date.parse(sessionDate))) {
    return { error: "Date de séance invalide." };
  }

  const customTitle = String(formData.get("custom_title") ?? "").trim();
  if (!customTitle) return { error: "Le nom du cours est obligatoire." };

  const bookId = String(formData.get("book_id") ?? "").trim();
  if (!bookId) return { error: "Choisis un livre pour ce cours." };

  const supabaseCheck = await createClient();
  const { data: book } = await supabaseCheck
    .from("course_books")
    .select("id")
    .eq("id", bookId)
    .maybeSingle(); // RLS : ne renvoie le livre que s'il appartient à l'enseignant
  if (!book) return { error: "Livre invalide." };

  const publicRecap = String(formData.get("public_recap") ?? "").trim() || null;
  const privateNote = String(formData.get("private_note") ?? "").trim() || null;
  const homework = String(formData.get("homework_instructions") ?? "").trim() || null;
  const vocab = zipVocab(formData);
  const grammar = zipGrammar(formData);
  const formulationRows = zipFormulation(formData);

  const supabase = await createClient();
  const rawFiles = formData
    .getAll("support_files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  // La même fiche (vocabulaire, grammaire, devoir, récap, supports) est appliquée
  // à chaque élève sélectionné — utile pour les anciens élèves qui suivent le même
  // programme qu'un élève plus avancé (voir CLAUDE.md session courante).
  // Tous les élèves d'une même saisie partagent un `course_group_id` → la
  // bibliothèque n'affiche qu'une carte pour ce cours, pas une par élève.
  const courseGroupId = crypto.randomUUID();
  // Une règle de grammaire donnée à plusieurs élèves dans cette même fiche
  // partage un rule_group_id (une valeur par ligne de règle, indépendante du
  // course_group_id) -> une seule carte groupée dans le livre de grammaire.
  const grammarGroupIds = grammar.map(() => crypto.randomUUID());

  for (const studentId of studentIds) {
    // Uploads indépendants (chemins distincts) : lancés en parallèle plutôt
    // qu'un par un — gain direct sur l'écran le plus critique du produit (<30s).
    const [supportResults, formulations, grammarRules] = await Promise.all([
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
      // Audio de formulation : uploadé dans le dossier de chaque élève (le même
      // enregistrement sert à tous les élèves cochés, comme les supports).
      Promise.all(
        formulationRows.map(async (row) => {
          let audioPath: string | undefined;
          if (row.newAudio) {
            const ext = row.newAudio.name.split(".").pop() || "webm";
            const path = `${studentId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const { error: audioError } = await supabase.storage
              .from("formulation-audio")
              .upload(path, row.newAudio, { contentType: row.newAudio.type || "audio/webm" });
            if (!audioError) audioPath = path;
          }
          return {
            arabic_text: row.arabic_text,
            french_text: row.french_text,
            ...(audioPath ? { audio_path: audioPath } : {}),
          };
        })
      ),
      // Photos de règle de grammaire : propres à chaque règle, uploadées dans
      // le dossier de l'élève (bucket dédié grammar-photos).
      Promise.all(
        grammar.map(async (row, idx) => {
          const photos = (
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
          return { title: row.title, content: row.content, photos, rule_group_id: grammarGroupIds[idx] };
        })
      ),
    ]);
    const supportFiles = supportResults.filter(
      (f): f is { path: string; name: string } => f !== null
    );

    const { data: recordId, error } = await supabase.rpc("submit_session_record", {
      p_student_id: studentId,
      p_session_date: sessionDate,
      p_custom_title: customTitle,
      p_public_recap: publicRecap ?? undefined,
      p_private_note: privateNote ?? undefined,
      p_homework_instructions: homework ?? undefined,
      p_vocab: vocab,
      p_grammar: grammarRules,
      p_formulations: formulations,
      p_support_files: supportFiles,
      p_course_group_id: courseGroupId,
    });

    if (error || !recordId) {
      return { error: "Échec de l'enregistrement pour un des élèves sélectionnés." };
    }

    // Rangement du cours dans le livre choisi (mise à jour directe, RLS enseignant —
    // aucune modification de la RPC critique submit_session_record).
    await supabase.from("lesson_records").update({ book_id: bookId }).eq("id", recordId);

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
          p_payload: {
            url: "/dashboard/homework",
            instructions_preview: homework.length > 100 ? `${homework.slice(0, 100)}…` : homework,
          },
        });
      }
    }
  }

  revalidatePath("/teacher");
  redirect("/teacher?session=ok");
}
