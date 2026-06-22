import Link from "next/link";

import { requireTeacher } from "@/lib/auth";
import { signOut } from "@/app/login/actions";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireTeacher();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/teacher" className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              Takalamu · Enseignant
            </span>
            <span className="text-xs text-slate-500">
              {profile?.full_name ?? "—"}
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/teacher/students"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Élèves
            </Link>
            <Link
              href="/teacher/homework"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Devoirs
            </Link>
            <Link
              href="/teacher/session/new"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Séance
            </Link>
            <Link
              href="/teacher/program"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Programme
            </Link>
            <Link
              href="/teacher/availability"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Dispos
            </Link>
            <Link
              href="/teacher/bookings"
              className="font-medium text-slate-700 hover:text-emerald-700"
            >
              Résa
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-slate-500 hover:text-slate-800"
              >
                Déco
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
