"use client";

import { useActionState, useMemo, useState } from "react";
import { createBookingByTeacher } from "./actions";

type Student = { id: string; name: string };

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

function nowLocalValue(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function NewBookingForm({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBookingByTeacher, {});
  const [dateLocal, setDateLocal] = useState(nowLocalValue());

  const scheduledAtIso = useMemo(() => {
    const t = Date.parse(dateLocal);
    return Number.isNaN(t) ? "" : new Date(t).toISOString();
  }, [dateLocal]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-[14px] py-3 font-bold text-white w-full"
        style={{ background: "#0F9D6E", fontSize: 14, boxShadow: "0 8px 18px rgba(15,157,110,.28)" }}
      >
        + Fixer une séance
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
        Nouvelle séance
      </p>

      <select name="student_id" required style={inputStyle}>
        <option value="">— Choisir un élève —</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={dateLocal}
        onChange={(e) => setDateLocal(e.target.value)}
        style={inputStyle}
      />
      <input type="hidden" name="scheduled_at_iso" value={scheduledAtIso} />

      <input
        name="zoom_link"
        type="url"
        placeholder="https://meet.google.com/... (optionnel, ajoutable après)"
        style={inputStyle}
      />

      {state.error && (
        <p style={{ color: "#B4292E", fontSize: 13 }}>{state.error}</p>
      )}
      {state.success && (
        <p style={{ color: "#0A6B4E", fontSize: 13 }}>Séance créée.</p>
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
          disabled={pending || !students.length}
          className="flex-1 rounded-[12px] py-2.5 font-bold text-white text-sm disabled:opacity-50"
          style={{ background: "#0F9D6E" }}
        >
          {pending ? "Création…" : "Créer la séance"}
        </button>
      </div>
    </form>
  );
}
