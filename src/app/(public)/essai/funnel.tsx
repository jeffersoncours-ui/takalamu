"use client";

import { useState, useTransition } from "react";
import { fetchTrialSlots, requestTrial } from "./actions";
import type { AvailabilityRule } from "./actions";

type Gender = "m" | "f";
type Step = 1 | 2 | 3;

// ── Slot expansion ────────────────────────────────────────────────────────────

function expandSlots(
  availability: AvailabilityRule[],
  takenSlots: string[],
): Date[] {
  const takenSet = new Set(takenSlots.map((s) => new Date(s).toISOString()));
  const now = new Date();
  const result: Date[] = [];

  // Start from tomorrow UTC (teacher needs at least 1 day to prepare)
  const startUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const endUTC = new Date(startUTC.getTime() + 35 * 24 * 60 * 60 * 1000);

  for (
    let d = new Date(startUTC);
    d < endUTC;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    const dow = d.getUTCDay();
    for (const rule of availability) {
      if (rule.day_of_week !== dow) continue;
      const [sh, sm] = rule.start_time.split(":").map(Number);
      const [eh] = rule.end_time.split(":").map(Number);
      for (let h = sh; h < eh; h++) {
        const slot = new Date(
          Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, sm),
        );
        if (slot > now && !takenSet.has(slot.toISOString())) {
          result.push(slot);
        }
      }
    }
  }

  return result.sort((a, b) => a.getTime() - b.getTime());
}

type DayGroup = { label: string; slots: Date[] };

function groupByDay(slots: Date[]): DayGroup[] {
  const map = new Map<string, Date[]>();
  for (const s of slots) {
    const key = s.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Paris",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return Array.from(map.entries()).map(([label, daySlots]) => ({
    label,
    slots: daySlots,
  }));
}

function slotTime(slot: Date) {
  return slot.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as const).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-full text-xs font-bold transition-colors"
            style={{
              width: 28,
              height: 28,
              background: step >= n ? "#0F9D6E" : "#E9E3D8",
              color: step >= n ? "#fff" : "#8B857A",
            }}
          >
            {step > n ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : n}
          </div>
          {n < 3 && (
            <div
              style={{
                width: 32,
                height: 2,
                background: step > n ? "#0F9D6E" : "#E9E3D8",
                borderRadius: 1,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Step 1 — Genre ────────────────────────────────────────────────────────────

function GenderStep({
  onSelect,
  isPending,
  error,
}: {
  onSelect: (g: Gender) => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Cours d&apos;essai · Gratuit
        </p>
        <h1
          className="leading-tight mb-3"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 700,
            fontSize: 28,
            color: "#1C1A17",
          }}
        >
          Réserve ton cours d&apos;essai
        </h1>
        <p style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6 }}>
          1 heure en visio avec ton enseignant. Gratuit, sans engagement.
        </p>
      </div>

      <StepProgress step={1} />

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#fff",
          border: "1px solid #EFEAE0",
          boxShadow: "0 8px 24px rgba(28,26,23,.08)",
        }}
      >
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "#1C1A17" }}
        >
          Tu es…
        </p>
        <p className="text-xs mb-4" style={{ color: "#8B857A" }}>
          Chaque enseignant accompagne les élèves de son genre.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { value: "m", label: "Homme", sub: "Cours avec l'enseignant" },
              { value: "f", label: "Femme", sub: "Cours avec l'enseignante" },
            ] as const
          ).map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              disabled={isPending}
              onClick={() => onSelect(value)}
              className="flex flex-col items-center gap-1.5 rounded-xl p-5 border-2 transition-all disabled:opacity-60"
              style={{ borderColor: "#E9E3D8" }}
            >
              <span
                className="font-semibold text-sm"
                style={{ color: "#1C1A17" }}
              >
                {label}
              </span>
              <span className="text-xs" style={{ color: "#8B857A" }}>
                {sub}
              </span>
            </button>
          ))}
        </div>

        {isPending && (
          <p
            className="text-sm text-center mt-4"
            style={{ color: "#8B857A" }}
          >
            Chargement des créneaux…
          </p>
        )}

        {error && (
          <p
            className="text-sm font-medium mt-4"
            style={{ color: "#E05E5E" }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Step 2 — Créneau ──────────────────────────────────────────────────────────

function SlotStep({
  groups,
  selectedSlot,
  onSelect,
  onNext,
  onBack,
  isPending,
  error,
  noSlotsAvailable,
}: {
  groups: DayGroup[];
  selectedSlot: Date | null;
  onSelect: (s: Date) => void;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
  noSlotsAvailable: boolean;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Cours d&apos;essai · Gratuit
        </p>
        <h1
          className="leading-tight mb-3"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 700,
            fontSize: 28,
            color: "#1C1A17",
          }}
        >
          Choisis ton créneau
        </h1>
      </div>

      <StepProgress step={2} />

      <div
        className="rounded-2xl p-6"
        style={{
          background: "#fff",
          border: "1px solid #EFEAE0",
          boxShadow: "0 8px 24px rgba(28,26,23,.08)",
        }}
      >
        {noSlotsAvailable ? (
          <div className="text-center py-6">
            <p
              className="font-semibold mb-2"
              style={{ color: "#1C1A17", fontSize: 15 }}
            >
              Aucun créneau disponible pour l&apos;instant
            </p>
            <p style={{ color: "#8B857A", fontSize: 14, lineHeight: 1.6 }}>
              Laisse tes coordonnées à l&apos;étape suivante et on te
              recontacte pour fixer un créneau ensemble.
            </p>
          </div>
        ) : (
          <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
            {groups.map((g) => (
              <div key={g.label}>
                <p
                  className="text-xs font-bold uppercase mb-2"
                  style={{
                    color: "#8B857A",
                    letterSpacing: ".08em",
                    fontSize: 10,
                  }}
                >
                  {g.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.slots.map((slot) => {
                    const isSelected =
                      selectedSlot?.toISOString() === slot.toISOString();
                    return (
                      <button
                        key={slot.toISOString()}
                        type="button"
                        onClick={() => onSelect(slot)}
                        className="rounded-xl px-3 py-2 text-sm font-semibold border-2 transition-all"
                        style={
                          isSelected
                            ? {
                                background: "#0F9D6E",
                                borderColor: "#0F9D6E",
                                color: "#fff",
                                boxShadow: "0 4px 12px rgba(15,157,110,.25)",
                              }
                            : {
                                background: "#F7F4EE",
                                borderColor: "#E9E3D8",
                                color: "#4A463F",
                              }
                        }
                      >
                        {slotTime(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedSlot && !noSlotsAvailable && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: "#E8F7F1" }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0F9D6E"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <p className="text-sm font-semibold" style={{ color: "#065F46" }}>
              {selectedSlot.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Europe/Paris",
              })}{" "}
              à {slotTime(selectedSlot)}
            </p>
          </div>
        )}

        {error && (
          <p
            className="text-sm font-medium mt-3"
            style={{ color: "#E05E5E" }}
          >
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="button"
            onClick={onBack}
            className="flex-none rounded-full px-4 py-3 text-sm font-semibold border"
            style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
          >
            ← Retour
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={isPending || (!selectedSlot && !noSlotsAvailable)}
            className="flex-1 rounded-full text-white py-3 text-sm font-bold transition-opacity disabled:opacity-50"
            style={{
              background: "#0F9D6E",
              boxShadow: "0 6px 16px rgba(15,157,110,.28)",
            }}
          >
            Continuer →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Formulaire ───────────────────────────────────────────────────────

const LEVELS = [
  { value: "debutant", label: "Débutant complet, je ne connais pas l'alphabet" },
  { value: "bases", label: "Bases, je connais l'alphabet" },
  { value: "intermediaire", label: "Intermédiaire, je lis et je veux progresser" },
  { value: "avance", label: "Avancé, lecture courante et travail approfondi" },
] as const;

function FormStep({
  selectedSlot,
  onSubmit,
  onBack,
  isPending,
  error,
}: {
  selectedSlot: Date | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <div className="text-center mb-8">
        <p
          className="font-bold uppercase mb-3"
          style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
        >
          Cours d&apos;essai · Gratuit
        </p>
        <h1
          className="leading-tight mb-3"
          style={{
            fontFamily: "var(--font-barlow)",
            fontWeight: 700,
            fontSize: 28,
            color: "#1C1A17",
          }}
        >
          Tes informations
        </h1>
        {selectedSlot && (
          <p style={{ color: "#4A463F", fontSize: 14 }}>
            Créneau choisi :{" "}
            <strong>
              {selectedSlot.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "Europe/Paris",
              })}{" "}
              à {slotTime(selectedSlot)}
            </strong>
          </p>
        )}
      </div>

      <StepProgress step={3} />

      <form
        onSubmit={onSubmit}
        className="rounded-2xl p-6 space-y-4"
        style={{
          background: "#fff",
          border: "1px solid #EFEAE0",
          boxShadow: "0 8px 24px rgba(28,26,23,.08)",
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: "#1C1A17" }}
            >
              Prénom <span style={{ color: "#E05E5E" }}>*</span>
            </label>
            <input
              type="text"
              name="first_name"
              required
              placeholder="Mohammed"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
              style={{
                background: "#F7F4EE",
                border: "1.5px solid #E9E3D8",
                color: "#1C1A17",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-semibold mb-1.5"
              style={{ color: "#1C1A17" }}
            >
              Nom <span style={{ color: "#E05E5E" }}>*</span>
            </label>
            <input
              type="text"
              name="last_name"
              required
              placeholder="Dupont"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
              style={{
                background: "#F7F4EE",
                border: "1.5px solid #E9E3D8",
                color: "#1C1A17",
              }}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#1C1A17" }}
          >
            Adresse e-mail <span style={{ color: "#E05E5E" }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="exemple@mail.com"
            className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
            style={{
              background: "#F7F4EE",
              border: "1.5px solid #E9E3D8",
              color: "#1C1A17",
            }}
          />
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#1C1A17" }}
          >
            Ton niveau <span style={{ color: "#E05E5E" }}>*</span>
          </label>
          <select
            name="level"
            required
            className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
            style={{
              background: "#F7F4EE",
              border: "1.5px solid #E9E3D8",
              color: "#1C1A17",
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Choisir…
            </option>
            {LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            className="block text-sm font-semibold mb-1.5"
            style={{ color: "#1C1A17" }}
          >
            Message{" "}
            <span style={{ color: "#8B857A" }}>(optionnel)</span>
          </label>
          <textarea
            name="message"
            rows={3}
            placeholder="Tes objectifs, tes questions…"
            className="w-full rounded-xl px-3.5 py-3 text-sm outline-none resize-none"
            style={{
              background: "#F7F4EE",
              border: "1.5px solid #E9E3D8",
              color: "#1C1A17",
            }}
          />
        </div>

        {error && (
          <p className="text-sm font-medium" style={{ color: "#E05E5E" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex-none rounded-full px-4 py-3 text-sm font-semibold border"
            style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
          >
            ← Retour
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-full font-bold text-white py-3 text-sm transition-opacity disabled:opacity-60"
            style={{
              background: "#0F9D6E",
              boxShadow: "0 6px 16px rgba(15,157,110,.30)",
            }}
          >
            {isPending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Success ───────────────────────────────────────────────────────────────────

function SuccessScreen({ slot }: { slot: Date | null }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div
        className="flex items-center justify-center rounded-full mx-auto mb-6"
        style={{ width: 64, height: 64, background: "#E8F7F1" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0F9D6E"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1
        className="font-bold mb-3"
        style={{
          fontFamily: "var(--font-barlow)",
          fontSize: 26,
          color: "#1C1A17",
        }}
      >
        Demande reçue !
      </h1>
      {slot ? (
        <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65 }}>
          Ton cours d&apos;essai est prévu le{" "}
          <strong>
            {slot.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "Europe/Paris",
            })}{" "}
            à {slotTime(slot)}
          </strong>
          .<br />
          On te confirme par e-mail dans les 24 h.
        </p>
      ) : (
        <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65 }}>
          On te contactera très bientôt pour fixer le créneau.
          Vérifie ta boîte e-mail.
        </p>
      )}
    </div>
  );
}

// ── Main funnel ───────────────────────────────────────────────────────────────

export function EssaiFunnel() {
  const [step, setStep] = useState<Step>(1);
  const [gender, setGender] = useState<Gender | null>(null);
  const [availability, setAvailability] = useState<AvailabilityRule[]>([]);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Step 1 → 2: fetch slots for chosen gender
  function handleGenderSelect(g: Gender) {
    setGender(g);
    setError(null);
    startTransition(async () => {
      const data = await fetchTrialSlots(g);
      if (data.error) {
        setError(data.error);
        return;
      }
      setAvailability(data.availability);
      setTakenSlots(data.takenSlots);
      setStep(2);
    });
  }

  // Step 2 → 3
  function handleNext() {
    const slots = expandSlots(availability, takenSlots);
    const noSlots = slots.length === 0;
    if (!selectedSlot && !noSlots) {
      setError("Merci de choisir un créneau.");
      return;
    }
    setError(null);
    setStep(3);
  }

  // Step 3 submit
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!gender) return;
    const formData = new FormData(e.currentTarget);
    formData.set("gender", gender);
    if (selectedSlot) formData.set("scheduled_at", selectedSlot.toISOString());
    setError(null);
    startTransition(async () => {
      const result = await requestTrial({}, formData);
      if (result.error) setError(result.error);
      else if (result.success) setSuccess(true);
    });
  }

  if (success) {
    return (
      <div style={{ background: "#F7F4EE" }}>
        <SuccessScreen slot={selectedSlot} />
      </div>
    );
  }

  const slots = step >= 2 ? expandSlots(availability, takenSlots) : [];
  const groups = groupByDay(slots);
  const noSlots = step === 2 && slots.length === 0 && !isPending;

  return (
    <div style={{ background: "#F7F4EE" }}>
      {step === 1 && (
        <GenderStep
          onSelect={handleGenderSelect}
          isPending={isPending}
          error={error}
        />
      )}

      {step === 2 && (
        <SlotStep
          groups={groups}
          selectedSlot={selectedSlot}
          onSelect={(s) => { setSelectedSlot(s); setError(null); }}
          onNext={handleNext}
          onBack={() => { setStep(1); setError(null); }}
          isPending={isPending}
          error={error}
          noSlotsAvailable={noSlots}
        />
      )}

      {step === 3 && gender && (
        <FormStep
          selectedSlot={selectedSlot}
          onSubmit={handleSubmit}
          onBack={() => { setStep(2); setError(null); }}
          isPending={isPending}
          error={error}
        />
      )}
    </div>
  );
}
