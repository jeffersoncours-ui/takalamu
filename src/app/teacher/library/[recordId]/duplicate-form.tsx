"use client";

import { useActionState, useState } from "react";

type ActionState = { error?: string };
type Student = { id: string; name: string; status: string; alreadyHas: boolean };

/** Réutilisable pour dupliquer un cours (par élève déjà représenté) ou une
 *  règle de grammaire individuelle — l'action déjà liée est fournie en prop. */
export function DuplicateForm({
  dupAction,
  students,
  submitLabel = "Dupliquer",
  alreadyHasLabel = "a déjà ce cours",
}: {
  dupAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  students: Student[];
  submitLabel?: string;
  alreadyHasLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(dupAction, {});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <form action={formAction} className="space-y-4 pb-28">
      <div className="space-y-2">
        <div className="flex items-center justify-between px-0.5">
          <span style={{ fontSize: 11, fontWeight: 700, color: "#8B857A", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Dupliquer vers
          </span>
          {selectedIds.length > 0 && (
            <span style={{ color: "#8B857A", fontSize: 12, fontWeight: 600 }}>
              {selectedIds.length} sélectionné{selectedIds.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {students.map((s) => {
            const checked = selectedIds.includes(s.id);
            const disabled = s.alreadyHas;
            return (
              <label
                key={s.id}
                className="flex items-center gap-2.5 rounded-[13px] px-3.5 py-3 transition-colors"
                style={{
                  border: `1.5px solid ${checked ? "#9FE3C8" : "#E9E3D8"}`,
                  background: disabled ? "#F7F4EE" : checked ? "#ECFAF4" : "#fff",
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <input
                  type="checkbox"
                  name="target_ids"
                  value={s.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(s.id)}
                  style={{ width: 18, height: 18, accentColor: "#0F9D6E" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1C1A17" }}>
                  {s.name}
                  {s.status !== "active" ? " (suspendu)" : ""}
                </span>
                {s.alreadyHas && (
                  <span
                    className="ml-auto rounded-full"
                    style={{ background: "#F4F1EB", color: "#8B857A", fontSize: 10, fontWeight: 700, padding: "2px 8px" }}
                  >
                    {alreadyHasLabel}
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {state?.error ? (
        <p style={{ color: "#B4292E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(to top, #F7F4EE 70%, rgba(247,244,238,0))" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="submit"
            disabled={pending || selectedIds.length === 0}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[16px] font-bold text-white disabled:opacity-60"
            style={{ background: "#0F9D6E", fontSize: 15, boxShadow: "0 10px 22px rgba(15,157,110,.30)" }}
          >
            {pending
              ? "Duplication…"
              : selectedIds.length > 1
              ? `Dupliquer vers ${selectedIds.length} élèves`
              : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
