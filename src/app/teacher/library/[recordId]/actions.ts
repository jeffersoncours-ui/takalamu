"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };
type SupportFile = { path: string; name: string };

function randSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Duplique un cours existant vers un ou plusieurs élèves (copie indépendante).
 * Copie le vocabulaire, la grammaire, les formulations ET leurs audios, ainsi
 * que les fichiers supports — chaque fichier est recopié dans le dossier
 * Storage de l'élève cible (via `.copy()`, côté serveur) pour que la RLS lui en
 * donne l'accès. Le devoir et la note privée (spécifiques à l'élève d'origine)
 * ne sont jamais copiés.
 */
export async function duplicateSession(
  recordId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const targetIds = formData.getAll("target_ids").map((v) => String(v)).filter(Boolean);
  if (targetIds.length === 0) return { error: "Sélectionne au moins un élève." };

  // Source (RLS garantit que c'est un cours de l'enseignant courant)
  const { data: record, error: recordError } = await supabase
    .from("lesson_records")
    .select("id, custom_title, session_date, public_recap, support_files")
    .eq("id", recordId)
    .maybeSingle();

  if (recordError || !record) return { error: "Cours introuvable." };

  const [vocabRes, grammarRes, formRes] = await Promise.all([
    supabase.from("vocabulary").select("arabic_word, french_definition, root").eq("lesson_record_id", recordId).order("created_at", { ascending: true }),
    supabase.from("grammar_rules").select("title, content").eq("lesson_record_id", recordId).order("created_at", { ascending: true }),
    supabase.from("formulations").select("arabic_text, french_text, audio_path").eq("lesson_record_id", recordId).order("created_at", { ascending: true }),
  ]);

  const vocab = (vocabRes.data ?? []).map((v) => ({
    arabic_word: v.arabic_word,
    french_definition: v.french_definition,
    root: v.root ?? undefined,
  }));
  const grammar = (grammarRes.data ?? []).map((g) => ({ title: g.title, content: g.content }));
  const sourceForms = formRes.data ?? [];
  const sourceSupports = (record.support_files as SupportFile[] | null) ?? [];

  for (const targetId of targetIds) {
    // Supports : recopiés dans le dossier de la cible
    const supportFiles: SupportFile[] = [];
    for (const f of sourceSupports) {
      const base = f.path.split("/").pop() ?? "fichier";
      const dest = `${targetId}/${randSuffix()}_${base}`;
      const { error: copyErr } = await supabase.storage.from("session-files").copy(f.path, dest);
      if (!copyErr) supportFiles.push({ path: dest, name: f.name });
      else console.error("copy support", copyErr.message);
    }

    // Formulations : audio recopié dans le dossier de la cible
    const formulations: { arabic_text: string; french_text: string; audio_path?: string }[] = [];
    for (const f of sourceForms) {
      let audioPath: string | undefined;
      if (f.audio_path) {
        const ext = f.audio_path.split(".").pop() || "webm";
        const dest = `${targetId}/${randSuffix()}.${ext}`;
        const { error: copyErr } = await supabase.storage.from("formulation-audio").copy(f.audio_path, dest);
        if (!copyErr) audioPath = dest;
        else console.error("copy audio", copyErr.message);
      }
      formulations.push({
        arabic_text: f.arabic_text,
        french_text: f.french_text,
        ...(audioPath ? { audio_path: audioPath } : {}),
      });
    }

    const { error } = await supabase.rpc("submit_session_record", {
      p_student_id: targetId,
      p_session_date: record.session_date,
      p_attendance: "present",
      p_custom_title: record.custom_title ?? "Cours",
      p_public_recap: record.public_recap ?? undefined,
      p_vocab: vocab,
      p_grammar: grammar,
      p_formulations: formulations,
      p_support_files: supportFiles,
    });

    if (error) {
      return { error: "Échec de la duplication pour un des élèves sélectionnés." };
    }
  }

  revalidatePath("/teacher/library");
  redirect(`/teacher/library?dup=${targetIds.length}`);
}
