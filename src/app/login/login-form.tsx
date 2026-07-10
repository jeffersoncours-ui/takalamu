"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { signIn } from "./actions";

const initialState: { error?: string } = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <form action={formAction} className="space-y-4">
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
            style={{ color: "#8B857A" }}
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>

      <div className="text-center pt-1">
        <Link href="/login/forgot-password" style={{ fontSize: 13, fontWeight: 600, color: "#0F9D6E" }}>
          Mot de passe oublié ?
        </Link>
      </div>
    </form>
  );
}
