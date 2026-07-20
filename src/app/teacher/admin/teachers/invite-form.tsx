"use client";

import { useActionState, useRef, useEffect } from "react";

import { inviteTeacher } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 13,
  border: "1.5px solid var(--tk-parchment-border)",
  background: "var(--tk-parchment-field)",
  padding: "11px 14px",
  fontSize: 14,
  color: "var(--tk-ink-text)",
  outline: "none",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--tk-muted-olive)",
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

export function InviteTeacherForm() {
  const [state, formAction, pending] = useActionState(inviteTeacher, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Réinitialiser le formulaire après un succès.
  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-[18px] p-5"
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 10px 22px -16px rgba(10,20,15,.4)" }}
    >
      <div className="space-y-1.5">
        <label htmlFor="full_name" style={sectionLabel}>Nom complet</label>
        <input id="full_name" name="full_name" type="text" placeholder="ex. Khadija Benali" style={inputStyle} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" style={sectionLabel}>E-mail</label>
        <input id="email" name="email" type="email" placeholder="enseignant@exemple.com" style={inputStyle} />
      </div>

      <div className="space-y-1.5">
        <span style={sectionLabel}>Enseigne aux élèves</span>
        <div className="grid grid-cols-2 gap-2">
          <label
            className="flex cursor-pointer items-center gap-2 rounded-[13px] px-3 py-3 font-semibold"
            style={{ border: "1.5px solid var(--tk-parchment-border)", background: "var(--tk-parchment-field)", color: "var(--tk-ink-text-soft)", fontSize: 13 }}
          >
            <input type="radio" name="gender" value="m" style={{ accentColor: "var(--tk-emerald-btn-from)" }} />
            Hommes
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-[13px] px-3 py-3 font-semibold"
            style={{ border: "1.5px solid var(--tk-parchment-border)", background: "var(--tk-parchment-field)", color: "var(--tk-ink-text-soft)", fontSize: 13 }}
          >
            <input type="radio" name="gender" value="f" style={{ accentColor: "var(--tk-emerald-btn-from)" }} />
            Femmes
          </label>
        </div>
      </div>

      {state.error && (
        <p style={{ color: "var(--tk-danger)", fontSize: 13 }} role="alert">{state.error}</p>
      )}
      {state.success && (
        <p
          className="rounded-[12px] px-3 py-2"
          style={{ background: "rgba(12,107,78,.10)", border: "1px solid rgba(12,107,78,.28)", color: "var(--tk-green-active)", fontSize: 13 }}
        >
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] font-bold disabled:opacity-60"
        style={{
          background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
          color: "var(--tk-ink-screen)",
          fontSize: 15,
          boxShadow: "var(--tk-shadow-cta)",
        }}
      >
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </button>
    </form>
  );
}
