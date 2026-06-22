import Link from "next/link";

export default function TeacherHome() {
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

      <div className="grid gap-3">
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
