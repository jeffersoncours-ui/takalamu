"use client";

import { useActionState } from "react";
import { createBooking } from "./actions";

type Slot = {
  scheduledAt: string;
};

type DayGroup = {
  key: string;
  label: string;
  slots: { scheduledAt: string; timeStr: string }[];
};

function groupByDay(slots: Slot[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const slot of slots) {
    const d = new Date(slot.scheduledAt);
    const key = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeStr = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (!groups.has(key)) {
      groups.set(key, { key, label: key, slots: [] });
    }
    groups.get(key)!.slots.push({ scheduledAt: slot.scheduledAt, timeStr });
  }
  return Array.from(groups.values());
}

export function BookingSlots({ slots }: { slots: Slot[] }) {
  const [state, formAction, pending] = useActionState(createBooking, {});

  if (!slots.length) {
    return (
      <p style={{ color: "#8B857A", fontSize: 14 }}>
        Aucun créneau disponible dans les 4 prochaines semaines.
      </p>
    );
  }

  const days = groupByDay(slots);

  return (
    <div className="space-y-5">
      {state.error && (
        <p className="rounded-xl px-3 py-2" style={{ background: "#FDECEC", color: "#B4292E", fontSize: 13 }}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-xl px-3 py-2" style={{ background: "#ECFAF4", color: "#0A6B4E", fontSize: 13 }}>
          Réservation confirmée !
        </p>
      )}

      {days.map((day) => (
        <div key={day.key}>
          <div
            className="px-0.5 mb-[10px] font-bold uppercase"
            style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}
            suppressHydrationWarning
          >
            {day.label}
          </div>
          <div className="flex flex-col gap-[10px]">
            {day.slots.map((slot) => (
              <form
                key={slot.scheduledAt}
                action={formAction}
                className="flex items-center gap-[14px] rounded-[16px] px-4 py-[14px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <input type="hidden" name="scheduled_at" value={slot.scheduledAt} />
                <div
                  className="flex shrink-0 items-center justify-center rounded-[13px]"
                  style={{ width: 46, height: 46, background: "#F4F1EB" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }} suppressHydrationWarning>
                    {slot.timeStr}
                  </div>
                  <div className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                    Cours individuel · 60 min
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex h-10 items-center rounded-[12px] px-[18px] font-bold text-white disabled:opacity-50"
                  style={{ background: "#0F9D6E", fontSize: 13, boxShadow: "0 6px 13px rgba(15,157,110,.26)" }}
                >
                  Réserver
                </button>
              </form>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
