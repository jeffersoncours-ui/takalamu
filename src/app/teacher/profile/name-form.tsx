"use client";

import { useActionState } from "react";
import { updateTeacherName } from "./actions";
import { fieldStyles } from "@/components/ui/field";

const inputStyle = fieldStyles("parchment").input;

export function NameForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(updateTeacherName, {});

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl p-4"
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
    >
      <label className="block">
        <span className="mb-1 block font-semibold" style={{ fontSize: 12, color: "var(--tk-muted-olive)" }}>
          Nom affiché
        </span>
        <input name="full_name" type="text" defaultValue={fullName} required style={inputStyle} />
      </label>

      {state.error && <p style={{ color: "var(--tk-danger)", fontSize: 13 }}>{state.error}</p>}
      {state.success && <p style={{ color: "var(--tk-green-active)", fontSize: 13 }}>Enregistré.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] py-2.5 font-bold text-sm disabled:opacity-50"
        style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)" }}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
