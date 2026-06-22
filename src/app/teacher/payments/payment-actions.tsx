"use client";

import { useActionState } from "react";
import { confirmPayment, cancelPayment } from "./actions";

export function PaymentActions({ paymentId }: { paymentId: string }) {
  const confirmAction = confirmPayment.bind(null, paymentId);
  const cancelAction = cancelPayment.bind(null, paymentId);

  const [confirmState, confirmForm, confirmPending] = useActionState(confirmAction, {});
  const [cancelState, cancelForm, cancelPending] = useActionState(cancelAction, {});

  return (
    <div className="flex items-center gap-2">
      {(confirmState.error || cancelState.error) && (
        <p className="text-xs text-red-600">
          {confirmState.error ?? cancelState.error}
        </p>
      )}
      <form action={confirmForm}>
        <button
          type="submit"
          disabled={confirmPending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
        >
          {confirmPending ? "…" : "Confirmer"}
        </button>
      </form>
      <form action={cancelForm}>
        <button
          type="submit"
          disabled={cancelPending}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition"
        >
          {cancelPending ? "…" : "Annuler"}
        </button>
      </form>
    </div>
  );
}
