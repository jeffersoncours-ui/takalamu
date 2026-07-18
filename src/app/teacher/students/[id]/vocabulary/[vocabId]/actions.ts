"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Tense } from "@/lib/conjugation";

type ActionState = { error?: string; ok?: boolean };

export type TenseForms = { madi: Record<string, string>; mudari: Record<string, string>; amr: Record<string, string> };

/**
 * Enregistre (upsert) les tables de conjugaison d'un verbe pour ses 3 temps.
 * `student_id` est RE-DÉRIVÉ du vocab sous RLS (jamais celui envoyé par le
 * client) → un enseignant ne peut écrire que pour ses propres élèves. Un temps
 * dont toutes les formes sont vides est supprimé (pas de ligne fantôme).
 */
export async function saveConjugations(
  studentId: string,
  vocabId: string,
  forms: TenseForms,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  // Le vocab doit appartenir à un élève de l'enseignant (RLS le garantit) —
  // on récupère son student_id réel et on ignore celui fourni par le client.
  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("id, student_id")
    .eq("id", vocabId)
    .maybeSingle();
  if (!vocab) return { error: "Mot introuvable." };
  const realStudentId = vocab.student_id;

  const tenses: Tense[] = ["madi", "mudari", "amr"];
  for (const tense of tenses) {
    const cleaned: Record<string, string> = {};
    for (const [k, v] of Object.entries(forms[tense] ?? {})) {
      const t = (v ?? "").trim();
      if (t) cleaned[k] = t;
    }

    if (Object.keys(cleaned).length === 0) {
      // Aucune forme → on retire la table de ce temps si elle existait.
      const { error } = await supabase
        .from("verb_conjugations")
        .delete()
        .eq("vocab_id", vocabId)
        .eq("tense", tense);
      if (error) return { error: error.message };
      continue;
    }

    const { error } = await supabase
      .from("verb_conjugations")
      .upsert(
        { vocab_id: vocabId, student_id: realStudentId, tense, forms: cleaned },
        { onConflict: "vocab_id,tense" },
      );
    if (error) return { error: error.message };
  }

  revalidatePath(`/teacher/students/${studentId}/vocabulary/${vocabId}`);
  revalidatePath(`/teacher/students/${studentId}`);
  return { ok: true };
}
