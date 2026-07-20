"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  PERSONS,
  personsForTense,
  conjugate,
  type Tense,
  type PersonCode,
} from "@/lib/conjugation";
import { saveConjugations, type TenseForms } from "./actions";

type FormsState = Record<Tense, Record<string, string>>;

const TENSE_META: { id: Tense; ar: string; fr: string }[] = [
  { id: "madi", ar: "الماضي", fr: "Passé" },
  { id: "mudari", ar: "المضارع", fr: "Présent" },
  { id: "amr", ar: "الأمر", fr: "Impératif" },
];

export function ConjugationForm({
  studentId,
  vocabId,
  arabicWord,
  frenchDefinition,
  initial,
}: {
  studentId: string;
  vocabId: string;
  arabicWord: string;
  frenchDefinition: string;
  initial: FormsState;
}) {
  const router = useRouter();
  const [forms, setForms] = useState<FormsState>({
    madi: { ...initial.madi },
    mudari: { ...initial.mudari },
    amr: { ...initial.amr },
  });
  const [madiBase, setMadiBase] = useState<string>(initial.madi.huwa ?? "");
  const [mudariBase, setMudariBase] = useState<string>(initial.mudari.huwa ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);

  const setForm = (tense: Tense, code: string, value: string) =>
    setForms((f) => ({ ...f, [tense]: { ...f[tense], [code]: value } }));

  const prefillAll = () => {
    const m = madiBase.trim();
    const p = mudariBase.trim();
    // Le moteur a besoin des DEUX formes pour classer le verbe (sain, creux,
    // défectueux…) et conjuguer les 3 temps correctement.
    if (m && p) {
      const c = conjugate(m, p);
      setForms({ madi: c.madi, mudari: c.mudari, amr: c.amr as Record<string, string> });
    } else {
      setForms((f) => ({
        madi: m ? { ...f.madi, huwa: m } : f.madi,
        mudari: p ? { ...f.mudari, huwa: p } : f.mudari,
        amr: f.amr,
      }));
    }
    setMsg(null);
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const res = await saveConjugations(studentId, vocabId, forms as TenseForms);
    setSaving(false);
    setMsg(res);
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-5 pb-24">
      {/* En-tête verbe (rappel — déjà affiché dans le héros) */}
      <div className="rounded-[16px] p-4" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
        <div className="flex items-baseline gap-3">
          <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 26, fontWeight: 700, color: "var(--tk-ink-hero-to)" }}>
            {arabicWord}
          </span>
          <span style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>{frenchDefinition}</span>
        </div>
      </div>

      {/* Sources + pré-remplissage */}
      <button
        type="button"
        onClick={prefillAll}
        className="w-full flex items-center gap-3 rounded-[14px]"
        style={{ background: "rgba(14,74,56,.07)", border: "1px dashed rgba(14,74,56,.35)", padding: "13px 15px" }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tk-green-active)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l2.5 6.5L22 12l-6.5 2.5L13 21l-2.5-6.5L4 12l6.5-2.5Z" />
        </svg>
        <span className="flex-1 text-left font-semibold" style={{ fontSize: 12.5, color: "var(--tk-ink-hero-to)" }}>
          Pré-remplir les 3 temps
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-green-active)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <div className="rounded-[16px] p-4 space-y-3" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--tk-muted-olive)" }}>
          Sources (verbe sain)
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="space-y-1">
            <span style={{ fontSize: 11, color: "var(--tk-muted-olive)" }}>Passé — هو</span>
            <input
              value={madiBase}
              onChange={(e) => setMadiBase(e.target.value)}
              dir="rtl" lang="ar" placeholder="كَتَبَ"
              className="w-full rounded-[10px] px-3 py-2 outline-none"
              style={{ background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)", fontFamily: "var(--font-amiri)", fontSize: 19, color: "var(--tk-ink-text)" }}
            />
          </label>
          <label className="space-y-1">
            <span style={{ fontSize: 11, color: "var(--tk-muted-olive)" }}>Présent — هو</span>
            <input
              value={mudariBase}
              onChange={(e) => setMudariBase(e.target.value)}
              dir="rtl" lang="ar" placeholder="يَكْتُبُ"
              className="w-full rounded-[10px] px-3 py-2 outline-none"
              style={{ background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)", fontFamily: "var(--font-amiri)", fontSize: 19, color: "var(--tk-ink-text)" }}
            />
          </label>
        </div>
        <p style={{ fontSize: 11, color: "var(--tk-faint-olive)", lineHeight: 1.5 }}>
          Le présent et l’impératif se déduisent de la forme هو du présent. Relis
          chaque case (verbes faibles / hamza) — harakat obligatoires.
        </p>
      </div>

      {/* Grilles éditables par temps */}
      {TENSE_META.map((t) => {
        const persons = personsForTense(t.id);
        return (
          <div key={t.id}>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 15, color: "var(--tk-ink-text)" }}>{t.fr}</span>
              <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 16, color: "var(--tk-gold)" }}>{t.ar}</span>
              <span className="flex-1" style={{ height: 1, background: "linear-gradient(90deg,#D8C79E,transparent)" }} />
            </div>
            <div
              className="overflow-hidden rounded-[14px]"
              style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 12px 24px -18px rgba(10,20,15,.4)" }}
            >
              {persons.map((p, i) => (
                <div
                  key={p.code}
                  className="flex items-center justify-between gap-2 px-[15px] py-[11px]"
                  style={i < persons.length - 1 ? { borderBottom: "1px solid #EEE4CC" } : undefined}
                >
                  <span dir="rtl" lang="ar" className="shrink-0" style={{ fontFamily: "var(--font-amiri)", fontSize: 18, color: "var(--tk-ink-text-soft)" }}>
                    {p.pron}
                  </span>
                  <input
                    value={forms[t.id][p.code] ?? ""}
                    onChange={(e) => setForm(t.id, p.code, e.target.value)}
                    dir="rtl" lang="ar"
                    className="flex-1 text-right outline-none"
                    style={{ fontFamily: "var(--font-amiri)", fontSize: 20, fontWeight: 700, color: "var(--tk-ink-hero-to)", background: "transparent" }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {msg?.error && <p className="text-sm" style={{ color: "var(--tk-danger)" }}>{msg.error}</p>}
      {msg?.ok && <p className="text-sm" style={{ color: "var(--tk-green-active)" }}>Conjugaison enregistrée ✓</p>}

      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(to top, var(--tk-parchment) 70%, rgba(239,230,210,0))" }}
      >
        <div className="mx-auto max-w-lg">
          <button
            onClick={save}
            disabled={saving}
            className="w-full rounded-[14px] py-[15px] font-bold text-sm disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
              color: "var(--tk-ink-screen)",
              boxShadow: "0 14px 26px -12px rgba(199,154,62,.55)",
            }}
          >
            {saving ? "Enregistrement…" : "Enregistrer la conjugaison"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Ré-export pour le typage du parent.
export type { PersonCode };
export const ALL_PERSON_CODES = PERSONS.map((p) => p.code);
