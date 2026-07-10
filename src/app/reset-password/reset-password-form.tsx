"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { changePassword } from "@/lib/actions/change-password";

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

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const t = setTimeout(() => router.push("/"), 1200);
      return () => clearTimeout(t);
    }
  }, [state.success, router]);

  if (state.success) {
    return (
      <div
        className="rounded-2xl p-4 text-center"
        style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 14 }}
      >
        Mot de passe mis à jour. Redirection…
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p style={{ fontSize: 14, color: "#4A463F" }}>Choisis ton nouveau mot de passe.</p>

      <div>
        <label htmlFor="new_password" style={labelStyle}>Nouveau mot de passe</label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          placeholder="8 caractères min."
          required
          minLength={8}
          autoComplete="new-password"
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="confirm_password" style={labelStyle}>Confirmer</label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
