"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { uploadFilesToBucket, removeFilesFromBucket, type UploadedFile } from "@/lib/upload-files";
import { saveHomeworkSubmission } from "./actions";

const GREEN = "#0F9D6E";
const RED = "#B4292E";
const BUCKET = "homework-submissions";

type Mode = "photo" | "audio";
type RecState = "idle" | "recording" | "recorded";

/** Une pièce jointe : déjà déposée (existing, chemin connu) ou nouvelle (à uploader). */
type Item =
  | { kind: "existing"; path: string; name: string; isAudio: boolean }
  | { kind: "new"; id: number; file: File; name: string; isAudio: boolean; url: string };

const AUDIO_RE = /\.(webm|mp4|m4a|ogg|mp3|wav)$/i;

export function HwSubmitForm({
  homeworkId,
  studentId,
  existingFiles,
}: {
  homeworkId: string;
  studentId: string;
  existingFiles: UploadedFile[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("photo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [nextId, setNextId] = useState(1);

  const [items, setItems] = useState<Item[]>(() =>
    existingFiles.map((f) => ({
      kind: "existing" as const,
      path: f.path,
      name: f.name,
      isAudio: AUDIO_RE.test(f.name) || AUDIO_RE.test(f.path),
    })),
  );

  const hasSubmitted = existingFiles.length > 0;

  // ── Photo(s) ────────────────────────────────────────────────────────────────
  const photoRef = useRef<HTMLInputElement>(null);
  const addPhotos = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    const added: Item[] = Array.from(files).map((file, i) => ({
      kind: "new",
      id: nextId + i,
      file,
      name: file.name,
      isAudio: false,
      url: URL.createObjectURL(file),
    }));
    setNextId((n) => n + files.length);
    setItems((prev) => [...prev, ...added]);
    if (photoRef.current) photoRef.current.value = "";
  };

  // ── Audio ──────────────────────────────────────────────────────────────────
  const [recState, setRecState] = useState<RecState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 64000 });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const ext = mime.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `audio_${Date.now()}.${ext}`, { type: mime });
        setItems((prev) => [
          ...prev,
          {
            kind: "new",
            id: nextId,
            file,
            name: "Message audio",
            isAudio: true,
            url: URL.createObjectURL(blob),
          },
        ]);
        setNextId((n) => n + 1);
        setRecState("idle");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecState("recording");
    } catch {
      setError("Micro inaccessible. Autorise l'accès ou utilise une photo.");
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const removeItem = (target: Item) => {
    setItems((prev) =>
      prev.filter((it) =>
        it.kind === "new" && target.kind === "new"
          ? it.id !== target.id
          : it.kind === "existing" && target.kind === "existing"
          ? it.path !== target.path
          : it !== target,
      ),
    );
    if (target.kind === "new") URL.revokeObjectURL(target.url);
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      try {
        // 1) Upload direct des nouvelles pièces vers le dossier de l'élève.
        const newFiles = items.filter((it): it is Extract<Item, { kind: "new" }> => it.kind === "new");
        const uploaded = await uploadFilesToBucket(BUCKET, studentId, newFiles.map((it) => it.file));

        // 2) Liste finale = pièces conservées + nouvelles.
        const kept: UploadedFile[] = items
          .filter((it): it is Extract<Item, { kind: "existing" }> => it.kind === "existing")
          .map((it) => ({ path: it.path, name: it.name }));
        const finalList = [...kept, ...uploaded];

        // 3) Enregistrement (server action → RPC).
        const res = await saveHomeworkSubmission(homeworkId, finalList);
        if (res.error) {
          setError(res.error);
          return;
        }

        // 4) Nettoyage best-effort des pièces existantes retirées.
        const keptPaths = new Set(kept.map((k) => k.path));
        const removed = existingFiles.filter((f) => !keptPaths.has(f.path)).map((f) => f.path);
        await removeFilesFromBucket(BUCKET, removed);

        router.refresh();
      } catch {
        setError("Échec de l'envoi. Vérifie ta connexion et réessaie.");
      }
    });
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F4F0E8" }}>
      {error && (
        <p className="mb-2 text-xs font-medium" style={{ color: RED }}>
          {error}
        </p>
      )}

      <p className="font-semibold mb-2" style={{ color: "#1C1A17", fontSize: 13 }}>
        {hasSubmitted ? "Modifier mon devoir" : "Rendre mon devoir"}
      </p>

      {/* Liste des pièces jointes */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {items.map((it) => (
            <div
              key={it.kind === "new" ? `n${it.id}` : `e${it.path}`}
              className="flex items-center gap-2.5 rounded-[12px] p-2"
              style={{ background: "#F7F4EE", border: "1px solid #EFEAE0" }}
            >
              {it.isAudio ? (
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-[8px]"
                  style={{ width: 38, height: 38, background: "#EAEFFD", fontSize: 18 }}
                >
                  🎙
                </span>
              ) : it.kind === "new" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.url} alt="" className="shrink-0 rounded-[8px] object-cover" style={{ width: 38, height: 38 }} />
              ) : (
                <span
                  className="shrink-0 inline-flex items-center justify-center rounded-[8px]"
                  style={{ width: 38, height: 38, background: "#EAEFFD", fontSize: 18 }}
                >
                  🖼
                </span>
              )}
              <span className="flex-1 min-w-0 truncate text-sm" style={{ color: "#1C1A17" }}>
                {it.name}
                {it.kind === "existing" && (
                  <span className="ml-1.5 text-xs" style={{ color: "#8B857A" }}>(déjà déposé)</span>
                )}
              </span>
              <button
                type="button"
                onClick={() => removeItem(it)}
                disabled={pending}
                className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
                style={{ background: "#fff", color: "#8B857A", border: "1px solid #E9E3D8" }}
                aria-label={`Retirer ${it.name}`}
              >
                Retirer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toggle photo / audio */}
      <div className="flex gap-1.5 mb-3">
        {(["photo", "audio"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className="flex-1 rounded-[10px] py-2 text-xs font-semibold transition-colors"
            style={
              mode === m
                ? { background: "#0A553F", color: "#fff" }
                : { background: "#F7F4EE", color: "#8B857A", border: "1px solid #EFEAE0" }
            }
          >
            {m === "photo" ? "📷 Photo(s)" : "🎙 Audio"}
          </button>
        ))}
      </div>

      {mode === "photo" && (
        <label
          className="flex items-center gap-2 rounded-[12px] px-3 py-3 cursor-pointer transition-opacity hover:opacity-80"
          style={{ background: "#F7F4EE", border: "1px dashed #D8D2C6" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
          <span className="text-sm" style={{ color: "#8B857A" }}>Ajouter une ou plusieurs photos</span>
          <input
            ref={photoRef}
            type="file"
            accept="image/*,.pdf"
            multiple
            className="hidden"
            onChange={(e) => addPhotos(e.target.files)}
          />
        </label>
      )}

      {mode === "audio" && (
        <div className="flex flex-col gap-2.5">
          {recState === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center justify-center gap-2 rounded-[12px] py-3.5 font-semibold text-sm text-white transition-opacity hover:opacity-85"
              style={{ background: RED }}
            >
              <span className="rounded-full" style={{ width: 10, height: 10, background: "#fff" }} />
              Enregistrer un message
            </button>
          )}
          {recState === "recording" && (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center justify-center gap-2 rounded-[12px] py-3.5 font-semibold text-sm transition-opacity hover:opacity-85"
              style={{ background: "#FDECEC", color: RED, border: `1.5px solid ${RED}` }}
            >
              <span className="animate-pulse">● Enregistrement… Appuyer pour arrêter</span>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || items.length === 0}
        className="mt-3 w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
        style={{ background: GREEN }}
      >
        {pending ? "Envoi…" : hasSubmitted ? "Mettre à jour mon devoir" : "Envoyer mon devoir"}
      </button>
    </div>
  );
}
