"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { NotifPayload } from "@/lib/notif-copy";

type PinNotif = { id: string; payload: unknown; created_at: string };

// Épingle "devoir à rendre" sur le dashboard élève — empile toutes les notifs
// homework_due non lues (une par devoir assigné depuis la dernière visite),
// juste sous le ruban de stats et au-dessus de "Reprendre mes cours".
export function PriorityPin({ notifs }: { notifs: PinNotif[] }) {
  const [items, setItems] = useState(notifs);
  if (items.length === 0) return null;

  async function dismiss(id: string) {
    setItems((prev) => prev.filter((n) => n.id !== id));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  return (
    <div className="px-[22px] pt-5 flex flex-col gap-2.5">
      {items.map((n) => {
        const payload = n.payload as NotifPayload | null;
        return (
          <Link
            key={n.id}
            href={payload?.url ?? "/dashboard/homework"}
            onClick={() => dismiss(n.id)}
            className="flex items-start gap-3 rounded-[16px] px-4 py-3.5 transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, rgba(199,154,62,.16), rgba(199,154,62,.07))",
              border: "1px solid var(--tk-gold)",
              boxShadow: "0 10px 22px -16px rgba(10,20,15,.45)",
            }}
          >
            <span
              className="mt-0.5 flex shrink-0 items-center justify-center rounded-full"
              style={{ width: 26, height: 26, background: "var(--tk-gold)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-hero-to)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </span>
            <div className="min-w-0">
              <p className="font-bold" style={{ color: "var(--tk-gold-darker)", fontSize: 13.5 }}>
                Devoir à rendre
              </p>
              {payload?.instructions_preview && (
                <p className="mt-0.5 line-clamp-2" style={{ color: "var(--tk-ink-text-soft)", fontSize: 13 }}>
                  {payload.instructions_preview}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
