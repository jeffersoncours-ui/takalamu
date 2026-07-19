"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  read: boolean;
  created_at: string;
};

const TYPE_LABEL: Record<string, string> = {
  new_message: "Nouveau message",
  homework_due: "Devoir à rendre",
  homework_submitted: "Devoir soumis",
  homework_corrected: "Devoir corrigé",
  house_rules: "Règlement intérieur à valider",
};

async function markAllRead(userId: string) {
  const supabase = createClient();
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}

export function NotifBell({
  userId,
  initialNotifs,
}: {
  userId: string;
  initialNotifs: Notif[];
}) {
  const [notifs, setNotifs] = useState<Notif[]>(initialNotifs);
  const [open, setOpen] = useState(false);
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

  function handleOpen() {
    setOpen((o) => !o);
    if (!open && unread > 0) {
      markAllRead(userId);
      setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  function handleItemClick() {
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
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
          className="absolute right-0 top-11 z-50 w-72 overflow-hidden rounded-xl"
          style={{
            background: "var(--tk-parchment-card)",
            border: "1px solid var(--tk-parchment-border)",
            boxShadow: "var(--tk-shadow-card-raised)",
          }}
        >
          <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--tk-parchment-border)" }}>
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--tk-muted-olive)" }}
            >
              Notifications
            </p>
          </div>
          {notifs.length === 0 ? (
            <p className="px-4 py-4 text-sm" style={{ color: "var(--tk-faint-olive)" }}>
              Aucune notification.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {notifs.slice(0, 20).map((n) => {
                const url = n.payload?.url as string | undefined;
                const senderName = n.payload?.sender_name as string | undefined;
                const label = TYPE_LABEL[n.type] ?? n.type;
                const style: React.CSSProperties = {
                  borderBottom: "1px solid var(--tk-parchment-border)",
                  color: n.read ? "var(--tk-muted-olive)" : "var(--tk-ink-text)",
                  fontWeight: n.read ? 400 : 600,
                };

                const inner = (
                  <>
                    <p className="text-sm">{senderName ? `${label} · ${senderName}` : label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--tk-faint-olive)" }} suppressHydrationWarning>
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
                      <Link href={url} className="block px-4 py-3" style={style} onClick={handleItemClick}>
                        {inner}
                      </Link>
                    ) : (
                      <div className="px-4 py-3" style={style}>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
