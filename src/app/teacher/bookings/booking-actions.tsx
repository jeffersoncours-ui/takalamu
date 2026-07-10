"use client";

import { useActionState, useState } from "react";
import { updateBookingStatus, updateZoomLink } from "./actions";

export function BookingActions({
  bookingId,
  currentZoomLink,
}: {
  bookingId: string;
  currentZoomLink: string | null;
}) {
  const [editingZoom, setEditingZoom] = useState(false);

  const completeAction = updateBookingStatus.bind(null, bookingId, "completed");
  const cancelAction = updateBookingStatus.bind(null, bookingId, "cancelled");
  const zoomAction = updateZoomLink.bind(null, bookingId);

  const [completeState, completeForm, completePending] = useActionState(completeAction, {});
  const [cancelState, cancelForm, cancelPending] = useActionState(cancelAction, {});
  const [zoomState, zoomForm, zoomPending] = useActionState(zoomAction, {});

  return (
    <div className="space-y-2">
      {/* Lien Google Meet */}
      {!editingZoom ? (
        <div className="flex items-center gap-3">
          {currentZoomLink ? (
            <a
              href={currentZoomLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-emerald-700 hover:underline truncate max-w-[200px]"
            >
              {currentZoomLink}
            </a>
          ) : (
            <span className="text-sm text-slate-400">Pas de lien Google Meet</span>
          )}
          <button
            onClick={() => setEditingZoom(true)}
            className="text-xs text-slate-500 hover:text-slate-700 underline"
          >
            {currentZoomLink ? "Modifier" : "Ajouter lien"}
          </button>
        </div>
      ) : (
        <form action={zoomForm} className="flex gap-2" onSubmit={() => setEditingZoom(false)}>
          {zoomState.error && <p className="text-xs text-red-600">{zoomState.error}</p>}
          <input
            name="zoom_link"
            type="url"
            defaultValue={currentZoomLink ?? ""}
            placeholder="https://meet.google.com/..."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={zoomPending}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {zoomPending ? "…" : "OK"}
          </button>
          <button
            type="button"
            onClick={() => setEditingZoom(false)}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Annuler
          </button>
        </form>
      )}

      {/* Actions statut */}
      <div className="flex gap-2">
        {completeState.error && <p className="text-xs text-red-600">{completeState.error}</p>}
        {cancelState.error && <p className="text-xs text-red-600">{cancelState.error}</p>}
        <form action={completeForm}>
          <button
            type="submit"
            disabled={completePending}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition"
          >
            {completePending ? "…" : "Marquer terminé"}
          </button>
        </form>
        <form action={cancelForm}>
          <button
            type="submit"
            disabled={cancelPending}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-200 hover:text-red-600 disabled:opacity-50 transition"
          >
            {cancelPending ? "…" : "Annuler"}
          </button>
        </form>
      </div>
    </div>
  );
}
