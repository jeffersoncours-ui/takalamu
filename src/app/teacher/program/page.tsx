import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { phaseLabel } from "@/lib/lessons";

import { deleteLesson, moveLesson } from "./actions";

export default async function ProgramPage() {
  const supabase = await createClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, order_index, title, objective, phase")
    .order("order_index", { ascending: true });

  const list = lessons ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mon programme</h1>
          <p className="text-sm text-slate-500">
            {list.length} leçon{list.length > 1 ? "s" : ""} · partagé entre
            enseignants
          </p>
        </div>
        <Link
          href="/teacher/program/new"
          className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
        >
          + Nouvelle leçon
        </Link>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Aucune leçon pour l&apos;instant. Commence par en créer une.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((lesson, index) => (
            <li
              key={lesson.id}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <span className="mt-0.5 w-6 shrink-0 text-center text-sm font-medium text-slate-400">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">
                  {lesson.title}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    {phaseLabel(lesson.phase)}
                  </span>
                  {lesson.objective ? (
                    <span className="truncate text-xs text-slate-500">
                      {lesson.objective}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <form action={moveLesson}>
                  <input type="hidden" name="id" value={lesson.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Monter"
                    className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↑
                  </button>
                </form>
                <form action={moveLesson}>
                  <input type="hidden" name="id" value={lesson.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={index === list.length - 1}
                    aria-label="Descendre"
                    className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                  >
                    ↓
                  </button>
                </form>
                <Link
                  href={`/teacher/program/${lesson.id}/edit`}
                  className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Éditer
                </Link>
                <form action={deleteLesson}>
                  <input type="hidden" name="id" value={lesson.id} />
                  <button
                    type="submit"
                    className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                  >
                    Suppr.
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
