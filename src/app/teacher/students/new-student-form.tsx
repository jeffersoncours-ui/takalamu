"use client";

import { useActionState, useState } from "react";
import { createStudentManually } from "./actions";
import { fieldStyles } from "@/components/ui/field";

const inputStyle = fieldStyles("parchment").input;

type Teacher = { id: string; name: string };

export function NewStudentForm({ teachers }: { teachers?: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createStudentManually, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[13px] font-bold w-full"
        style={{
          height: 46,
          background: "rgba(14,74,56,.1)",
          border: "1px dashed rgba(14,74,56,.4)",
          color: "var(--tk-ink-hero-to)",
          fontSize: 14,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-hero-to)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Nouvel élève
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[18px] p-4"
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
    >
      <p className="font-bold" style={{ color: "var(--tk-ink-text)", fontSize: 15 }}>
        Nouvel élève
      </p>

      <div className="grid grid-cols-2 gap-2">
        <input name="first_name" type="text" placeholder="Prénom" required style={inputStyle} />
        <input name="last_name" type="text" placeholder="Nom" required style={inputStyle} />
      </div>

      <input name="email" type="email" placeholder="Email" required style={inputStyle} />

      <select name="gender" required defaultValue="" style={inputStyle}>
        <option value="" disabled>Genre…</option>
        <option value="m">Homme</option>
        <option value="f">Femme</option>
      </select>

      {teachers && teachers.length > 0 && (
        <select name="teacher_id" defaultValue="" style={inputStyle}>
          <option value="">Enseignant : moi-même</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}

      {state.error && (
        <p style={{ color: "var(--tk-danger)", fontSize: 13 }}>{state.error}</p>
      )}
      {state.success && (
        <p style={{ color: "var(--tk-green-active)", fontSize: 13 }}>{state.success}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-none rounded-[12px] px-4 py-2.5 text-sm font-semibold border"
          style={{ borderColor: "var(--tk-parchment-border-alt)", color: "var(--tk-ink-text-soft)" }}
        >
          Fermer
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[12px] py-2.5 font-bold text-sm disabled:opacity-60"
          style={{ background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-hero-to)" }}
        >
          {pending ? "Envoi…" : "Créer et inviter"}
        </button>
      </div>
    </form>
  );
}
