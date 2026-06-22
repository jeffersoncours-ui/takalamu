import { requireStudent } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import DashboardTabs from "./dashboard-tabs";
import { NotifBell } from "@/components/notif-bell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, userId } = await requireStudent();
  const supabase = await createClient();
  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, payload, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

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
          <div className="flex items-center gap-3">
            <NotifBell userId={userId} initialNotifs={notifs ?? []} />
            <form action={signOut}>
              <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
        <DashboardTabs />
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
