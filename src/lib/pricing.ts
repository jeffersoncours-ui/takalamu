// Source de vérité unique des prix (euros + cents). Session 16.
// Deux produits seulement :
//   1. Abonnement annuel — 4 séances de 1 h/mois (48 h/an), payé en 1 / 2 / 3 / 12 fois (dégressif).
//   2. Heure à la carte — 15 €, sans engagement.
// L'essai est GRATUIT et obligatoire avant tout paiement.

// ── Heure à la carte ─────────────────────────────────────────────────────────
export const HOURLY_PRICE_EUROS = 15;
export const HOURLY_PRICE_CENTS = 1500;

// ── Volume de séances ────────────────────────────────────────────────────────
export const SESSIONS_PER_MONTH = 4; // 1 h/semaine
export const SESSIONS_PER_YEAR = 48; // quota de l'abonnement annuel

// Référence : payer 48 séances à l'unité = 720 €. Les formules annuelles sont moins chères.
export const PAYG_YEAR_EQUIV_EUROS = HOURLY_PRICE_EUROS * SESSIONS_PER_YEAR; // 720 €

// ── Abonnement annuel (dégressif : moins de versements = moins cher) ──────────
export type AnnualPlanKey = "1x" | "2x" | "3x" | "12x";
export type PlanKey = AnnualPlanKey | "hourly";

export interface AnnualPlan {
  key: AnnualPlanKey;
  label: string; // « 1 paiement », « 2 paiements », …
  total: number; // total payé sur l'année (euros)
  installments: number;
  installmentAmount: number; // euros par versement
  pricePerMonth: number; // affichage = total / 12
  savings: number; // euros économisés vs 48 × 15 €
}

export const ANNUAL_PLANS: AnnualPlan[] = [
  { key: "1x",  label: "1 paiement",   total: 624, installments: 1,  installmentAmount: 624, pricePerMonth: 52, savings: PAYG_YEAR_EQUIV_EUROS - 624 },
  { key: "2x",  label: "2 paiements",  total: 648, installments: 2,  installmentAmount: 324, pricePerMonth: 54, savings: PAYG_YEAR_EQUIV_EUROS - 648 },
  { key: "3x",  label: "3 paiements",  total: 672, installments: 3,  installmentAmount: 224, pricePerMonth: 56, savings: PAYG_YEAR_EQUIV_EUROS - 672 },
  { key: "12x", label: "12 paiements", total: 696, installments: 12, installmentAmount: 58,  pricePerMonth: 58, savings: PAYG_YEAR_EQUIV_EUROS - 696 },
];

export function getAnnualPlan(key: AnnualPlanKey): AnnualPlan {
  const plan = ANNUAL_PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown annual plan: ${key}`);
  return plan;
}

export function isAnnualPlanKey(key: string): key is AnnualPlanKey {
  return ANNUAL_PLANS.some((p) => p.key === key);
}

// Montant (cents) du 1er versement à débiter pour un plan annuel.
export function installmentCents(key: AnnualPlanKey): number {
  return Math.round(getAnnualPlan(key).installmentAmount * 100);
}
