"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type ActionState = { error?: string };
type Photo = { path: string; name: string };

function randSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Duplique une règle de grammaire vers un ou plusieurs élèves — indépendamment
 * de tout cours : un élève peut recevoir une règle isolée sans suivre le même
 * programme que les autres. La copie n'est rattachée à aucune séance
 * (`lesson_record_id: null`), la date affichée retombe alors sur sa date de
 * création. Les cibles rejoignent le `rule_group_id` de la règle source →
 * une seule carte groupée (comme pour les cours), et un élève qui l'a déjà
 * (même groupe) est bloqué côté formulaire ET revérifié ici.
 * Insertion directe (RLS `gr_teacher_all`, pas de RPC nécessaire).
 */
export async function duplicateGrammarRule(
  ruleId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const rawTargets = formData.getAll("target_ids").map((v) => String(v)).filter(Boolean);
  if (rawTargets.length === 0) return { error: "Sélectionne au moins un élève." };

  // Source (RLS garantit que c'est une règle d'un élève de l'enseignant courant)
  const { data: rule, error: ruleError } = await supabase
    .from("grammar_rules")
    .select("id, title, content, photos, student_id, rule_group_id")
    .eq("id", ruleId)
    .maybeSingle();

  if (ruleError || !rule) return { error: "Règle introuvable." };

  // Ignore les élèves qui possèdent déjà cette règle (même groupe) — évite un
  // doublon si la sélection est forgée malgré la désactivation côté UI.
  const { data: groupMembers, error: groupError } = await supabase
    .from("grammar_rules")
    .select("student_id")
    .eq("rule_group_id", rule.rule_group_id);
  if (groupError) console.error("duplicateGrammarRule groupMembers query failed:", groupError.message);
  const already = new Set((groupMembers ?? []).map((r) => r.student_id));
  already.add(rule.student_id);
  const targetIds = rawTargets.filter((id) => !already.has(id));

  if (targetIds.length === 0) {
    return { error: "Les élèves sélectionnés possèdent déjà cette règle." };
  }

  const sourcePhotos = (rule.photos as Photo[] | null) ?? [];

  for (const targetId of targetIds) {
    const copiedPhotos = (
      await Promise.all(
        sourcePhotos.map(async (p) => {
          const base = p.path.split("/").pop() ?? "photo.jpg";
          const dest = `${targetId}/${randSuffix()}_${base}`;
          const { error: copyErr } = await supabase.storage.from("grammar-photos").copy(p.path, dest);
          if (copyErr) {
            console.error("copy grammar photo", copyErr.message);
            return null;
          }
          return { path: dest, name: p.name };
        })
      )
    ).filter((f): f is Photo => f !== null);

    const { error: insertError } = await supabase.from("grammar_rules").insert({
      student_id: targetId,
      title: rule.title,
      content: rule.content,
      lesson_record_id: null,
      photos: copiedPhotos,
      rule_group_id: rule.rule_group_id,
    });

    if (insertError) {
      return { error: "Échec de la duplication pour un des élèves sélectionnés." };
    }
  }

  const { data: grammarBook } = await supabase
    .from("course_books")
    .select("id")
    .eq("kind", "grammar")
    .maybeSingle();

  const backTo = grammarBook ? `/teacher/books/${grammarBook.id}` : "/teacher/books";
  revalidatePath(backTo);
  redirect(`${backTo}?dup=${targetIds.length}`);
}
