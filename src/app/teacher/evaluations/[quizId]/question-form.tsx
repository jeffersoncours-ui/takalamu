"use client";

import { useActionState } from "react";
import { addQuestion } from "../actions";

const FIELDS = [
  { name: "prompt",  label: "Énoncé / question",   placeholder: "ex. Quel est le pluriel de كِتَابٌ ?" },
  { name: "correct", label: "Bonne réponse",        placeholder: "ex. كُتُبٌ" },
  { name: "d1",      label: "Mauvaise réponse 1",   placeholder: "" },
  { name: "d2",      label: "Mauvaise réponse 2",   placeholder: "" },
  { name: "d3",      label: "Mauvaise réponse 3",   placeholder: "" },
];

export function QuestionForm({ quizId }: { quizId: string }) {
  const boundAction = addQuestion.bind(null, quizId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form
      key={state.ver ?? 0}
      action={formAction}
      className="rounded-[18px] p-5 space-y-3"
      style={{ background: "#fff", border: "1px solid #EFEAE0" }}
    >
      <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 15 }}>
        Ajouter une question
      </p>

      {state.error && (
        <p className="text-xs font-medium" style={{ color: "#B4292E" }}>
          {state.error}
        </p>
      )}

      {FIELDS.map((f) => (
        <div key={f.name} className="space-y-1">
          <label
            htmlFor={f.name}
            className="block text-xs font-semibold uppercase tracking-wide"
            style={{ color: "#8B857A", letterSpacing: ".05em" }}
          >
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="text"
            placeholder={f.placeholder}
            className="w-full rounded-[10px] px-3 py-2.5 text-sm outline-none"
            style={{ background: "#F7F4EE", border: "1px solid #EFEAE0", color: "#1C1A17" }}
          />
        </div>
      ))}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: "#0A553F" }}
      >
        {pending ? "Ajout…" : "Ajouter la question"}
      </button>
    </form>
  );
}
