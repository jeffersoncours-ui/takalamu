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

  const rawTargets = formData.getAll("target_ids").map((v) => String(v)).filter(Boolean);
  if (rawTargets.length === 0) return { error: "Sélectionne au moins un élève." };

  // Source (RLS garantit que c'est un cours de l'enseignant courant)
  const { data: record, error: recordError } = await supabase
    .from("lesson_records")
    .select("id, custom_title, session_date, public_recap, support_files, course_group_id")
    .eq("id", recordId)
    .maybeSingle();

  if (recordError || !record) return { error: "Cours introuvable." };

  // Ignore les élèves qui possèdent déjà ce cours (même groupe) — évite un
  // doublon si la sélection est forgée malgré la désactivation côté UI.
  const { data: groupMembers, error: groupError } = await supabase
    .from("lesson_records")
    .select("student_id")
    .eq("course_group_id", record.course_group_id);
  if (groupError) console.error("duplicateSession groupMembers query failed:", groupError.message);
  const already = new Set((groupMembers ?? []).map((r) => r.student_id));
  const targetIds = rawTargets.filter((id) => !already.has(id));

  if (targetIds.length === 0) {
    return { error: "Les élèves sélectionnés ont déjà ce cours." };
  }

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
    // Copies Storage indépendantes (chemins distincts) : lancées en parallèle.
    const [supportResults, formulations] = await Promise.all([
      // Supports : recopiés dans le dossier de la cible
      Promise.all(
        sourceSupports.map(async (f) => {
          const base = f.path.split("/").pop() ?? "fichier";
          const dest = `${targetId}/${randSuffix()}_${base}`;
          const { error: copyErr } = await supabase.storage.from("session-files").copy(f.path, dest);
          if (copyErr) {
            console.error("copy support", copyErr.message);
            return null;
          }
          return { path: dest, name: f.name };
        })
      ),
      // Formulations : audio recopié dans le dossier de la cible
      Promise.all(
        sourceForms.map(async (f) => {
          let audioPath: string | undefined;
          if (f.audio_path) {
            const ext = f.audio_path.split(".").pop() || "webm";
            const dest = `${targetId}/${randSuffix()}.${ext}`;
            const { error: copyErr } = await supabase.storage.from("formulation-audio").copy(f.audio_path, dest);
            if (!copyErr) audioPath = dest;
            else console.error("copy audio", copyErr.message);
          }
          return {
            arabic_text: f.arabic_text,
            french_text: f.french_text,
            ...(audioPath ? { audio_path: audioPath } : {}),
          };
        })
      ),
    ]);
    const supportFiles = supportResults.filter((f): f is SupportFile => f !== null);

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
      // Les cibles rejoignent le groupe du cours source → une seule carte en
      // bibliothèque, « donné à » s'enrichit des nouveaux élèves.
      p_course_group_id: record.course_group_id,
    });

    if (error) {
      return { error: "Échec de la duplication pour un des élèves sélectionnés." };
    }
  }

  revalidatePath("/teacher/library");
  redirect(`/teacher/library?dup=${targetIds.length}`);
}
