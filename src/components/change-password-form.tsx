"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/lib/actions/change-password";
import { fieldStyles } from "@/components/ui/field";

const inputStyle = fieldStyles("parchment").input;

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(changePassword, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
      >
        <span
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: "rgba(46,90,138,.12)", color: "var(--tk-info)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-sm" style={{ color: "var(--tk-ink-text)" }}>Changer mon mot de passe</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--tk-muted-olive)" }}>Sécurité du compte</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    );
  }

  if (state.success) {
    return (
      <div
        className="rounded-2xl p-4"
        style={{ background: "rgba(12,107,78,.10)", border: "1px solid rgba(12,107,78,.28)", color: "var(--tk-green-active)", fontSize: 13 }}
      >
        Mot de passe mis à jour.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl p-4"
      style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
    >
      <p className="font-semibold text-sm" style={{ color: "var(--tk-ink-text)" }}>
        Changer mon mot de passe
      </p>

      <input
        name="new_password"
        type="password"
        placeholder="Nouveau mot de passe (8 caractères min.)"
        required
        minLength={8}
        autoComplete="new-password"
        style={inputStyle}
      />
      <input
        name="confirm_password"
        type="password"
        placeholder="Confirmer le mot de passe"
        required
        minLength={8}
        autoComplete="new-password"
        style={inputStyle}
      />

      {state.error && (
        <p style={{ color: "var(--tk-danger)", fontSize: 13 }}>{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-none rounded-[12px] px-4 py-2.5 text-sm font-semibold border"
          style={{ borderColor: "var(--tk-parchment-border-alt)", color: "var(--tk-ink-text-soft)" }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[12px] py-2.5 font-bold text-sm disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
            color: "var(--tk-ink-hero-to)",
          }}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
