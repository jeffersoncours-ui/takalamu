"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  PERSONS,
  personsForTense,
  prefillMadi,
  prefillMudari,
  prefillAmr,
  type Tense,
  type PersonCode,
} from "@/lib/conjugation";
import { saveConjugations, type TenseForms } from "./actions";

const GREEN = "#0F9D6E";

type FormsState = Record<Tense, Record<string, string>>;

const emptyForms = (): FormsState => ({ madi: {}, mudari: {}, amr: {} });

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
    const next = emptyForms();
    if (madiBase.trim()) next.madi = prefillMadi(madiBase.trim());
    if (mudariBase.trim()) {
      next.mudari = prefillMudari(mudariBase.trim());
      next.amr = prefillAmr(mudariBase.trim()) as Record<string, string>;
    }
    // On ne remplace que les temps dont la forme source est fournie.
    setForms((f) => ({
      madi: madiBase.trim() ? next.madi : f.madi,
      mudari: mudariBase.trim() ? next.mudari : f.mudari,
      amr: mudariBase.trim() ? next.amr : f.amr,
    }));
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
    <div className="space-y-5">
      {/* En-tête verbe */}
      <div className="rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <div className="flex items-baseline gap-3">
          <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 26, fontWeight: 700, color: "#0A553F" }}>
            {arabicWord}
          </span>
          <span style={{ color: "#8B857A", fontSize: 13 }}>{frenchDefinition}</span>
        </div>
      </div>

      {/* Sources + pré-remplissage */}
      <div className="rounded-[16px] p-4 space-y-3" style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#8B857A" }}>
          Pré-remplir automatiquement (verbe sain)
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="space-y-1">
            <span style={{ fontSize: 11, color: "#8B857A" }}>Passé — هو</span>
            <input
              value={madiBase}
              onChange={(e) => setMadiBase(e.target.value)}
              dir="rtl" lang="ar" placeholder="كَتَبَ"
              className="w-full rounded-[10px] px-3 py-2 outline-none"
              style={{ background: "#fff", border: "1.5px solid #E9E3D8", fontFamily: "var(--font-amiri)", fontSize: 19, color: "#1C1A17" }}
            />
          </label>
          <label className="space-y-1">
            <span style={{ fontSize: 11, color: "#8B857A" }}>Présent — هو</span>
            <input
              value={mudariBase}
              onChange={(e) => setMudariBase(e.target.value)}
              dir="rtl" lang="ar" placeholder="يَكْتُبُ"
              className="w-full rounded-[10px] px-3 py-2 outline-none"
              style={{ background: "#fff", border: "1.5px solid #E9E3D8", fontFamily: "var(--font-amiri)", fontSize: 19, color: "#1C1A17" }}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={prefillAll}
          className="w-full rounded-[12px] py-2.5 font-semibold text-sm text-white transition-opacity hover:opacity-85"
          style={{ background: "#0A553F" }}
        >
          Pré-remplir les 3 temps
        </button>
        <p style={{ fontSize: 11, color: "#8B857A", lineHeight: 1.5 }}>
          Le présent et l’impératif se déduisent de la forme هو du présent. Relis
          chaque case (verbes faibles / hamza) — harakat obligatoires.
        </p>
      </div>

      {/* Grilles éditables par temps */}
      {TENSE_META.map((t) => {
        const persons = personsForTense(t.id);
        return (
          <div key={t.id} className="rounded-[16px] p-4 space-y-2" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
            <p className="flex items-baseline gap-2">
              <span dir="rtl" lang="ar" style={{ fontFamily: "var(--font-amiri)", fontSize: 17, color: "#0A553F", fontWeight: 700 }}>{t.ar}</span>
              <span style={{ fontSize: 12, color: "#8B857A" }}>{t.fr}</span>
            </p>
            <div className="space-y-1.5">
              {persons.map((p) => (
                <div key={p.code} className="flex items-center gap-2">
                  <span dir="rtl" lang="ar" className="shrink-0 text-right" style={{ width: 78, fontFamily: "var(--font-amiri)", fontSize: 16, color: "#8B857A" }}>
                    {p.pron}
                  </span>
                  <input
                    value={forms[t.id][p.code] ?? ""}
                    onChange={(e) => setForm(t.id, p.code, e.target.value)}
                    dir="rtl" lang="ar"
                    className="flex-1 rounded-[10px] px-3 py-1.5 outline-none"
                    style={{ background: "#FBF9F5", border: "1.5px solid #E9E3D8", fontFamily: "var(--font-amiri)", fontSize: 19, color: "#1C1A17" }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {msg?.error && <p className="text-sm" style={{ color: "#B4292E" }}>{msg.error}</p>}
      {msg?.ok && <p className="text-sm" style={{ color: "#0A6B4E" }}>Conjugaison enregistrée ✓</p>}

      <button
        onClick={save}
        disabled={saving}
        className="w-full rounded-[14px] py-3.5 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: GREEN }}
      >
        {saving ? "Enregistrement…" : "Enregistrer la conjugaison"}
      </button>
    </div>
  );
}

// Ré-export pour le typage du parent.
export type { PersonCode };
export const ALL_PERSON_CODES = PERSONS.map((p) => p.code);
