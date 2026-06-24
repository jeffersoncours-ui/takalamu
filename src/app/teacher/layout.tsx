import { requireTeacher } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { NotifBell } from "@/components/notif-bell";
import { DrawerNav } from "@/components/drawer-nav";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, userId } = await requireTeacher();
  const supabase = await createClient();
  const [{ data: notifs }, { count: pendingTrials }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, payload, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("trial_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  return (
    <div className="flex min-h-full flex-1 flex-col" style={{ background: "#F7F4EE" }}>
      <header
        className="bg-white sticky top-0 z-30 border-b"
        style={{ borderColor: "#E9E3D8" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <DrawerNav
            profileName={profile?.full_name ?? "Enseignant"}
            signOutAction={signOut}
            isAdmin={profile?.role === "admin"}
            pendingTrials={pendingTrials ?? 0}
          />
          <div className="ml-auto">
            <NotifBell userId={userId} initialNotifs={notifs ?? []} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
