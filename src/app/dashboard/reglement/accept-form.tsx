"use client";

import { useActionState, useState } from "react";
import { acceptHouseRules } from "./actions";

type ActionState = { error?: string };

export function AcceptForm() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(acceptHouseRules, {});
  const [checked, setChecked] = useState(false);

  return (
    <form action={formAction} className="space-y-3">
      <label
        className="flex items-center gap-3 rounded-2xl p-4 cursor-pointer"
        style={{ background: "var(--tk-parchment-card)", border: "1.5px solid var(--tk-parchment-border)" }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          style={{ width: 20, height: 20, accentColor: "var(--tk-emerald-btn-from)" }}
        />
        <span style={{ color: "var(--tk-ink-text)", fontSize: 14, fontWeight: 600 }}>
          J&apos;ai pris connaissance du règlement intérieur et je m&apos;engage à le respecter.
        </span>
      </label>

      {state?.error ? (
        <p style={{ color: "var(--tk-danger)", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!checked || pending}
        className="w-full rounded-2xl py-4 font-semibold text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)" }}
      >
        {pending ? "Validation…" : "Valider le règlement"}
      </button>
    </form>
  );
}
