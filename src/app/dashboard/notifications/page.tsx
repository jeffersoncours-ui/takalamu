import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "@/components/notifications-list";

export default async function NotificationsPage() {
  const { userId } = await requireStudent();
  const supabase = await createClient();

  const { data: notifs } = await supabase
    .from("notifications")
    .select("id, type, payload, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-5">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
      >
        Notifications
      </h1>

      <NotificationsList userId={userId} initialNotifs={notifs ?? []} />
    </div>
  );
}
