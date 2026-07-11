"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/attendance";
import { updateSession } from "./actions";

type SupportFile = { path: string; name: string };
type VocabRow = { id: string; arabic_word: string; french_definition: string };
type GrammarRow = { id: string; title: string; content: string };

const PRESENCE_COLOR: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  present: { border: "#9FE3C8", bg: "#ECFAF4", text: "#0A6B4E", dot: "#0F9D6E" },
  late: { border: "#F4D193", bg: "#FDF4E3", text: "#9A6206", dot: "#F59E0B" },
  absent_justified: { border: "#C7C0B4", bg: "#F4F1EB", text: "#6B6459", dot: "#A8A29E" },
  absent_unjustified: { border: "#F3B0B2", bg: "#FDECEC", text: "#B4292E", dot: "#E5484D" },
};

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
  attendance: initialAttendance,
  publicRecap,
  privateNote,
  homeworkInstructions,
  homeworkTouched,
  vocab,
  grammar,
  supportFiles,
}: {
  studentId: string;
  recordId: string;
  studentName: string;
  sessionDateIso: string;
  attendance: AttendanceStatus;
  publicRecap: string;
  privateNote: string;
  homeworkInstructions: string;
  homeworkTouched: boolean;
  vocab: VocabRow[];
  grammar: GrammarRow[];
  supportFiles: SupportFile[];
}) {
  const boundAction = updateSession.bind(null, studentId, recordId);
  const [state, formAction, pending] = useActionState(boundAction, {});

  const [dateLocal, setDateLocal] = useState(toLocalValue(sessionDateIso));
  const [presence, setPresence] = useState<AttendanceStatus>(initialAttendance);

  const [vocabRows, setVocabRows] = useState(
    vocab.map((v) => ({ id: v.id, arabic_word: v.arabic_word, french_definition: v.french_definition }))
  );
  const [grammarRows, setGrammarRows] = useState(
    grammar.map((g) => ({ id: g.id, title: g.title, content: g.content }))
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

      {/* Présence */}
      <div className="space-y-2">
        <span style={sectionLabel}>Présence</span>
        <input type="hidden" name="attendance" value={presence} />
        <div className="grid grid-cols-2 gap-2">
          {ATTENDANCE_STATUSES.map((a) => {
            const active = presence === a.value;
            const c = PRESENCE_COLOR[a.value];
            return (
              <button
                key={a.value}
                type="button"
                onClick={() => setPresence(a.value)}
                className="flex items-center gap-2 rounded-[13px] px-3 py-3 text-left font-semibold transition-colors"
                style={{
                  border: `1.5px solid ${active ? c.border : "#E9E3D8"}`,
                  background: active ? c.bg : "#fff",
                  color: active ? c.text : "#6B6459",
                  fontSize: 13,
                }}
              >
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 9, height: 9, background: active ? c.dot : "#D8D2C6" }}
                />
                {a.label}
              </button>
            );
          })}
        </div>
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
        {grammarRows.map((row) => (
          <div key={row.id} className="space-y-1.5 rounded-[12px] p-2.5" style={{ background: "#FBF9F5" }}>
            <input name="grammar_title" placeholder="titre" defaultValue={row.title} style={inputStyle} />
            <textarea
              name="grammar_content"
              placeholder="contenu"
              rows={2}
              defaultValue={row.content}
              style={{ ...inputStyle, resize: "none" }}
            />
            <button
              type="button"
              onClick={() => setGrammarRows((rows) => rows.filter((r) => r.id !== row.id))}
              style={{ color: "#A8A29E", fontSize: 12 }}
            >
              Retirer
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setGrammarRows((rows) => [...rows, { id: String(nextId), title: "", content: "" }]);
            setNextId((n) => n - 1);
          }}
          className="font-bold"
          style={{ color: "#0F9D6E", fontSize: 13 }}
        >
          + Règle
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
            disabled={pending}
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
