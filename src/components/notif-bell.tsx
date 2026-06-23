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
  eval_due: "Évaluation disponible",
  payment_requested: "Demande de paiement",
  payment_confirmed: "Paiement confirmé",
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
    const supabase = createClient();
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
        className="relative text-slate-600 hover:text-slate-900 transition"
        aria-label="Notifications"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-72 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-2">
            <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
              Notifications
            </p>
          </div>
          {notifs.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-400">
              Aucune notification.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifs.slice(0, 20).map((n) => {
                const url = n.payload?.url as string | undefined;
                const senderName = n.payload?.sender_name as string | undefined;
                const label = TYPE_LABEL[n.type] ?? n.type;
                const className = `block px-4 py-3 text-sm ${n.read ? "text-slate-500" : "text-slate-900 font-medium"}`;

                const inner = (
                  <>
                    <p>{senderName ? `${label} · ${senderName}` : label}</p>
                    <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>
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
                      <Link href={url} className={className} onClick={handleItemClick}>
                        {inner}
                      </Link>
                    ) : (
                      <div className={className}>{inner}</div>
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
