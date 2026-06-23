"use client";

import { useActionState, useRef, useEffect } from "react";

import { inviteTeacher } from "./actions";

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

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#8B857A",
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
      style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
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
            style={{ border: "1.5px solid #E9E3D8", background: "#FBF9F5", color: "#4A463F", fontSize: 13 }}
          >
            <input type="radio" name="gender" value="m" className="accent-emerald-600" />
            Hommes
          </label>
          <label
            className="flex cursor-pointer items-center gap-2 rounded-[13px] px-3 py-3 font-semibold"
            style={{ border: "1.5px solid #E9E3D8", background: "#FBF9F5", color: "#4A463F", fontSize: 13 }}
          >
            <input type="radio" name="gender" value="f" className="accent-emerald-600" />
            Femmes
          </label>
        </div>
      </div>

      {state.error && (
        <p style={{ color: "#B4292E", fontSize: 13 }} role="alert">{state.error}</p>
      )}
      {state.success && (
        <p
          className="rounded-[12px] px-3 py-2"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 13 }}
        >
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[14px] font-bold text-white disabled:opacity-60"
        style={{ background: "#0F9D6E", fontSize: 15, boxShadow: "0 10px 22px rgba(15,157,110,.30)" }}
      >
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </button>
    </form>
  );
}
