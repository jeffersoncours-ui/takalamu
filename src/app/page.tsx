import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="max-w-xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-widest text-emerald-700">
          Takalamu
        </p>
        <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
          Cours d&apos;arabe & étude de texte islamique
        </h1>
        <p className="text-base text-slate-600">
          Cours d&apos;arabe individuels en visio et étude de texte en groupe,
          avec un suivi pédagogique complet.
        </p>
      </div>

      <Link
        href="/login"
        className="rounded-full bg-emerald-700 px-6 py-3 text-sm font-medium text-white transition hover:bg-emerald-800"
      >
        Mon espace
      </Link>

      <p className="text-xs text-slate-400">Socle en cours de construction.</p>
    </main>
  );
}
