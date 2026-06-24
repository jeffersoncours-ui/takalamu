// Source of truth for all plan pricing (in euros and cents)
// Trial: 10€, deducted from first month's payment

export const TRIAL_PRICE_EUROS = 10;
export const TRIAL_PRICE_CENTS = 1000;

// Monthly standalone (no commitment)
export const MONTHLY_PRICE_EUROS = 60;
export const MONTHLY_PRICE_CENTS = 6000;

// Annual plans (paid in 1 / 2 / 3 installments)
// Total annual = 660€ (55€/mo × 12)
export const ANNUAL_TOTAL_CENTS = 66000;

export type PlanKey = "monthly" | "1x" | "2x" | "3x";

export interface Plan {
  key: PlanKey;
  label: string;
  pricePerMonth: number; // display only, euros
  total: number;         // what the student actually pays (per installment × nb installments), euros
  installments: number;
  installmentAmount: number; // euros per payment
  savings?: number;          // euros saved vs monthly over 12 months
}

// 12 months at 60€ = 720€. Annual plans save vs that.
const MONTHLY_ANNUAL_EQUIV = MONTHLY_PRICE_EUROS * 12; // 720€

export const PLANS: Plan[] = [
  {
    key: "monthly",
    label: "Mensuel",
    pricePerMonth: 60,
    total: 60,
    installments: 1,
    installmentAmount: 60,
  },
  {
    key: "1x",
    label: "Annuel — 1 paiement",
    pricePerMonth: 55,
    total: 660,
    installments: 1,
    installmentAmount: 660,
    savings: MONTHLY_ANNUAL_EQUIV - 660, // 60
  },
  {
    key: "2x",
    label: "Annuel — 2 paiements",
    pricePerMonth: 55,
    total: 660,
    installments: 2,
    installmentAmount: 330,
    savings: MONTHLY_ANNUAL_EQUIV - 660, // 60
  },
  {
    key: "3x",
    label: "Annuel — 3 paiements",
    pricePerMonth: 55,
    total: 660,
    installments: 3,
    installmentAmount: 220,
    savings: MONTHLY_ANNUAL_EQUIV - 660, // 60
  },
];

export function getPlan(key: PlanKey): Plan {
  const plan = PLANS.find((p) => p.key === key);
  if (!plan) throw new Error(`Unknown plan: ${key}`);
  return plan;
}

// Amount of first installment after trial credit deduction (cents)
export function firstInstallmentCents(plan: Plan, trialCreditCents: number): number {
  const installmentCents = Math.round((plan.installmentAmount / plan.total) * plan.total * 100);
  return Math.max(0, installmentCents - trialCreditCents);
}
