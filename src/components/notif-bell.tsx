"use client";

import { useEffect, useRef, useState } from "react";
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

async function markAllRead(userId: string) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

async function markOneRead(id: string) {
  const supabase = createClient();
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export function NotifBell({
  userId,
  initialNotifs,
  basePath,
}: {
  userId: string;
  initialNotifs: Notif[];
  basePath: "/dashboard" | "/teacher";
}) {
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [open, setOpen] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Client unique pour la durée de vie du composant (même pattern que chat-box)
  const supabaseRef = useRef(createClient());

  const unread = notifs.filter((n) => !n.read).length;

  // Fermer en cliquant ailleurs
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Realtime — nouvelles notifications
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Notif;
          setNotifs((prev) => [n, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function handleMarkAllRead() {
    markAllRead(userId);
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleItemClick(id: string) {
    setOpen(false);
    markOneRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  // Les lues restent consultables mais repliées derrière un menu déroulant —
  // seules les non lues s'affichent directement (voir tasks/lessons.md session 35).
  const unreadList = notifs.filter((n) => !n.read).slice(0, 8);
  const readList = notifs.filter((n) => n.read).slice(0, 8);

  function renderItem(n: Notif) {
    const payload = n.payload as NotifPayload | null;
    const url = payload?.url;
    const { title, body } = getNotifCopy(n.type, n.payload);
    const priority = isPriorityNotif(n.type);
    const style: React.CSSProperties = {
      borderBottom: "1px solid var(--tk-parchment-border)",
      borderLeft: priority && !n.read ? "3px solid var(--tk-gold)" : "3px solid transparent",
      background: !n.read ? "rgba(199,154,62,.06)" : undefined,
    };

    const inner = (
      <>
        <p className="text-sm" style={{ color: "var(--tk-ink-text)", fontWeight: n.read ? 400 : 600 }}>
          {title}
        </p>
        {body && (
          <p className="mt-0.5 text-xs line-clamp-2" style={{ color: "var(--tk-muted-olive)" }}>
            {body}
          </p>
        )}
        <p className="text-xs mt-1" style={{ color: "var(--tk-faint-olive)" }} suppressHydrationWarning>
          {new Date(n.created_at).toLocaleString("fr-FR", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </>
    );

    return (
      <li key={n.id}>
        {url ? (
          <Link href={url} className="block px-4 py-3" style={style} onClick={() => handleItemClick(n.id)}>
            {inner}
          </Link>
        ) : (
          <div className="px-4 py-3" style={style} onClick={() => handleItemClick(n.id)}>
            {inner}
          </div>
        )}
      </li>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setShowRead(false);
        }}
        className="relative flex items-center justify-center rounded-full transition"
        style={{
          width: 40,
          height: 40,
          background: "rgba(255,255,255,.08)",
          border: "1px solid rgba(199,154,62,.35)",
        }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={1.7}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full font-bold text-white"
            style={{
              top: -3,
              right: -2,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              fontSize: 10,
              background: "var(--tk-danger-dot)",
              border: "1.5px solid var(--tk-ink-hero-from)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 overflow-hidden rounded-xl"
          style={{
            width: "min(320px, calc(100vw - 32px))",
            background: "var(--tk-parchment-card)",
            border: "1px solid var(--tk-parchment-border)",
            boxShadow: "var(--tk-shadow-card-raised)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderBottom: "1px solid var(--tk-parchment-border)" }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--tk-muted-olive)" }}
            >
              Notifications
            </p>
            {unread > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold"
                style={{ color: "var(--tk-ink-hero-to)" }}
              >
                Tout marquer lu
              </button>
            )}
          </div>
          {notifs.length === 0 ? (
            <p className="px-4 py-4 text-sm" style={{ color: "var(--tk-faint-olive)" }}>
              Aucune notification.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <ul>{unreadList.map((n) => renderItem(n))}</ul>

              {readList.length > 0 && (
                <>
                  <button
                    onClick={() => setShowRead((s) => !s)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold"
                    style={{
                      color: "var(--tk-muted-olive)",
                      borderTop: "1px solid var(--tk-parchment-border)",
                      borderBottom: showRead ? "1px solid var(--tk-parchment-border)" : undefined,
                    }}
                  >
                    <span>Notifications lues ({readList.length})</span>
                    <svg
                      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tk-muted-olive)" strokeWidth={2.2}
                      strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: showRead ? "rotate(180deg)" : "none", transition: "transform .15s" }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {showRead && <ul>{readList.map((n) => renderItem(n))}</ul>}
                </>
              )}
            </div>
          )}
          <Link
            href={`${basePath}/notifications`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--tk-ink-hero-to)", borderTop: "1px solid var(--tk-parchment-border)" }}
          >
            Tout voir →
          </Link>
        </div>
      )}
    </div>
  );
}
