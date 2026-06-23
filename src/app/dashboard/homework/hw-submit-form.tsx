"use client";

import { useActionState, useRef, useState } from "react";
import { submitHomework } from "./actions";

const GREEN = "#0F9D6E";

export function HwSubmitForm({ homeworkId }: { homeworkId: string }) {
  const boundAction = submitHomework.bind(null, homeworkId);
  const [state, formAction, pending] = useActionState(boundAction, {});
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={formAction}
      className="mt-3 pt-3"
      style={{ borderTop: "1px solid #F4F0E8" }}
    >
      {state.error && (
        <p className="mb-2 text-xs font-medium" style={{ color: "#B4292E" }}>
          {state.error}
        </p>
      )}

      <p className="font-semibold mb-2" style={{ color: "#1C1A17", fontSize: 13 }}>
        Rendre mon devoir
      </p>

      <label
        className="flex items-center gap-2 rounded-[12px] px-3 py-3 cursor-pointer transition-opacity hover:opacity-80"
        style={{ background: "#F7F4EE", border: "1px dashed #D8D2C6" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        <span className="text-sm" style={{ color: fileName ? "#1C1A17" : "#8B857A" }}>
          {fileName ?? "Prendre / choisir une photo"}
        </span>
        <input
          ref={inputRef}
          name="submission_file"
          type="file"
          accept="image/*,.pdf"
          capture="environment"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
        />
      </label>

      <button
        type="submit"
        disabled={pending || !fileName}
        className="mt-2.5 w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: GREEN }}
      >
        {pending ? "Envoi…" : "Envoyer mon devoir"}
      </button>
    </form>
  );
}
