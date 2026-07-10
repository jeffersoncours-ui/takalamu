"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordReset } from "./actions";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 13,
  border: "1.5px solid #E9E3D8",
  background: "#fff",
  padding: "12px 14px",
  fontSize: 15,
  color: "#1C1A17",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#8B857A",
  textTransform: "uppercase",
  letterSpacing: ".06em",
  marginBottom: 6,
};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {});

  if (state.success) {
    return (
      <div className="space-y-4 text-center">
        <div
          className="rounded-2xl p-4"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 14 }}
        >
          Si un compte existe avec cet email, un lien de réinitialisation vient
          d&apos;être envoyé.
        </div>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 600, color: "#0F9D6E" }}>
          ← Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p style={{ fontSize: 14, color: "#4A463F" }}>
        Indique l&apos;email de ton compte : on t&apos;enverra un lien pour
        choisir un nouveau mot de passe.
      </p>

      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
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
        <p style={{ color: "#B4292E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full font-bold text-white disabled:opacity-60"
        style={{ borderRadius: 14, background: "#0F9D6E", padding: "13px", fontSize: 15, boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
      >
        {pending ? "Envoi…" : "Envoyer le lien"}
      </button>

      <div className="text-center">
        <Link href="/login" style={{ fontSize: 13, fontWeight: 600, color: "#8B857A" }}>
          ← Retour à la connexion
        </Link>
      </div>
    </form>
  );
}
