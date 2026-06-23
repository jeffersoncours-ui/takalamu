"use client";

import { useActionState } from "react";
import { correctHomework } from "./actions";

export function HwCorrectionForm({ homeworkId }: { homeworkId: string }) {
  const boundAction = correctHomework.bind(null, homeworkId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">
          Retour (feedback)
        </label>
        <textarea
          name="feedback"
          rows={2}
          placeholder="Commentaire sur le rendu…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-none"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-600">
          Copie corrigée (optionnel)
        </label>
        <input
          name="correction_file"
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
          className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-medium file:cursor-pointer"
        />
      </div>

      <div className="flex items-end gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Note (optionnel)
          </label>
          <input
            name="grade"
            type="text"
            placeholder="ex. 16/20"
            className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {pending ? "Envoi…" : "Marquer corrigé"}
        </button>
      </div>
    </form>
  );
}
