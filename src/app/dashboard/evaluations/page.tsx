import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EvalHeroCard } from "./eval-hero-card";
import { ensureConjugations, getUnlockedTenses } from "./actions";
import type { Tense } from "@/lib/conjugation";

const TENSE_SHORT_LABEL: Record<Tense, string> = {
  madi: "Passé",
  mudari: "Présent",
  amr: "Impératif",
};

function tenseBadge(tenses: Tense[]): string {
  const names = tenses.map((t) => TENSE_SHORT_LABEL[t]);
  return names.length === 1 ? `${names[0]} débloqué` : `${names.join(", ")} débloqués`;
}

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

  const [unlockedTenses, vocabRes, formsRes] = await Promise.all([
    getUnlockedTenses(),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("formulations").select("id", { count: "exact", head: true }).eq("student_id", studentId),
  ]);
  const languageCount = (vocabRes.count ?? 0) + (formsRes.count ?? 0);

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
    <div className="-mx-4 -mt-5">
      <div
        className="hachure-ink px-[22px] pb-7 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 32, color: "var(--tk-cream-text)" }}
        >
          Évaluations
        </h1>
      </div>

      <div className="px-[22px] pt-6 pb-2 space-y-[15px]">
        <EvalHeroCard
          href="/dashboard/evaluations/langue"
          title="Quiz de langue"
          subtitle="Vocabulaire et expressions"
          badge={`${languageCount} élément${languageCount > 1 ? "s" : ""}`}
          variant="green"
          letter="ل"
          icon={
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          }
        />
        {showConjugationTile && (
          <EvalHeroCard
            href="/dashboard/evaluations/conjugaison"
            title="Quiz de conjugaison"
            subtitle="Passé, présent, impératif"
            badge={tenseBadge(unlockedTenses)}
            variant="cream"
            letter="ف"
            icon={
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
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
