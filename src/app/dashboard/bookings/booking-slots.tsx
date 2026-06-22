"use client";

import { useActionState } from "react";
import { createBooking } from "./actions";

type Slot = {
  scheduledAt: string;
};

export function BookingSlots({ slots }: { slots: Slot[] }) {
  const [state, formAction, pending] = useActionState(createBooking, {});

  if (!slots.length) {
    return (
      <p className="text-sm text-slate-500">
        Aucun créneau disponible dans les 4 prochaines semaines.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Réservation confirmée !
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {slots.map((slot) => {
          const d = new Date(slot.scheduledAt);
          const dayStr = d.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          });
          const timeStr = d.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <form key={slot.scheduledAt} action={formAction}>
              <input
                type="hidden"
                name="scheduled_at"
                value={slot.scheduledAt}
              />
              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50 transition"
              >
                <p className="font-medium text-slate-900 capitalize">
                  {dayStr}
                </p>
                <p className="text-sm text-slate-500">{timeStr} (heure locale)</p>
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
