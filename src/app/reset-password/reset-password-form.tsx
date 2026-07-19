"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { changePassword } from "@/lib/actions/change-password";
import { fieldStyles } from "@/components/ui/field";
import { GoldButton } from "@/components/ui/gold-button";

const { label: labelStyle, input: inputStyle } = fieldStyles("ink");

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
        style={{ background: "rgba(12,107,78,.14)", border: "1px solid rgba(12,107,78,.35)", color: "var(--tk-sage-bright)", fontSize: 14 }}
      >
        Mot de passe mis à jour. Redirection…
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <p style={{ fontSize: 14, color: "var(--tk-sage)" }}>Choisis ton nouveau mot de passe.</p>

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
        <p style={{ color: "#E7A99E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <GoldButton type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </GoldButton>
    </form>
  );
}
