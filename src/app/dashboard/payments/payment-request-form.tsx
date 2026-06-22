"use client";

import { useActionState } from "react";
import { requestPayment } from "./actions";

export function PaymentRequestForm() {
  const [state, formAction, pending] = useActionState(requestPayment, {});

  if (state.success) {
    return (
      <div className="rounded-lg bg-emerald-100 px-4 py-3 text-sm text-emerald-800">
        Demande envoyée. Contacte ton enseignant pour finaliser le paiement via Revolut.
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      <select
        name="plan"
        required
        defaultValue=""
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
      >
        <option value="" disabled>
          Choisir un plan…
        </option>
        <option value="1x">Paiement unique</option>
        <option value="2x">2 versements</option>
        <option value="3x">3 versements (réduction)</option>
        <option value="12x">12× mensuel</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
      >
        {pending ? "Envoi…" : "Demander"}
      </button>
    </form>
  );
}
