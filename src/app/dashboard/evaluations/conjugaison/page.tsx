import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { ensureConjugations, getUnlockedTenses } from "../actions";
import { ConjugaisonClient } from "./conjugaison-client";

export default async function ConjugaisonQuizPage() {
  await requireStudent();

  // Idempotent — au cas où cette page est ouverte directement (sans passer par
  // la tuile d'accueil qui l'appelle déjà).
  await ensureConjugations();
  const unlockedTenses = await getUnlockedTenses();

  // Filet de sécurité : si aucun temps n'est débloqué, la tuile d'accueil ne
  // mène jamais ici — mais un accès direct par URL doit rester sans danger.
  if (unlockedTenses.length === 0) redirect("/dashboard/evaluations");

  return <ConjugaisonClient unlockedTenses={unlockedTenses} />;
}
