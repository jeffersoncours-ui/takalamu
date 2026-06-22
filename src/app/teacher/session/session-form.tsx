"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { ATTENDANCE_STATUSES } from "@/lib/attendance";
import { submitSession } from "./actions";

type Student = {
  id: string;
  name: string;
  status: string;
  currentLessonId: string | null;
};
type Lesson = { id: string; title: string };

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
const labelClass = "block text-sm font-medium text-slate-700";

/** Valeur datetime-local (heure locale du navigateur) à l'instant présent. */
function nowLocalValue(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function SessionForm({
  students,
  lessons,
}: {
  students: Student[];
  lessons: Lesson[];
}) {
  const [state, formAction, pending] = useActionState(submitSession, {});

  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [lessonId, setLessonId] = useState(
    students[0]?.currentLessonId ?? "",
  );
  const [dateLocal, setDateLocal] = useState(nowLocalValue());

  // Lignes dynamiques (compteurs d'identité React, valeurs lues côté serveur).
  const [vocabRows, setVocabRows] = useState<number[]>([]);
  const [grammarRows, setGrammarRows] = useState<number[]>([]);
  const [nextId, setNextId] = useState(1);
  const addRow = (
    set: React.Dispatch<React.SetStateAction<number[]>>,
  ) => {
    set((rows) => [...rows, nextId]);
    setNextId((n) => n + 1);
  };
  const removeRow = (
    set: React.Dispatch<React.SetStateAction<number[]>>,
    id: number,
  ) => set((rows) => rows.filter((r) => r !== id));

  const sessionIso = useMemo(() => {
    const t = Date.parse(dateLocal);
    return Number.isNaN(t) ? "" : new Date(t).toISOString();
  }, [dateLocal]);

  function onStudentChange(id: string) {
    setStudentId(id);
    const s = students.find((x) => x.id === id);
    setLessonId(s?.currentLessonId ?? "");
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Élève */}
      <div className="space-y-1">
        <label htmlFor="student_id" className={labelClass}>
          Élève *
        </label>
        <select
          id="student_id"
          name="student_id"
          value={studentId}
          onChange={(e) => onStudentChange(e.target.value)}
          className={fieldClass}
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {s.status !== "active" ? " (suspendu)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Présence : boutons radio tappables */}
      <fieldset className="space-y-1">
        <legend className={labelClass}>Présence *</legend>
        <div className="grid grid-cols-2 gap-2">
          {ATTENDANCE_STATUSES.map((a, i) => (
            <label
              key={a.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 has-[:checked]:font-medium has-[:checked]:text-emerald-800"
            >
              <input
                type="radio"
                name="attendance"
                value={a.value}
                defaultChecked={i === 0}
                className="accent-emerald-600"
              />
              {a.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Leçon + avance du curseur */}
      <div className="space-y-1">
        <label htmlFor="lesson_id" className={labelClass}>
          Leçon travaillée
        </label>
        <select
          id="lesson_id"
          name="lesson_id"
          value={lessonId}
          onChange={(e) => setLessonId(e.target.value)}
          className={fieldClass}
        >
          <option value="">— Aucune / révision —</option>
          {lessons.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
        <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="advance_progress"
            defaultChecked
            className="accent-emerald-600"
          />
          Avancer le curseur de progression à cette leçon
        </label>
      </div>

      {/* Date de séance */}
      <div className="space-y-1">
        <label htmlFor="session_date" className={labelClass}>
          Date de la séance
        </label>
        <input
          id="session_date"
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => setDateLocal(e.target.value)}
          className={fieldClass}
        />
        <input type="hidden" name="session_date_iso" value={sessionIso} />
      </div>

      {/* Récap public */}
      <div className="space-y-1">
        <label htmlFor="public_recap" className={labelClass}>
          Récap public <span className="text-slate-400">(visible élève)</span>
        </label>
        <textarea
          id="public_recap"
          name="public_recap"
          rows={2}
          className={fieldClass}
        />
      </div>

      {/* Vocabulaire (lignes dynamiques) */}
      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Vocabulaire</span>
          <button
            type="button"
            onClick={() => addRow(setVocabRows)}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            + Mot
          </button>
        </div>
        {vocabRows.map((id) => (
          <div key={id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              name="vocab_arabic"
              placeholder="mot (ar)"
              dir="rtl"
              className={fieldClass}
            />
            <input
              name="vocab_french"
              placeholder="définition (fr)"
              className={fieldClass}
            />
            <input
              name="vocab_root"
              placeholder="racine"
              dir="rtl"
              className={`${fieldClass} w-20`}
            />
            <button
              type="button"
              onClick={() => removeRow(setVocabRows, id)}
              className="col-span-3 text-left text-xs text-slate-400 hover:text-red-600"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {/* Grammaire (lignes dynamiques) */}
      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between">
          <span className={labelClass}>Règles de grammaire</span>
          <button
            type="button"
            onClick={() => addRow(setGrammarRows)}
            className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
          >
            + Règle
          </button>
        </div>
        {grammarRows.map((id) => (
          <div key={id} className="space-y-1">
            <input
              name="grammar_title"
              placeholder="titre"
              className={fieldClass}
            />
            <textarea
              name="grammar_content"
              placeholder="contenu"
              rows={2}
              className={fieldClass}
            />
            <button
              type="button"
              onClick={() => removeRow(setGrammarRows, id)}
              className="text-xs text-slate-400 hover:text-red-600"
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {/* Devoir */}
      <div className="space-y-1">
        <label htmlFor="homework_instructions" className={labelClass}>
          Devoir <span className="text-slate-400">(optionnel)</span>
        </label>
        <textarea
          id="homework_instructions"
          name="homework_instructions"
          rows={2}
          placeholder="Consignes — laisser vide pour ne pas créer de devoir."
          className={fieldClass}
        />
      </div>

      {/* Note privée (distincte) */}
      <div className="space-y-1 rounded-lg border border-amber-300 bg-amber-50/60 p-3">
        <label htmlFor="private_note" className="block text-sm font-medium text-amber-900">
          Note privée — non visible par l&apos;élève
        </label>
        <textarea
          id="private_note"
          name="private_note"
          rows={2}
          className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer la séance"}
        </button>
        <Link
          href="/teacher"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
