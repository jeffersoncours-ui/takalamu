"use client";

import { useActionState } from "react";
import { requestPayment } from "./actions";
import { ANNUAL_PLANS, HOURLY_PRICE_EUROS } from "@/lib/pricing";

export function PaymentRequestForm() {
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

  return (
    <form action={formAction} className="flex flex-col gap-3">
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
        <optgroup label="Abonnement annuel (48 séances)">
          {ANNUAL_PLANS.map((plan) => (
            <option key={plan.key} value={plan.key}>
              Annuel {plan.label} — {plan.installmentAmount} €
              {plan.installments > 1 ? ` × ${plan.installments}` : ""} ({plan.total} €)
            </option>
          ))}
        </optgroup>
        <optgroup label="À la carte">
          <option value="hourly">1 heure — {HOURLY_PRICE_EUROS} € (sans engagement)</option>
        </optgroup>
      </select>

      <button
        type="submit"
        disabled={pending}
        className="font-bold text-white disabled:opacity-50"
        style={{ height: 46, borderRadius: 13, background: "#0F9D6E", fontSize: 14, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
      >
        {pending ? "Envoi…" : "Demander"}
      </button>

      <p style={{ fontSize: 12, color: "#8B857A", textAlign: "center" }}>
        Cours d&apos;essai gratuit · sans engagement
      </p>
    </form>
  );
}
