"use client";

import { useState, useTransition } from "react";
import { verifyTrialCode, createEnrollment } from "./actions";
import { ANNUAL_PLANS, HOURLY_PRICE_EUROS } from "@/lib/pricing";

type Step = 1 | 2 | 3 | "pay";

type ProspectInfo = {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  trialId: string;
  trialCode: string;
};

// ── Progress ──────────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Code", "Abonnement", "Paiement"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {([1, 2, 3] as const).map((n, i) => (
        <div key={n} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
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
            <span className="text-xs font-medium" style={{ color: step >= n ? "#0F9D6E" : "#8B857A", fontSize: 10 }}>
              {labels[i]}
            </span>
          </div>
          {n < 3 && (
            <div style={{ width: 32, height: 2, background: step > n ? "#0F9D6E" : "#E9E3D8", borderRadius: 1, marginBottom: 16 }} />
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 8px 24px rgba(28,26,23,.08)" }}
    >
      {children}
    </div>
  );
}

function PageHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center mb-8">
      <p className="font-bold uppercase mb-3" style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}>
        Inscription
      </p>
      <h1 className="leading-tight mb-2" style={{ fontFamily: "var(--font-outfit)", fontWeight: 700, fontSize: 28, color: "#1C1A17" }}>
        {title}
      </h1>
      {sub && <p style={{ color: "#4A463F", fontSize: 14, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-none rounded-full px-4 py-3 text-sm font-semibold border"
      style={{ borderColor: "#D8D1C4", color: "#4A463F" }}
    >
      ← Retour
    </button>
  );
}

// ── Step 1 — Code d'essai ─────────────────────────────────────────────────────

function CodeStep({
  isPending,
  error,
  onVerify,
}: {
  isPending: boolean;
  error: string | null;
  onVerify: (code: string) => void;
}) {
  const [raw, setRaw] = useState("");

  function formatCode(val: string) {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8);
    if (clean.length > 4) return clean.slice(0, 4) + " " + clean.slice(4);
    return clean;
  }

  return (
    <div>
      <PageHeader
        title="Ton code d'essai"
        sub="Reçu par email après la confirmation de ton cours d'essai."
      />
      <StepProgress step={1} />
      <Card>
        <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>
          Code à 8 caractères
        </label>
        <input
          type="text"
          value={raw}
          onChange={(e) => setRaw(formatCode(e.target.value))}
          placeholder="XXXX XXXX"
          maxLength={9}
          autoCapitalize="characters"
          className="w-full rounded-xl px-4 py-3 text-center text-xl font-bold tracking-[.2em] outline-none mb-4"
          style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17", letterSpacing: ".2em" }}
          onKeyDown={(e) => { if (e.key === "Enter") onVerify(raw); }}
        />

        {error && (
          <p className="text-sm font-medium mb-3" style={{ color: "#E05E5E" }}>{error}</p>
        )}

        <button
          type="button"
          onClick={() => onVerify(raw)}
          disabled={isPending || raw.replace(/\s/g, "").length < 8}
          className="w-full rounded-full font-bold text-white py-3 text-sm transition-opacity disabled:opacity-50"
          style={{ background: "#0F9D6E", boxShadow: "0 6px 16px rgba(15,157,110,.28)" }}
        >
          {isPending ? "Vérification…" : "Valider mon code →"}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "#8B857A" }}>
          Pas encore de code ?{" "}
          <a href="/essai" style={{ color: "#0F9D6E", fontWeight: 600 }}>
            Réserve ton cours d&apos;essai gratuit
          </a>
        </p>
      </Card>
    </div>
  );
}

// ── Step 2 — Plan ─────────────────────────────────────────────────────────────

function PlanStep({
  selectedPlan,
  onSelect,
  onNext,
  onBack,
  isPending,
}: {
  selectedPlan: string | null;
  onSelect: (plan: string) => void;
  onNext: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  return (
    <div>
      <PageHeader title="Ton abonnement" />
      <StepProgress step={2} />
      <Card>
        <div className="space-y-3 mb-4">
          {/* Annual card */}
          <div
            className="rounded-xl border-2 overflow-hidden cursor-pointer transition-all"
            style={{ borderColor: ANNUAL_PLANS.some((p) => p.key === selectedPlan) ? "#0F9D6E" : "#E9E3D8" }}
          >
            <div
              className="px-4 py-3"
              style={{ background: ANNUAL_PLANS.some((p) => p.key === selectedPlan) ? "#E8F7F1" : "#F7F4EE" }}
            >
              <p className="font-bold text-sm" style={{ color: "#1C1A17" }}>Abonnement annuel</p>
              <p className="text-xs mt-0.5" style={{ color: "#8B857A" }}>4 cours par mois · à partir de 52 €/mois</p>
            </div>
            <div className="p-2 space-y-1.5">
              {ANNUAL_PLANS.map((p) => {
                const isSelected = selectedPlan === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onSelect(p.key)}
                    className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-left transition-all"
                    style={{
                      background: isSelected ? "#0F9D6E" : "#fff",
                      border: `1.5px solid ${isSelected ? "#0F9D6E" : "#E9E3D8"}`,
                    }}
                  >
                    <div>
                      <span className="text-sm font-semibold" style={{ color: isSelected ? "#fff" : "#1C1A17" }}>
                        {p.label}
                      </span>
                      <span className="text-xs ml-2" style={{ color: isSelected ? "rgba(255,255,255,.7)" : "#8B857A" }}>
                        {p.pricePerMonth} €/mois
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ color: isSelected ? "#fff" : "#0F9D6E" }}>
                      {p.installmentAmount} €
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hourly card */}
          <button
            type="button"
            onClick={() => onSelect("hourly")}
            className="w-full rounded-xl border-2 p-4 text-left transition-all"
            style={{
              borderColor: selectedPlan === "hourly" ? "#0F9D6E" : "#E9E3D8",
              background: selectedPlan === "hourly" ? "#E8F7F1" : "#fff",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm" style={{ color: "#1C1A17" }}>À l&apos;heure</p>
                <p className="text-xs mt-0.5" style={{ color: "#8B857A" }}>Sans engagement · réservation à la séance</p>
              </div>
              <span className="text-lg font-bold" style={{ color: "#0F9D6E" }}>{HOURLY_PRICE_EUROS} €</span>
            </div>
          </button>
        </div>

        <div className="flex gap-3">
          <BackBtn onClick={onBack} />
          <button
            type="button"
            onClick={onNext}
            disabled={!selectedPlan || isPending}
            className="flex-1 rounded-full font-bold text-white py-3 text-sm transition-opacity disabled:opacity-50"
            style={{ background: "#0F9D6E", boxShadow: "0 6px 16px rgba(15,157,110,.28)" }}
          >
            Continuer →
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── Step 3 — Confirmation + paiement ─────────────────────────────────────────

function planLabel(plan: string): string {
  if (plan === "hourly") return "Heure à la carte, 15 €";
  const p = ANNUAL_PLANS.find((a) => a.key === plan);
  if (!p) return plan;
  return `Abonnement annuel · ${p.label}, ${p.installmentAmount} € maintenant`;
}

function ConfirmStep({
  plan,
  firstName,
  lastName,
  email,
  onFirstName,
  onLastName,
  onEmail,
  onSubmit,
  onBack,
  isPending,
  error,
}: {
  plan: string;
  firstName: string;
  lastName: string;
  email: string;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onEmail: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div>
      <PageHeader title="Récapitulatif" />
      <StepProgress step={3} />
      <Card>
        {/* Plan summary */}
        <div
          className="rounded-xl px-4 py-3 mb-5"
          style={{ background: "#E8F7F1" }}
        >
          <p className="text-xs font-semibold uppercase mb-0.5" style={{ color: "#065F46", letterSpacing: ".06em", fontSize: 10 }}>
            Abonnement choisi
          </p>
          <p className="font-bold text-sm" style={{ color: "#1C1A17" }}>
            {planLabel(plan)}
          </p>
        </div>

        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>Prénom</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => onFirstName(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>Nom</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => onLastName(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
                style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmail(e.target.value)}
              required
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none"
              style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
            />
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium mb-3" style={{ color: "#E05E5E" }}>{error}</p>
        )}

        <div className="flex gap-3">
          <BackBtn onClick={onBack} />
          <button
            type="button"
            onClick={onSubmit}
            disabled={isPending || !firstName || !lastName || !email}
            className="flex-1 rounded-full font-bold text-white py-3 text-sm transition-opacity disabled:opacity-50"
            style={{ background: "#0F9D6E", boxShadow: "0 6px 16px rgba(15,157,110,.28)" }}
          >
            {isPending ? "Création de la commande…" : "Procéder au paiement →"}
          </button>
        </div>
      </Card>
    </div>
  );
}

// ── Écran de paiement (PayPal.Me) ────────────────────────────────────────────

function PayScreen({
  orderRef,
  amountCents,
  paypalUrl,
}: {
  orderRef: string;
  amountCents: number;
  paypalUrl: string | null;
}) {
  const amount = (amountCents / 100).toFixed(2).replace(".", ",");
  return (
    <div className="text-center py-10">
      <div
        className="flex items-center justify-center rounded-full mx-auto mb-6"
        style={{ width: 64, height: 64, background: "#E8F7F1" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h2 className="font-bold mb-3" style={{ fontFamily: "var(--font-outfit)", fontSize: 24, color: "#1C1A17" }}>
        Commande créée !
      </h2>
      <p className="mb-4" style={{ color: "#4A463F", fontSize: 15 }}>
        Montant à régler : <strong>{amount} €</strong>
      </p>
      <div
        className="inline-block rounded-2xl px-6 py-4 mb-4"
        style={{ background: "#F7F4EE", border: "2px solid #E9E3D8" }}
      >
        <code className="font-bold tracking-widest" style={{ fontSize: 22, color: "#1C1A17", letterSpacing: ".15em" }}>
          {orderRef}
        </code>
      </div>

      {paypalUrl ? (
        <>
          <p className="mb-5" style={{ color: "#8B857A", fontSize: 13, lineHeight: 1.65 }}>
            Indique bien cette référence dans la <strong>note du paiement PayPal</strong> :
            <br />
            c&apos;est elle qui permet de valider ton règlement.
          </p>
          <a
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full font-bold text-white px-8 py-3.5 text-sm"
            style={{ background: "#0F9D6E", boxShadow: "0 6px 16px rgba(15,157,110,.28)" }}
          >
            Payer {amount} € via PayPal →
          </a>
          <p className="mt-5" style={{ color: "#8B857A", fontSize: 13, lineHeight: 1.65 }}>
            Le lien t&apos;a aussi été envoyé par email.
            <br />
            Dès réception du paiement, tu recevras ton invitation pour créer ton compte.
          </p>
        </>
      ) : (
        <p style={{ color: "#8B857A", fontSize: 13, lineHeight: 1.65 }}>
          Ton enseignant va t&apos;envoyer un lien de paiement personnalisé par email.
          <br />
          Conserve cette référence.
        </p>
      )}
    </div>
  );
}

// ── Funnel principal ──────────────────────────────────────────────────────────

export function InscriptionFunnel({ initialPlan = null }: { initialPlan?: string | null }) {
  const [step, setStep] = useState<Step>(1);
  const [prospect, setProspect] = useState<ProspectInfo | null>(null);
  const [plan, setPlan] = useState<string | null>(initialPlan);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<{
    orderRef: string;
    amountCents: number;
    paypalUrl: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleVerify(code: string) {
    setError(null);
    startTransition(async () => {
      const res = await verifyTrialCode(code);
      if (!res.valid) { setError(res.error); return; }
      setProspect({ ...res, trialCode: code.replace(/\s/g, "").toUpperCase() });
      setFirstName(res.firstName);
      setLastName(res.lastName);
      setEmail(res.email);
      setStep(2);
    });
  }

  function handleSubmit() {
    if (!prospect || !plan) return;
    setError(null);
    startTransition(async () => {
      const res = await createEnrollment({
        trialCode: prospect.trialCode,
        trialId: prospect.trialId,
        plan,
        firstName,
        lastName,
        email,
      });
      if (!res.ok) { setError(res.error); return; }
      setResult({ orderRef: res.orderRef, amountCents: res.amountCents, paypalUrl: res.paypalUrl });
      setStep("pay");
    });
  }

  return (
    <div style={{ background: "#F7F4EE" }}>
      <div className="mx-auto max-w-lg px-4 py-12">
        {step === 1 && (
          <CodeStep isPending={isPending} error={error} onVerify={handleVerify} />
        )}

        {step === 2 && (
          <PlanStep
            selectedPlan={plan}
            onSelect={setPlan}
            onNext={() => { if (plan) { setError(null); setStep(3); } }}
            onBack={() => { setStep(1); setError(null); }}
            isPending={isPending}
          />
        )}

        {step === 3 && prospect && plan && (
          <ConfirmStep
            plan={plan}
            firstName={firstName}
            lastName={lastName}
            email={email}
            onFirstName={setFirstName}
            onLastName={setLastName}
            onEmail={setEmail}
            onSubmit={handleSubmit}
            onBack={() => { setStep(2); setError(null); }}
            isPending={isPending}
            error={error}
          />
        )}

        {step === "pay" && result && (
          <PayScreen
            orderRef={result.orderRef}
            amountCents={result.amountCents}
            paypalUrl={result.paypalUrl}
          />
        )}
      </div>
    </div>
  );
}
