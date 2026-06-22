import { requireStudent } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import DashboardTabs from "./dashboard-tabs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStudent();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">
              Takalamu · Élève
            </span>
            <span className="text-xs text-slate-500">{profile.full_name ?? "—"}</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
              Déconnexion
            </button>
          </form>
        </div>
        <DashboardTabs />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
