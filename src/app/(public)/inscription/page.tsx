import type { Metadata } from "next";
import { InscriptionFunnel } from "./funnel";

export const metadata: Metadata = {
  title: "Inscription — Takalamu",
  description: "Utilise ton code d'essai pour choisir ton abonnement et créer ton compte.",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string }>;
}) {
  const { offre } = await searchParams;
  // Pré-sélection du plan depuis la carte tarif cliquée sur /offres.
  // "annuel" → formule la plus populaire (1 paiement) ; "heure" → à la carte.
  const initialPlan = offre === "heure" ? "hourly" : offre === "annuel" ? "1x" : null;
  return <InscriptionFunnel initialPlan={initialPlan} />;
}
