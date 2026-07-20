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
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tk-muted-olive)", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Dupliquer vers
          </span>
          {selectedIds.length > 0 && (
            <span style={{ color: "var(--tk-muted-olive)", fontSize: 12, fontWeight: 600 }}>
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
                className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 transition-colors"
                style={
                  disabled
                    ? { border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-field)", opacity: 0.6, cursor: "not-allowed" }
                    : checked
                    ? { border: "1.5px solid var(--tk-emerald-btn-from)", background: "linear-gradient(180deg, rgba(14,74,56,.1), rgba(12,58,44,.07))", cursor: "pointer" }
                    : { border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)", cursor: "pointer" }
                }
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-[6px]"
                  style={
                    checked && !disabled
                      ? { width: 20, height: 20, background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))" }
                      : { width: 20, height: 20, border: "1.5px solid #CFB98A" }
                  }
                >
                  {checked && !disabled && (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  name="target_ids"
                  value={s.id}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(s.id)}
                  className="sr-only"
                />
                <span className="flex-1" style={{ fontSize: 14, fontWeight: 600, color: "var(--tk-ink-text)" }}>
                  {s.name}
                  {s.status !== "active" ? " (suspendu)" : ""}
                </span>
                {s.alreadyHas && (
                  <span
                    className="rounded-full italic"
                    style={{ background: "var(--tk-parchment-field)", color: "var(--tk-muted-olive)", fontSize: 10.5, fontWeight: 600, padding: "2px 8px" }}
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
        <p style={{ color: "var(--tk-danger)", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(to top, var(--tk-parchment) 70%, rgba(239,230,210,0))" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            type="submit"
            disabled={pending || selectedIds.length === 0}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[14px] font-bold disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
              color: "var(--tk-ink-screen)",
              fontSize: 15,
              boxShadow: "var(--tk-shadow-cta)",
            }}
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
