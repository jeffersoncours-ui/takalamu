"use client";

import { useActionState } from "react";
import { upsertProfileNote } from "../actions";

export function ProfileNoteForm({
  studentId,
  initialContent,
}: {
  studentId: string;
  initialContent: string;
}) {
  const boundAction = upsertProfileNote.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <p className="text-sm font-medium text-amber-900">Note privée (épinglée)</p>

      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}

      <form action={formAction} className="space-y-2">
        <textarea
          name="content"
          defaultValue={initialContent}
          rows={3}
          placeholder="Note de profil (invisible pour l'élève)…"
          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition"
        >
          {pending ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
