"use client";

import { useActionState } from "react";
import { updateStudentStatus } from "../actions";

type StudentStatus = "active" | "suspended_absences";

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Actif" },
  { value: "suspended_absences", label: "Suspendu" },
];

const STATUS_STYLE: Record<StudentStatus, React.CSSProperties> = {
  active: { color: "var(--tk-green-active)", background: "rgba(12,107,78,.10)", borderColor: "rgba(12,107,78,.3)" },
  suspended_absences: { color: "var(--tk-danger)", background: "rgba(163,52,42,.10)", borderColor: "rgba(163,52,42,.3)" },
};

export function StatusForm({
  studentId,
  currentStatus,
}: {
  studentId: string;
  currentStatus: StudentStatus;
}) {
  const boundAction = updateStudentStatus.bind(null, studentId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction} className="flex-1 flex items-center gap-2">
      {state.error && (
        <p className="text-xs" style={{ color: "var(--tk-danger)" }}>{state.error}</p>
      )}
      <select
        name="status"
        defaultValue={currentStatus}
        className="flex-1 rounded-[12px] border px-3 py-2.5 text-sm font-semibold outline-none cursor-pointer"
        style={STATUS_STYLE[currentStatus]}
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-xs font-semibold disabled:opacity-50"
        style={{ color: "var(--tk-muted-olive)" }}
      >
        {pending ? "…" : "✓"}
      </button>
    </form>
  );
}
