import { requireStudent } from "@/lib/auth";
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
    <div className="flex min-h-full flex-1 flex-col" style={{ background: "#F7F4EE" }}>
      <header className="bg-white border-b sticky top-0 z-40" style={{ borderColor: "#E9E3D8" }}>
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex flex-col leading-tight">
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#8B857A", letterSpacing: ".06em", fontSize: "10px" }}
            >
              Takalamu
            </span>
            <span
              className="text-lg font-semibold leading-tight"
              style={{ color: "#1C1A17", fontFamily: "var(--font-spectral)" }}
            >
              {profile.full_name ?? "—"}
            </span>
          </div>
          <NotifBell userId={userId} initialNotifs={notifs ?? []} />
        </div>
      </header>

      {/* pb-28 pour laisser la place à la bottom tab bar */}
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-28">{children}</main>

      <DashboardTabs />
    </div>
  );
}
