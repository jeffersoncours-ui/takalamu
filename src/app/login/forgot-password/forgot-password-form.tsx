"use client";

import { useActionState } from "react";
import Link from "next/link";

import { fieldStyles } from "@/components/ui/field";
import { GoldButton } from "@/components/ui/gold-button";

import { requestPasswordReset } from "./actions";

const { label: labelStyle, input: inputStyle } = fieldStyles("ink");

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(12,107,78,.14)", border: "1px solid rgba(12,107,78,.35)", color: "var(--tk-sage-bright)", fontSize: 14 }}
        >
          Si un compte existe avec cet email, un lien de réinitialisation vient
          d&apos;être envoyé.
        </div>
        <Link href="/login" style={{ fontSize: 14, color: "var(--tk-gold-light)" }}>
          ← Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p style={{ fontSize: 14, color: "var(--tk-sage)" }}>
        Indique l&apos;email de ton compte : on t&apos;enverra un lien pour
        choisir un nouveau mot de passe.
      </p>

      <div>
        <label htmlFor="email" style={labelStyle}>Adresse e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          style={inputStyle}
        />
      </div>

      {state?.error ? (
        <p style={{ color: "#E7A99E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <GoldButton type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer le lien"}
      </GoldButton>

      <div className="text-center">
        <Link href="/login" style={{ fontSize: 13, color: "var(--tk-sage)" }}>
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
