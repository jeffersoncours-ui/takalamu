"use client";

import { useActionState } from "react";

import { signIn } from "./actions";

const initialState: { error?: string } = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

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
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
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
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
