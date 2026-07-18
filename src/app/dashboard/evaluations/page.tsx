import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MenuCardLink } from "@/components/menu-card-link";
import { ensureConjugations, getUnlockedTenses } from "./actions";

/**
 * Landing Évaluations : deux tuiles — Quiz de langue (toujours visible, l'écran
 * cible gère le cas "pas assez de contenu") et Quiz de conjugaison (masquée
 * tant qu'aucun temps n'est débloqué : voir getUnlockedTenses).
 */
export default async function EvaluationsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  // Auto-génère les conjugaisons manquantes des verbes du vocabulaire avant de
  // décider si la tuile conjugaison est disponible (idempotent, n'écrase rien).
  await ensureConjugations();

  const unlockedTenses = await getUnlockedTenses();

  let showConjugationTile = false;
  if (unlockedTenses.length > 0) {
    const { count } = await supabase
      .from("verb_conjugations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId)
      .in("tense", unlockedTenses);
    showConjugationTile = (count ?? 0) > 0;
  }

  return (
    <div className="space-y-6">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Évaluations
      </h1>

      <div className="space-y-2">
        <MenuCardLink
          href="/dashboard/evaluations/langue"
          label="Quiz de langue"
          desc="Vocabulaire et expressions"
          color="#0F9D6E"
          bg="#ECFAF4"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
        {showConjugationTile && (
          <MenuCardLink
            href="/dashboard/evaluations/conjugaison"
            label="Quiz de conjugaison"
            desc="Passé, présent, impératif"
            color="#3E63DD"
            bg="#EAEFFD"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                <polyline points="21 3 21 9 15 9" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
}
