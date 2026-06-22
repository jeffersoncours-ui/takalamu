"use client";

import { useActionState } from "react";
import { deleteSlot } from "./actions";

export function DeleteSlotButton({ slotId }: { slotId: string }) {
  const boundAction = deleteSlot.bind(null, slotId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  return (
    <form action={formAction}>
      {state.error && (
        <p className="text-xs text-red-600 mr-2">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:border-red-400 hover:bg-red-50 disabled:opacity-50 transition"
      >
        {pending ? "…" : "Supprimer"}
      </button>
    </form>
  );
}
