"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { fieldStyles } from "@/components/ui/field";
import { GoldButton } from "@/components/ui/gold-button";

import { signIn } from "./actions";

const initialState: { error?: string } = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const { label: labelStyle, input: inputStyle } = fieldStyles("ink");

  return (
    <form action={formAction} className="space-y-5">
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

      <div>
        <label htmlFor="password" style={labelStyle}>Mot de passe</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            style={{ ...inputStyle, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex items-center px-3"
            style={{ color: "var(--tk-sage)" }}
          >
            {showPassword ? (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {state?.error ? (
        <p style={{ color: "#E7A99E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <GoldButton type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </GoldButton>

      <div className="text-center pt-1">
        <Link href="/login/forgot-password" style={{ fontSize: 14, color: "var(--tk-sage)" }}>
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
