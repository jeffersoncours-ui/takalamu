"use client";

import { useActionState } from "react";
import { requestTrial } from "./actions";
import type { Metadata } from "next";

// Note: metadata cannot be exported from a "use client" file.
// SEO is handled via the parent layout's title template.

type State = { error?: string; success?: boolean };
const initial: State = {};

export default function EssaiPage() {
  const [state, action, pending] = useActionState(requestTrial, initial);

  if (state.success) {
    return (
      <div style={{ background: "#F7F4EE" }}>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div
            className="flex items-center justify-center rounded-full mx-auto mb-6"
            style={{ width: 64, height: 64, background: "#E8F7F1" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            className="font-bold mb-3"
            style={{ fontFamily: "var(--font-spectral)", fontSize: 26, color: "#1C1A17" }}
          >
            Demande reçue !
          </h1>
          <p style={{ color: "#4A463F", fontSize: 16, lineHeight: 1.65 }}>
            On te contactera très bientôt pour fixer le créneau de ton cours d&apos;essai.
            Vérifie ta boîte e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F7F4EE" }}>
      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <p
            className="font-bold uppercase mb-3"
            style={{ color: "#0F9D6E", fontSize: 11, letterSpacing: ".14em" }}
          >
            Cours d&apos;essai · Gratuit
          </p>
          <h1
            className="leading-tight mb-3"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 30, color: "#1C1A17" }}
          >
            Réserve ton cours d&apos;essai
          </h1>
          <p style={{ color: "#4A463F", fontSize: 15, lineHeight: 1.6 }}>
            1 heure en visio avec ton enseignant. Gratuit, sans engagement.
            On te contacte pour fixer le créneau.
          </p>
        </div>

        {/* Form */}
        <form
          action={action}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 8px 24px rgba(28,26,23,.08)" }}
        >
          {/* Gender — first so teacher assignment is clear */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: "#1C1A17" }}>
              Genre <span style={{ color: "#E05E5E" }}>*</span>
            </label>
            <p className="text-xs mb-3" style={{ color: "#8B857A" }}>
              Détermine avec quel enseignant tu seras mis(e) en relation.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "m", label: "Homme", sub: "Cours avec l'enseignant" },
                { value: "f", label: "Femme", sub: "Cours avec l'enseignante" },
              ] as const).map(({ value, label, sub }) => (
                <label
                  key={value}
                  className="flex flex-col items-center gap-1 rounded-xl p-4 cursor-pointer border-2 transition-colors"
                  style={{ borderColor: "#E9E3D8" }}
                >
                  <input type="radio" name="gender" value={value} required className="sr-only" />
                  <span className="font-semibold text-sm" style={{ color: "#1C1A17" }}>{label}</span>
                  <span className="text-xs" style={{ color: "#8B857A" }}>{sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>
                Prénom <span style={{ color: "#E05E5E" }}>*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                placeholder="Mohammed"
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-shadow"
                style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>
                Nom <span style={{ color: "#E05E5E" }}>*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                placeholder="Dupont"
                className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-shadow"
                style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>
              Adresse e-mail <span style={{ color: "#E05E5E" }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="exemple@mail.com"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-shadow"
              style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "#1C1A17" }}>
              Message <span style={{ color: "#8B857A" }}>(optionnel)</span>
            </label>
            <textarea
              name="message"
              rows={3}
              placeholder="Ton niveau actuel, tes objectifs, tes disponibilités…"
              className="w-full rounded-xl px-3.5 py-3 text-sm outline-none transition-shadow resize-none"
              style={{ background: "#F7F4EE", border: "1.5px solid #E9E3D8", color: "#1C1A17" }}
            />
          </div>

          {state.error && (
            <p className="text-sm font-medium" style={{ color: "#E05E5E" }}>
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full font-bold text-white py-3.5 text-sm transition-opacity disabled:opacity-60"
            style={{ background: "#0F9D6E", boxShadow: "0 6px 16px rgba(15,157,110,.30)" }}
          >
            {pending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>

          <p className="text-xs text-center" style={{ color: "#8B857A" }}>
            On te contactera sous 24 h pour fixer le créneau et les modalités de paiement.
          </p>
        </form>
      </div>
    </div>
  );
}
