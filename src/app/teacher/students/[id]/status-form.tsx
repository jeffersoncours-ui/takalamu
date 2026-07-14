"use client";

import { useActionState } from "react";
import { updateStudentStatus } from "../actions";

type StudentStatus = "active" | "suspended_absences";

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Actif" },
  { value: "suspended_absences", label: "Suspendu (absences)" },
];

const STATUS_COLOR: Record<StudentStatus, string> = {
  active: "text-emerald-700 border-emerald-200 bg-emerald-50",
  suspended_absences: "text-red-700 border-red-200 bg-red-50",
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
    <form action={formAction} className="flex items-center gap-2">
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <select
        name="status"
        defaultValue={currentStatus}
        className={`rounded-full border px-2.5 py-1 text-xs font-medium outline-none cursor-pointer ${STATUS_COLOR[currentStatus]}`}
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
        className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
      >
        {pending ? "…" : "✓"}
      </button>
    </form>
  );
}
