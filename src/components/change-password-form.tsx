"use client";

import { useActionState, useState } from "react";
import { changePassword } from "@/lib/actions/change-password";

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 13,
  border: "1.5px solid #E9E3D8",
  background: "#fff",
  padding: "11px 14px",
  fontSize: 14,
  color: "#1C1A17",
  outline: "none",
};

export function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(changePassword, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-4 bg-white rounded-2xl px-4 py-4 transition-opacity hover:opacity-80"
        style={{ boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
      >
        <span
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 44, height: 44, background: "#EAEFFD", color: "#3E63DD" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-sm" style={{ color: "#1C1A17" }}>Changer mon mot de passe</p>
          <p className="text-xs mt-0.5" style={{ color: "#8B857A" }}>Sécurité du compte</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    );
  }

  if (state.success) {
    return (
      <div
        className="rounded-2xl p-4"
        style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
      >
        Mot de passe mis à jour.
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl p-4"
      style={{ background: "#fff", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
    >
      <p className="font-semibold text-sm" style={{ color: "#1C1A17" }}>
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
        <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-none rounded-[12px] px-4 py-2.5 text-sm font-semibold border"
          style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[12px] py-2.5 font-bold text-white text-sm disabled:opacity-50"
          style={{ background: "#0F9D6E" }}
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
