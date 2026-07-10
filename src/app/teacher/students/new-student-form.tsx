"use client";

import { useActionState, useState } from "react";
import { createStudentManually } from "./actions";

type Teacher = { id: string; name: string };

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

export function NewStudentForm({ teachers }: { teachers?: Teacher[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createStudentManually, {});

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[14px] py-3 font-bold text-white w-full"
        style={{ background: "#0F9D6E", fontSize: 14, boxShadow: "0 8px 18px rgba(15,157,110,.28)" }}
      >
        + Nouvel élève
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-[18px] p-4"
      style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
    >
      <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>
        Nouvel élève
      </p>

      <div className="grid grid-cols-2 gap-2">
        <input name="first_name" type="text" placeholder="Prénom" required style={inputStyle} />
        <input name="last_name" type="text" placeholder="Nom" required style={inputStyle} />
      </div>

      <input name="email" type="email" placeholder="Email" required style={inputStyle} />

      <select name="gender" required defaultValue="" style={inputStyle}>
        <option value="" disabled>Genre…</option>
        <option value="m">Homme</option>
        <option value="f">Femme</option>
      </select>

      {teachers && teachers.length > 0 && (
        <select name="teacher_id" defaultValue="" style={inputStyle}>
          <option value="">Enseignant : moi-même</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      )}

      {state.error && (
        <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>
      )}
      {state.success && (
        <p style={{ color: "#0A6B4E", fontSize: 13 }}>{state.success}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-none rounded-[12px] px-4 py-2.5 text-sm font-semibold border"
          style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
        >
          Fermer
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-[12px] py-2.5 font-bold text-white text-sm disabled:opacity-50"
          style={{ background: "#0F9D6E" }}
        >
          {pending ? "Envoi…" : "Créer et inviter"}
        </button>
      </div>
    </form>
  );
}
