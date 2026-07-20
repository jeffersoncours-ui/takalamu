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
    <div
      className="rounded-[14px] p-[13px_15px] space-y-2.5"
      style={{ background: "rgba(184,120,42,.09)", border: "1px solid rgba(184,120,42,.32)" }}
    >
      <div className="flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-darker)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="font-bold uppercase" style={{ fontSize: 10.5, letterSpacing: ".14em", color: "var(--tk-gold-darker)" }}>
          Note privée
        </p>
      </div>

      {state.error && (
        <p className="text-xs" style={{ color: "var(--tk-danger)" }}>{state.error}</p>
      )}

      <form action={formAction} className="space-y-2">
        <textarea
          name="content"
          defaultValue={initialContent}
          rows={3}
          placeholder="Note de profil (invisible pour l'élève)…"
          className="w-full rounded-[10px] px-3 py-2 text-sm outline-none resize-none"
          style={{ border: "1px solid rgba(184,120,42,.4)", background: "#fff", color: "#7A5714" }}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] px-4 py-1.5 text-sm font-semibold disabled:opacity-50 transition"
          style={{ background: "var(--tk-gold-darker)", color: "#fff" }}
        >
          {pending ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </form>
    </div>
  );
}
