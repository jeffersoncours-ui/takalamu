"use client";

import { useActionState } from "react";
import { updateTeacherName } from "./actions";

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

export function NameForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(updateTeacherName, {});

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl p-4"
      style={{ background: "#fff", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
    >
      <label className="block">
        <span className="mb-1 block font-semibold" style={{ fontSize: 12, color: "#8B857A" }}>
          Nom affiché
        </span>
        <input name="full_name" type="text" defaultValue={fullName} required style={inputStyle} />
      </label>

      {state.error && <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>}
      {state.success && <p style={{ color: "#0A6B4E", fontSize: 13 }}>Enregistré.</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] py-2.5 font-bold text-white text-sm disabled:opacity-50"
        style={{ background: "#0F9D6E" }}
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
