"use client";

import { useActionState } from "react";
import { correctHomework } from "./actions";

export function HwCorrectionForm({ homeworkId }: { homeworkId: string }) {
  const boundAction = correctHomework.bind(null, homeworkId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  const fieldStyle: React.CSSProperties = {
    background: "var(--tk-parchment-field)",
    border: "1px solid var(--tk-parchment-border)",
    color: "var(--tk-ink-text)",
    borderRadius: 10,
    outline: "none",
  };

  return (
    <form action={formAction} className="space-y-2.5" style={{ borderTop: "1px solid #EEE4CC", paddingTop: 13 }}>
      {state.error && (
        <p className="text-xs" style={{ color: "var(--tk-danger)" }}>{state.error}</p>
      )}

      <textarea
        name="feedback"
        rows={2}
        placeholder="Ton retour à l'élève…"
        className="w-full px-3 py-2.5 text-sm placeholder:text-[color:var(--tk-faint-olive)] resize-none"
        style={fieldStyle}
      />

      <label className="block text-xs" style={{ color: "var(--tk-muted-olive)" }}>
        Copie corrigée (optionnel)
        <input
          name="correction_file"
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="mt-1 block w-full text-xs file:mr-2 file:rounded-[8px] file:border-0 file:px-2.5 file:py-1 file:font-semibold file:cursor-pointer"
        />
      </label>

      <div className="flex gap-2.5">
        <input
          name="grade"
          type="text"
          placeholder="Note (ex. 16/20)"
          className="flex-1 px-3 text-sm placeholder:text-[color:var(--tk-faint-olive)]"
          style={{ ...fieldStyle, height: 44 }}
        />

        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-[10px] px-4 font-bold text-sm disabled:opacity-60"
          style={{ background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))", color: "var(--tk-cream-text)" }}
        >
          {pending ? "Envoi…" : "Marquer corrigé"}
        </button>
      </div>
    </form>
  );
}
