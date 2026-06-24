"use client";

import { useActionState } from "react";
import { requestPayment } from "./actions";
import { PLANS, MONTHLY_PRICE_EUROS, TRIAL_PRICE_EUROS } from "@/lib/pricing";

type Props = { trialCreditCents: number };

export function PaymentRequestForm({ trialCreditCents }: Props) {
  const [state, formAction, pending] = useActionState(requestPayment, {});

  if (state.success) {
    return (
      <div
        className="rounded-[14px] px-4 py-3"
        style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
      >
        Demande envoyée. Contacte ton enseignant pour finaliser le paiement via Revolut.
      </div>
    );
  }

  const hasCredit = trialCreditCents > 0;
  const creditEuros = trialCreditCents / 100;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {hasCredit && (
        <div
          className="rounded-[14px] px-4 py-3 text-sm"
          style={{ background: "#E8F7F1", border: "1px solid #C8EBDB", color: "#065F46" }}
        >
          ✓ Crédit essai de {creditEuros} € déduit de ton premier paiement.
        </div>
      )}

      {state.error && <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>}

      <select
        name="plan"
        required
        defaultValue=""
        className="outline-none"
        style={{
          height: 46,
          borderRadius: 13,
          border: "1.5px solid #E9E3D8",
          background: "#fff",
          padding: "0 14px",
          fontSize: 14,
          color: "#1C1A17",
        }}
      >
        <option value="" disabled>
          Choisir un plan…
        </option>
        <option value="monthly">
          Mensuel — {MONTHLY_PRICE_EUROS} €/mois (sans engagement)
        </option>
        {PLANS.filter((p) => p.key !== "monthly").map((plan) => (
          <option key={plan.key} value={plan.key}>
            Annuel {plan.installments}× — {plan.installmentAmount} €{plan.installments > 1 ? ` × ${plan.installments}` : ""}{" "}
            ({plan.pricePerMonth} €/mois)
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={pending}
        className="font-bold text-white disabled:opacity-50"
        style={{ height: 46, borderRadius: 13, background: "#0F9D6E", fontSize: 14, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
      >
        {pending ? "Envoi…" : "Demander un abonnement"}
      </button>

      <p style={{ fontSize: 12, color: "#8B857A", textAlign: "center" }}>
        Cours d&apos;essai {TRIAL_PRICE_EUROS} € · déduit du premier paiement
      </p>
    </form>
  );
}
