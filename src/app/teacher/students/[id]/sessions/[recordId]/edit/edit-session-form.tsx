"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { AudioRecorderInput } from "@/components/audio-recorder-input";
import { updateSession } from "./actions";

type SupportFile = { path: string; name: string };
type Book = { id: string; title: string; subtitle: string | null };
type VocabRow = { id: string; arabic_word: string; french_definition: string };
type GrammarRow = { id: string; title: string; content: string; photos: SupportFile[]; ruleGroupId: string };
type FormulationRow = { id: string; arabic_text: string; french_text: string; audio_path: string | null };

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 13,
  border: "1.5px solid #E9E3D8",
  background: "#fff",
  padding: "11px 14px",
  fontSize: 14,
  color: "#1C1A17",
  outline: "none",
};

const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#8B857A",
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

/** Valeur datetime-local (heure locale du navigateur) depuis un ISO. */
function toLocalValue(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function EditSessionForm({
  studentId,
  recordId,
  studentName,
  sessionDateIso,
  customTitle,
  books,
  currentBookId,
  publicRecap,
  privateNote,
  homeworkInstructions,
  homeworkTouched,
  vocab,
  grammar,
  formulations,
  supportFiles,
}: {
  studentId: string;
  recordId: string;
  studentName: string;
  sessionDateIso: string;
  customTitle: string;
  books: Book[];
  currentBookId: string;
  publicRecap: string;
  privateNote: string;
  homeworkInstructions: string;
  homeworkTouched: boolean;
  vocab: VocabRow[];
  grammar: GrammarRow[];
  formulations: FormulationRow[];
  supportFiles: SupportFile[];
}) {
  const boundAction = updateSession.bind(null, studentId, recordId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  const [dateLocal, setDateLocal] = useState(toLocalValue(sessionDateIso));
  const [bookId, setBookId] = useState<string>(
    currentBookId || (books.length === 1 ? books[0].id : ""),
  );

  const [vocabRows, setVocabRows] = useState(
    vocab.map((v) => ({ id: v.id, arabic_word: v.arabic_word, french_definition: v.french_definition }))
  );
  const [grammarRows, setGrammarRows] = useState(
    grammar.map((g) => ({ id: g.id, title: g.title, content: g.content, photos: g.photos, ruleGroupId: g.ruleGroupId }))
  );
  const [formRows, setFormRows] = useState(
    formulations.map((f) => ({
      id: f.id,
      arabic_text: f.arabic_text,
      french_text: f.french_text,
      audio_path: f.audio_path,
    }))
  );
  const [nextId, setNextId] = useState(-1);
  const [keptFiles, setKeptFiles] = useState<Set<string>>(new Set(supportFiles.map((f) => f.path)));

  const sessionIso = useMemo(() => {
    const t = Date.parse(dateLocal);
    return Number.isNaN(t) ? "" : new Date(t).toISOString();
  }, [dateLocal]);

  const toggleFile = (path: string) => {
    setKeptFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <form action={formAction} className="space-y-5 pb-28">
      <input type="hidden" name="existing_files_json" value={JSON.stringify(supportFiles)} />
      {[...keptFiles].map((path) => (
        <input key={path} type="hidden" name="keep_file" value={path} />
      ))}

      {/* Élève (fixe — l'édition ne change jamais l'élève d'une séance) */}
      <div className="space-y-1.5">
        <span style={sectionLabel}>Élève</span>
        <div style={{ ...inputStyle, background: "#F7F4EE", color: "#4A463F" }}>{studentName}</div>
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
          defaultValue={customTitle}
          placeholder="ex. Les couleurs, Le passé simple…"
          style={inputStyle}
        />
      </div>

      {/* Livre (obligatoire) — la grammaire est rangée automatiquement */}
      <div className="space-y-2">
        <span style={sectionLabel}>Livre</span>
        <input type="hidden" name="book_id" value={bookId} />
        <div className="flex flex-col gap-2">
          {books.map((b) => {
            const active = bookId === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBookId(b.id)}
                className="flex items-center gap-2.5 rounded-[13px] px-3.5 py-3 text-left transition-colors"
                style={{
                  border: `1.5px solid ${active ? "#9FE3C8" : "#E9E3D8"}`,
                  background: active ? "#ECFAF4" : "#fff",
                }}
              >
                <span
                  className="rounded-full shrink-0"
                  style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${active ? "#0F9D6E" : "#C7C0B4"}`,
                    background: active ? "#0F9D6E" : "#fff",
                    boxShadow: active ? "inset 0 0 0 2px #fff" : "none",
                  }}
                />
                <span className="min-w-0">
                  <span dir="rtl" lang="ar" className="block font-arabic font-bold" style={{ fontSize: 16, color: "#1C1A17" }}>
                    {b.title}
                  </span>
                  {b.subtitle && (
                    <span className="block" style={{ fontSize: 12, color: "#8B857A" }}>{b.subtitle}</span>
                  )}
                </span>
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
            style={{ padding: "2px 8px", background: "#EAEFFD", border: "1px solid #AEBEF2", color: "#2C49B8", fontSize: 10, fontWeight: 700 }}
          >
            Vu par l&apos;élève
          </span>
        </div>
        <textarea
          id="public_recap"
          name="public_recap"
          rows={2}
          defaultValue={publicRecap}
          style={{ ...inputStyle, resize: "none" }}
        />
      </div>

      {/* Vocabulaire */}
      <div className="space-y-2.5 rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <span style={sectionLabel}>Vocabulaire</span>
        {vocabRows.map((row) => (
          <div key={row.id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "#FBF9F5" }}>
            <div className="grid grid-cols-2 gap-2">
              <input
                name="vocab_arabic"
                placeholder="mot (ar)"
                dir="rtl"
                className="font-arabic"
                defaultValue={row.arabic_word}
                style={inputStyle}
              />
              <input
                name="vocab_french"
                placeholder="définition (fr)"
                defaultValue={row.french_definition}
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => setVocabRows((rows) => rows.filter((r) => r.id !== row.id))}
              style={{ color: "#A8A29E", fontSize: 12 }}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setVocabRows((rows) => [...rows, { id: String(nextId), arabic_word: "", french_definition: "" }]);
            setNextId((n) => n - 1);
          }}
          className="font-bold"
          style={{ color: "#0F9D6E", fontSize: 13 }}
        >
          + Mot
        </button>
      </div>

      {/* Grammaire */}
      <div className="space-y-2.5 rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <span style={sectionLabel}>Règles de grammaire</span>
        {grammarRows.map((row, idx) => (
          <GrammarRuleRow
            key={row.id}
            row={row}
            idx={idx}
            onRemove={() => setGrammarRows((rows) => rows.filter((r) => r.id !== row.id))}
          />
        ))}
        <button
          type="button"
          onClick={() => {
            setGrammarRows((rows) => [...rows, { id: String(nextId), title: "", content: "", photos: [], ruleGroupId: "" }]);
            setNextId((n) => n - 1);
          }}
          className="font-bold"
          style={{ color: "#0F9D6E", fontSize: 13 }}
        >
          + Règle
        </button>
      </div>

      {/* Formulation (expressions ar ↔ fr) */}
      <div className="space-y-2.5 rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <span style={sectionLabel}>Formulation (expressions)</span>
        {formRows.map((row) => (
          <div key={row.id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "#FBF9F5" }}>
            <input
              name="form_arabic"
              placeholder="expression (ar)"
              dir="rtl"
              className="font-arabic"
              defaultValue={row.arabic_text}
              style={inputStyle}
            />
            <input
              name="form_french"
              placeholder="traduction (fr)"
              defaultValue={row.french_text}
              style={inputStyle}
            />
            <div className="flex items-center justify-between gap-2">
              <AudioRecorderInput
                name="form_audio"
                existingName="form_audio_existing"
                existingPath={row.audio_path}
              />
              <button
                type="button"
                onClick={() => setFormRows((rows) => rows.filter((r) => r.id !== row.id))}
                style={{ color: "#A8A29E", fontSize: 12 }}
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setFormRows((rows) => [
              ...rows,
              { id: String(nextId), arabic_text: "", french_text: "", audio_path: null },
            ]);
            setNextId((n) => n - 1);
          }}
          className="font-bold"
          style={{ color: "#0F9D6E", fontSize: 13 }}
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
          defaultValue={homeworkInstructions}
          placeholder="Consignes — laisser vide pour ne pas créer de devoir."
          style={{ ...inputStyle, resize: "none" }}
        />
        {homeworkTouched && (
          <p style={{ color: "#8B857A", fontSize: 11 }}>
            L&apos;élève a déjà rendu ou reçu une correction pour ce devoir : le texte peut être
            corrigé, mais vider ce champ ne le supprimera pas.
          </p>
        )}
      </div>

      {/* Note privée */}
      <div className="space-y-1.5 rounded-[16px] p-4" style={{ background: "#FFFBF2", border: "1px solid #F2E3C2" }}>
        <label htmlFor="private_note" className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 700, color: "#9A6206", textTransform: "uppercase", letterSpacing: ".05em" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A6206" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Note privée — non visible par l&apos;élève
        </label>
        <textarea
          id="private_note"
          name="private_note"
          rows={2}
          defaultValue={privateNote}
          style={{ ...inputStyle, background: "#fff", border: "1.5px solid #F2E3C2", resize: "none" }}
        />
      </div>

      {/* Supports existants */}
      {supportFiles.length > 0 && (
        <div className="space-y-1.5">
          <span style={sectionLabel}>Supports déjà attachés</span>
          <div className="space-y-1.5">
            {supportFiles.map((f) => (
              <label
                key={f.path}
                className="flex items-center gap-2 rounded-[12px] px-3 py-2.5"
                style={{ background: "#FBF9F5", border: "1px solid #E9E3D8", fontSize: 13, color: "#4A463F" }}
              >
                <input
                  type="checkbox"
                  checked={keptFiles.has(f.path)}
                  onChange={() => toggleFile(f.path)}
                />
                <span className="flex-1 truncate">{f.name}</span>
                <span style={{ color: keptFiles.has(f.path) ? "#0F9D6E" : "#B4292E", fontSize: 11, fontWeight: 700 }}>
                  {keptFiles.has(f.path) ? "conservé" : "sera retiré"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Nouveaux supports */}
      <div className="space-y-1.5">
        <label htmlFor="support_files" style={sectionLabel}>
          Ajouter des supports (optionnel)
        </label>
        <input
          id="support_files"
          name="support_files"
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp3,.mp4"
          className="block w-full text-sm file:mr-3 file:rounded-[10px] file:border-0 file:px-3 file:py-1.5 file:font-semibold file:cursor-pointer"
          style={{ color: "#4A463F" }}
        />
        <p style={{ color: "#A8A29E", fontSize: 11 }}>
          PDF, Word, image ou audio — max 10 Mo par fichier
        </p>
      </div>

      {state?.error ? (
        <p style={{ color: "#B4292E", fontSize: 14 }} role="alert">
          {state.error}
        </p>
      ) : null}

      {/* Barre d'enregistrement collante */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pt-3 pb-5"
        style={{ background: "linear-gradient(to top, #F7F4EE 70%, rgba(247,244,238,0))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <button
            type="submit"
            disabled={pending || !bookId}
            className="flex h-[52px] flex-1 items-center justify-center gap-2 rounded-[16px] font-bold text-white disabled:opacity-60"
            style={{ background: "#0F9D6E", fontSize: 15, boxShadow: "0 10px 22px rgba(15,157,110,.30)" }}
          >
            {pending ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
          <Link
            href={`/teacher/students/${studentId}/sessions/${recordId}`}
            className="flex h-[52px] items-center justify-center rounded-[16px] px-4 font-semibold"
            style={{ color: "#6B6459", fontSize: 14, border: "1.5px solid #E9E3D8", background: "#fff" }}
          >
            Annuler
          </Link>
        </div>
      </div>
    </form>
  );
}

function GrammarRuleRow({
  row,
  idx,
  onRemove,
}: {
  row: { id: string; title: string; content: string; photos: SupportFile[]; ruleGroupId: string };
  idx: number;
  onRemove: () => void;
}) {
  const [keptPhotos, setKeptPhotos] = useState<Set<string>>(new Set(row.photos.map((p) => p.path)));
  const togglePhoto = (path: string) => {
    setKeptPhotos((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  return (
    <div className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "#FBF9F5" }}>
      <input name="grammar_title" placeholder="titre" defaultValue={row.title} style={inputStyle} />
      <textarea
        name="grammar_content"
        placeholder="contenu"
        rows={2}
        defaultValue={row.content}
        style={{ ...inputStyle, resize: "none" }}
      />
      {row.ruleGroupId && (
        <input type="hidden" name={`grammar_rule_group_existing_${idx}`} value={row.ruleGroupId} />
      )}

      {row.photos
        .filter((p) => keptPhotos.has(p.path))
        .map((p) => (
          <input key={p.path} type="hidden" name={`grammar_photos_existing_${idx}`} value={JSON.stringify(p)} />
        ))}

      {row.photos.length > 0 && (
        <div className="space-y-1">
          <span style={{ fontSize: 11, color: "#8B857A" }}>Photos déjà attachées</span>
          <div className="space-y-1">
            {row.photos.map((p) => (
              <label
                key={p.path}
                className="flex items-center gap-2 rounded-[10px] px-2.5 py-2 cursor-pointer"
                style={{ background: "#fff", border: "1px solid #E9E3D8", fontSize: 12, color: "#4A463F" }}
              >
                <input
                  type="checkbox"
                  checked={keptPhotos.has(p.path)}
                  onChange={() => togglePhoto(p.path)}
                />
                <span className="flex-1 truncate">{p.name}</span>
                <span style={{ color: keptPhotos.has(p.path) ? "#0F9D6E" : "#B4292E", fontSize: 10, fontWeight: 700 }}>
                  {keptPhotos.has(p.path) ? "conservée" : "sera retirée"}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <span style={{ fontSize: 11, color: "#8B857A" }}>Ajouter des photos</span>
        <input
          name={`grammar_photos_${idx}`}
          type="file"
          accept="image/*"
          multiple
          className="block w-full text-xs file:mr-2 file:rounded-[8px] file:border-0 file:px-2.5 file:py-1 file:font-semibold file:cursor-pointer"
          style={{ color: "#4A463F" }}
        />
      </div>

      <button
        type="button"
        onClick={onRemove}
        style={{ color: "#A8A29E", fontSize: 12 }}
      >
        Retirer
      </button>
    </div>
  );
}
