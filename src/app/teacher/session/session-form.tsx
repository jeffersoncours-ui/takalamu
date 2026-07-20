"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { AudioRecorderInput } from "@/components/audio-recorder-input";
import { submitSession } from "./actions";

type Student = {
  id: string;
  name: string;
  status: string;
};

type Book = { id: string; title: string; subtitle: string | null };

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid var(--tk-parchment-border)",
  background: "var(--tk-parchment-card)",
  padding: "11px 14px",
  fontSize: 13.5,
  color: "var(--tk-ink-text)",
  outline: "none",
};

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-spectral)",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--tk-gold)",
  textTransform: "uppercase",
  letterSpacing: ".18em",
};

/** Valeur datetime-local (heure locale du navigateur) à l'instant présent. */
function nowLocalValue(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function SessionForm({
  students,
  books,
  defaultStudentId,
}: {
  students: Student[];
  books: Book[];
  defaultStudentId?: string;
}) {
  const [state, formAction, pending] = useActionState(submitSession, {});
  const [bookId, setBookId] = useState<string>(books.length === 1 ? books[0].id : "");

  const [selectedIds, setSelectedIds] = useState<string[]>(
    defaultStudentId && students.some((s) => s.id === defaultStudentId)
      ? [defaultStudentId]
      : []
  );
  const toggleStudent = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const [dateLocal, setDateLocal] = useState(nowLocalValue());

  // Lignes dynamiques (compteurs d'identité React, valeurs lues côté serveur).
  const [vocabRows, setVocabRows] = useState<number[]>([]);
  const [grammarRows, setGrammarRows] = useState<number[]>([]);
  const [formRows, setFormRows] = useState<number[]>([]);
  const [nextId, setNextId] = useState(1);
  const addRow = (set: React.Dispatch<React.SetStateAction<number[]>>) => {
    set((rows) => [...rows, nextId]);
    setNextId((n) => n + 1);
  };
  const removeRow = (set: React.Dispatch<React.SetStateAction<number[]>>, id: number) =>
    set((rows) => rows.filter((r) => r !== id));

  const sessionIso = useMemo(() => {
    const t = Date.parse(dateLocal);
    return Number.isNaN(t) ? "" : new Date(t).toISOString();
  }, [dateLocal]);

  return (
    <form action={formAction} className="space-y-5 pb-28">
      {/* Élève(s) — sélection multiple : la même fiche s'applique à chacun */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span style={sectionLabel}>
            Élève(s){selectedIds.length > 0 ? ` · ${selectedIds.length} sélectionné${selectedIds.length > 1 ? "s" : ""}` : ""}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {students.map((s) => {
            const checked = selectedIds.includes(s.id);
            return (
              <label
                key={s.id}
                className="flex items-center gap-2.5 rounded-[12px] px-3.5 py-3 transition-colors"
                style={
                  checked
                    ? { border: "1.5px solid var(--tk-emerald-btn-from)", background: "linear-gradient(180deg, rgba(14,74,56,.1), rgba(12,58,44,.07))" }
                    : { border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)" }
                }
              >
                <span
                  className="flex shrink-0 items-center justify-center rounded-[6px]"
                  style={
                    checked
                      ? { width: 20, height: 20, background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))" }
                      : { width: 20, height: 20, border: "1.5px solid #CFB98A" }
                  }
                >
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  name="student_ids"
                  value={s.id}
                  checked={checked}
                  onChange={() => toggleStudent(s.id)}
                  className="sr-only"
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: checked ? "var(--tk-ink-hero-to)" : "#3C4A3F" }}>
                  {s.name}
                  {s.status !== "active" ? " (suspendu)" : ""}
                </span>
              </label>
            );
          })}
        </div>
        <p style={{ color: "var(--tk-faint-olive)", fontSize: 11 }}>
          Coche plusieurs élèves pour créer la même séance (vocabulaire, grammaire, devoir, récap, supports) pour chacun en une seule saisie.
        </p>
      </div>

      {/* Date de séance */}
      <div className="space-y-1.5">
        <label htmlFor="session_date" style={sectionLabel}>Date de la séance</label>
        <input
          id="session_date"
          type="datetime-local"
          value={dateLocal}
          onChange={(e) => setDateLocal(e.target.value)}
          style={inputStyle}
        />
        <input type="hidden" name="session_date_iso" value={sessionIso} />
      </div>

      {/* Nom du cours */}
      <div className="space-y-1.5">
        <label htmlFor="custom_title" style={sectionLabel}>Nom du cours</label>
        <input
          id="custom_title"
          name="custom_title"
          type="text"
          required
          placeholder="ex. Les couleurs, Le passé simple…"
          style={inputStyle}
        />
      </div>

      {/* Livre (obligatoire) — la grammaire est rangée automatiquement */}
      <div className="space-y-2">
        <span style={sectionLabel}>Livre</span>
        <input type="hidden" name="book_id" value={bookId} />
        <div className="flex flex-wrap gap-2">
          {books.map((b) => {
            const active = bookId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBookId(b.id)}
                className="flex-1 text-center transition-colors"
                style={
                  active
                    ? { minWidth: 130, border: "1.5px solid var(--tk-emerald-btn-from)", background: "linear-gradient(180deg, rgba(14,74,56,.1), rgba(12,58,44,.07))", borderRadius: 12, padding: 11 }
                    : { minWidth: 130, border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)", borderRadius: 12, padding: 11 }
                }
              >
                <span dir="rtl" lang="ar" className="block font-arabic font-bold" style={{ fontSize: 17, color: active ? "var(--tk-ink-hero-to)" : "var(--tk-ink-text-soft)" }}>
                  {b.title}
                </span>
                {b.subtitle && (
                  <span className="block mt-0.5" style={{ fontSize: 12, color: "var(--tk-muted-olive)" }}>{b.subtitle}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Récap public */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <label htmlFor="public_recap" style={sectionLabel}>Récap public</label>
          <span
            className="inline-flex items-center gap-1 rounded-full"
            style={{ padding: "2px 8px", background: "rgba(46,90,138,.12)", border: "1px solid rgba(46,90,138,.35)", color: "var(--tk-info)", fontSize: 10, fontWeight: 700 }}
          >
            Vu par l&apos;élève
          </span>
        </div>
        <textarea id="public_recap" name="public_recap" rows={2} style={{ ...inputStyle, resize: "none" }} />
      </div>

      {/* Vocabulaire */}
      <div
        className="space-y-2.5 rounded-[16px] p-4"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink-text)" }}>Vocabulaire</span>
          <button
            type="button"
            onClick={() => addRow(setVocabRows)}
            className="font-bold"
            style={{ color: "var(--tk-green-active)", fontSize: 11 }}
          >
            + Mot
          </button>
        </div>
        {vocabRows.map((id) => (
          <div key={id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "var(--tk-parchment-field)" }}>
            <div className="grid grid-cols-2 gap-2">
              <input name="vocab_arabic" placeholder="mot (ar)" dir="rtl" className="font-arabic" style={inputStyle} />
              <input name="vocab_french" placeholder="définition (fr)" style={inputStyle} />
            </div>
            <button
              type="button"
              onClick={() => removeRow(setVocabRows, id)}
              style={{ color: "var(--tk-faint-olive)", fontSize: 12 }}
            >
              Retirer
            </button>
          </div>
        ))}
      </div>

      {/* Grammaire */}
      <div
        className="space-y-2.5 rounded-[16px] p-4"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
      >
        <span className="block" style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink-text)" }}>Règles de grammaire</span>
        {grammarRows.map((id, idx) => (
          <div key={id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "var(--tk-parchment-field)" }}>
            <input name="grammar_title" placeholder="titre" style={inputStyle} />
            <textarea name="grammar_content" placeholder="contenu" rows={2} style={{ ...inputStyle, resize: "none" }} />
            <div className="space-y-1">
              <span style={{ color: "var(--tk-muted-olive)", fontSize: 12 }}>Photos de cette règle (optionnel)</span>
              <input
                name={`grammar_photos_${idx}`}
                type="file"
                accept="image/*"
                multiple
                className="block w-full text-xs file:mr-2 file:rounded-[8px] file:border-0 file:px-2.5 file:py-1 file:font-semibold file:cursor-pointer"
                style={{ color: "var(--tk-ink-text-soft)" }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeRow(setGrammarRows, id)}
              style={{ color: "var(--tk-faint-olive)", fontSize: 12 }}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addRow(setGrammarRows)}
          className="font-bold"
          style={{ color: "var(--tk-green-active)", fontSize: 13 }}
        >
          + Règle
        </button>
      </div>

      {/* Formulation (expressions ar ↔ fr) */}
      <div
        className="space-y-2.5 rounded-[16px] p-4"
        style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
      >
        <span className="block" style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 16, color: "var(--tk-ink-text)" }}>Formulation (expressions)</span>
        {formRows.map((id) => (
          <div key={id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "var(--tk-parchment-field)" }}>
            <input name="form_arabic" placeholder="expression (ar)" dir="rtl" className="font-arabic" style={inputStyle} />
            <input name="form_french" placeholder="traduction (fr)" style={inputStyle} />
            <div className="flex items-center justify-between gap-2">
              <AudioRecorderInput name="form_audio" />
              <button
                type="button"
                onClick={() => removeRow(setFormRows, id)}
                style={{ color: "var(--tk-faint-olive)", fontSize: 12 }}
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addRow(setFormRows)}
          className="font-bold"
          style={{ color: "var(--tk-green-active)", fontSize: 13 }}
        >
          + Formulation
        </button>
      </div>

      {/* Devoir */}
      <div className="space-y-1.5">
        <label htmlFor="homework_instructions" style={sectionLabel}>Devoir (optionnel)</label>
        <textarea
          id="homework_instructions"
          name="homework_instructions"
          rows={2}
          placeholder="Consignes — laisser vide pour ne pas créer de devoir."
          style={{ ...inputStyle, resize: "none" }}
        />
      </div>

      {/* Note privée — zone ambre à cadenas */}
      <div
        className="space-y-1.5 rounded-[16px] p-4"
        style={{ background: "rgba(184,120,42,.08)", border: "1px solid rgba(184,120,42,.3)" }}
      >
        <label htmlFor="private_note" className="flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tk-gold-darker)", textTransform: "uppercase", letterSpacing: ".14em" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tk-warning)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Note privée — non visible par l&apos;élève
        </label>
        <textarea
          id="private_note"
          name="private_note"
          rows={2}
          style={{ ...inputStyle, background: "rgba(255,255,255,.5)", border: "1px solid rgba(184,120,42,.25)", resize: "none" }}
        />
      </div>

      {/* Supports de séance */}
      <div className="space-y-1.5">
        <label htmlFor="support_files" style={sectionLabel}>
          Supports (optionnel)
        </label>
        <input
          id="support_files"
          name="support_files"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp3,.mp4"
          className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:px-3 file:py-1.5 file:font-semibold file:cursor-pointer"
          style={{ color: "var(--tk-ink-text-soft)" }}
        />
        <p style={{ color: "var(--tk-faint-olive)", fontSize: 11 }}>
          PDF, Word, image ou audio — max 20 Mo par fichier
        </p>
      </div>

      {state?.error ? (
        <p style={{ color: "var(--tk-danger)", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      {/* Barre d'enregistrement collante */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(to top, var(--tk-parchment) 70%, rgba(239,230,210,0))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-2.5">
          <Link
            href="/teacher"
            className="flex h-[52px] items-center justify-center rounded-[14px] px-5 font-semibold"
            style={{ color: "var(--tk-ink-text-soft)", fontSize: 14, border: "1px solid var(--tk-parchment-border)", background: "var(--tk-parchment-card)" }}
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={pending || selectedIds.length === 0 || !bookId}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[14px] font-bold disabled:opacity-60"
            style={{
              background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
              color: "var(--tk-ink-screen)",
              fontSize: 14.5,
              boxShadow: "0 14px 26px -12px rgba(199,154,62,.55)",
            }}
          >
            {pending
              ? "Enregistrement…"
              : selectedIds.length > 1
              ? `Enregistrer pour ${selectedIds.length} élèves`
              : selectedIds.length === 1
              ? "Enregistrer pour 1 élève"
              : "Enregistrer la séance"}
          </button>
        </div>
      </div>
    </form>
  );
}
