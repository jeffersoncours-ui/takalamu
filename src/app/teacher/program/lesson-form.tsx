"use client";

import Link from "next/link";
import { useActionState } from "react";

import { LESSON_PHASES, type LessonPhase } from "@/lib/lessons";

type ActionState = { error?: string };
type FormAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;

type LessonDefaults = {
  title?: string;
  phase?: LessonPhase;
  objective?: string | null;
  grammar_point?: string | null;
  reading_support?: string | null;
  homework_template?: string | null;
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
const labelClass = "block text-sm font-medium text-slate-700";

export function LessonForm({
  action,
  defaults,
  submitLabel,
}: {
  action: FormAction;
  defaults?: LessonDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="title" className={labelClass}>
          Titre *
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="phase" className={labelClass}>
          Phase *
        </label>
        <select
          id="phase"
          name="phase"
          defaultValue={defaults?.phase ?? LESSON_PHASES[0].value}
          className={fieldClass}
        >
          {LESSON_PHASES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="objective" className={labelClass}>
          Objectif
        </label>
        <textarea
          id="objective"
          name="objective"
          rows={2}
          defaultValue={defaults?.objective ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="grammar_point" className={labelClass}>
          Point de grammaire
        </label>
        <input
          id="grammar_point"
          name="grammar_point"
          defaultValue={defaults?.grammar_point ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="reading_support" className={labelClass}>
          Support de lecture (réf.)
        </label>
        <input
          id="reading_support"
          name="reading_support"
          defaultValue={defaults?.reading_support ?? ""}
          className={fieldClass}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="homework_template" className={labelClass}>
          Gabarit de devoir
        </label>
        <textarea
          id="homework_template"
          name="homework_template"
          rows={2}
          defaultValue={defaults?.homework_template ?? ""}
          className={fieldClass}
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : submitLabel}
        </button>
        <Link
          href="/teacher/program"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
