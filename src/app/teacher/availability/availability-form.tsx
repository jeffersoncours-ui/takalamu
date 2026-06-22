"use client";

import { useActionState, useState } from "react";
import { createSlot } from "./actions";

const DAY_LABELS = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

/** Convertit HH:MM (heure locale navigateur) en HH:MM UTC. */
function toUtcTime(localHHMM: string): string {
  if (!localHHMM) return "";
  const [hh, mm] = localHHMM.split(":").map(Number);
  const offsetMin = new Date().getTimezoneOffset(); // positif si en retard sur UTC
  const totalMin = hh * 60 + mm + offsetMin;
  const utcMin = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const utcHH = Math.floor(utcMin / 60);
  const utcMM = utcMin % 60;
  return `${String(utcHH).padStart(2, "0")}:${String(utcMM).padStart(2, "0")}`;
}

export function AvailabilityForm() {
  const [state, formAction, pending] = useActionState(createSlot, {});
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-700">Ajouter un créneau récurrent</p>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 space-y-1 sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600">Jour</label>
          <select
            name="day_of_week"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          >
            {DAY_LABELS.map((label, i) => (
              <option key={i} value={i}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Début (heure locale)
          </label>
          <input
            type="time"
            value={startLocal}
            onChange={(e) => setStartLocal(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            required
          />
          <input type="hidden" name="start_time_utc" value={toUtcTime(startLocal)} />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-slate-600">
            Fin (heure locale)
          </label>
          <input
            type="time"
            value={endLocal}
            onChange={(e) => setEndLocal(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
            required
          />
          <input type="hidden" name="end_time_utc" value={toUtcTime(endLocal)} />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending || !startLocal || !endLocal}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {pending ? "…" : "Ajouter"}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Les heures sont converties en UTC automatiquement (UTC affiché aux élèves en heure locale).
      </p>
    </form>
  );
}
