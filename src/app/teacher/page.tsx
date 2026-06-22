import Link from "next/link";

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>;
}) {
  const { session } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">
          Espace enseignant
        </h1>
        <p className="text-sm text-slate-600">
          Gère ton programme et le suivi de tes élèves.
        </p>
      </div>

      {session === "ok" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Séance enregistrée.
        </p>
      ) : null}

      <div className="grid gap-3">
        <Link
          href="/teacher/session/new"
          className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:border-emerald-400 hover:bg-emerald-50"
        >
          <p className="font-medium text-emerald-900">Fin de cours</p>
          <p className="text-sm text-emerald-700">
            Saisir une séance : présence, leçon, vocabulaire, grammaire, devoir.
          </p>
        </Link>
        <Link
          href="/teacher/program"
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-300 hover:bg-emerald-50/40"
        >
          <p className="font-medium text-slate-900">Mon programme</p>
          <p className="text-sm text-slate-500">
            Créer et ordonner les leçons (bibliothèque maîtresse).
          </p>
        </Link>
      </div>
    </div>
  );
}
