"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getNotifCopy, isPriorityNotif, type NotifPayload } from "@/lib/notif-copy";

type Notif = {
  id: string;
  type: string;
  payload: unknown;
  read: boolean;
  created_at: string;
};

type FilterKey = "all" | "unread" | "priority";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "unread", label: "Non lus" },
  { key: "priority", label: "Prioritaires" },
];

export function NotificationsList({ userId, initialNotifs }: { userId: string; initialNotifs: Notif[] }) {
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [filter, setFilter] = useState<FilterKey>("all");

  const unreadCount = notifs.filter((n) => !n.read).length;
  const shown = notifs.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "priority") return isPriorityNotif(n.type);
    return true;
  });

  async function markOneRead(id: string) {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function markAllRead() {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          const count = f.key === "unread" ? unreadCount : f.key === "priority" ? notifs.filter((n) => isPriorityNotif(n.type)).length : notifs.length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className="shrink-0 rounded-full font-semibold transition-colors"
              style={{
                padding: "7px 14px",
                fontSize: 13,
                background: active ? "rgba(199,154,62,.16)" : "var(--tk-parchment-field)",
                border: `1px solid ${active ? "var(--tk-gold)" : "var(--tk-parchment-border)"}`,
                color: active ? "var(--tk-gold-darker)" : "var(--tk-ink-text-soft)",
              }}
            >
              {f.label} · {count}
            </button>
          );
        })}
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="ml-auto shrink-0 text-xs font-semibold"
            style={{ color: "var(--tk-ink-hero-to)" }}
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune notification ici.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((n) => {
            const payload = n.payload as NotifPayload | null;
            const { title, body } = getNotifCopy(n.type, n.payload);
            const priority = isPriorityNotif(n.type);
            const url = payload?.url;

            const card = (
              <div
                className="rounded-[16px] px-4 py-3.5"
                style={{
                  background: "var(--tk-parchment-card)",
                  border: `1px solid ${priority && !n.read ? "var(--tk-gold)" : "var(--tk-parchment-border)"}`,
                  boxShadow: "var(--tk-shadow-card)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm" style={{ color: "var(--tk-ink-text)", fontWeight: n.read ? 500 : 700 }}>
                    {priority && (
                      <span
                        className="mr-1.5 inline-block rounded-full align-middle"
                        style={{ width: 6, height: 6, background: "var(--tk-gold)" }}
                        aria-hidden
                      />
                    )}
                    {title}
                  </p>
                  {!n.read && (
                    <span className="shrink-0 rounded-full" style={{ width: 8, height: 8, background: "var(--tk-danger-dot)", marginTop: 4 }} />
                  )}
                </div>
                {body && (
                  <p className="mt-1" style={{ color: "var(--tk-ink-text-soft)", fontSize: 13.5, lineHeight: 1.4 }}>
                    {body}
                  </p>
                )}
                <p className="mt-2 text-xs" style={{ color: "var(--tk-faint-olive)" }} suppressHydrationWarning>
                  {new Date(n.created_at).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            );

            return url ? (
              <Link key={n.id} href={url} onClick={() => markOneRead(n.id)}>
                {card}
              </Link>
            ) : (
              <div key={n.id} onClick={() => markOneRead(n.id)}>
                {card}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
