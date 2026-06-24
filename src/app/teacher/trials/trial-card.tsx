"use client";

import { useState, useTransition } from "react";
import { updateTrialStatus, inviteStudent } from "./actions";
import type { Database } from "@/lib/supabase/database.types";

type Trial = Database["public"]["Tables"]["trial_requests"]["Row"];
type TrialStatus = Database["public"]["Enums"]["trial_status"];

const STATUS_LABELS: Record<TrialStatus, string> = {
  pending: "En attente",
  contacted: "Contacté(e)",
  completed: "Essai effectué",
  converted: "Invité(e)",
  declined: "Décliné",
};

const STATUS_COLORS: Record<TrialStatus, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  contacted: { bg: "#DBEAFE", text: "#1E40AF" },
  completed: { bg: "#E8F7F1", text: "#065F46" },
  converted: { bg: "#D1FAE5", text: "#064E3B" },
  declined: { bg: "#FEE2E2", text: "#991B1B" },
};

const NEXT_STATUSES: Partial<Record<TrialStatus, TrialStatus[]>> = {
  pending: ["contacted", "declined"],
  contacted: ["completed", "declined"],
  completed: ["declined"],
};

export function TrialCard({ trial }: { trial: Trial }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const colors = STATUS_COLORS[trial.status];
  const nextStatuses = NEXT_STATUSES[trial.status] ?? [];

  function handleStatus(status: TrialStatus) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateTrialStatus(trial.id, status);
      if (res.error) setFeedback(res.error);
    });
  }

  function handleInvite() {
    setFeedback(null);
    startTransition(async () => {
      const res = await inviteStudent(trial.id);
      if (res.error) setFeedback(res.error);
      else setFeedback(res.success ?? null);
    });
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 2px 8px rgba(28,26,23,.05)" }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold" style={{ color: "#1C1A17", fontFamily: "var(--font-spectral)", fontSize: 16 }}>
              {trial.first_name} {trial.last_name}
            </h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ background: colors.bg, color: colors.text }}
            >
              {STATUS_LABELS[trial.status]}
            </span>
            {trial.trial_paid && (
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: "#E8F7F1", color: "#065F46" }}
              >
                Essai payé ✓
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: "#8B857A" }}>{trial.email}</p>
          {trial.level && (
            <p className="text-xs mt-1 font-medium" style={{ color: "#6B6460" }}>
              Niveau : {trial.level}
            </p>
          )}
          {trial.scheduled_at && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 mt-2"
              style={{ background: "#E8F7F1" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: "#065F46" }}>
                {new Date(trial.scheduled_at).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "Europe/Paris",
                })}
              </span>
            </div>
          )}
          {trial.message && (
            <p className="text-sm mt-2" style={{ color: "#4A463F", lineHeight: 1.5 }}>
              {trial.message}
            </p>
          )}
          <p className="text-xs mt-2" style={{ color: "#B0A89A" }}>
            {new Date(trial.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {nextStatuses.map((s) => (
          <button
            key={s}
            onClick={() => handleStatus(s)}
            disabled={isPending}
            className="rounded-full text-xs font-semibold px-3 py-1.5 border transition-opacity disabled:opacity-50"
            style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
          >
            → {STATUS_LABELS[s]}
          </button>
        ))}

        {trial.status === "completed" && (
          <button
            onClick={handleInvite}
            disabled={isPending}
            className="rounded-full text-xs font-bold px-4 py-1.5 text-white transition-opacity disabled:opacity-50"
            style={{ background: "#0F9D6E", boxShadow: "0 3px 8px rgba(15,157,110,.25)" }}
          >
            Inviter l&apos;élève →
          </button>
        )}
      </div>

      {feedback && (
        <p
          className="text-xs mt-3 font-medium"
          style={{ color: feedback.startsWith("Invitation") ? "#065F46" : "#E05E5E" }}
        >
          {feedback}
        </p>
      )}
    </div>
  );
}
