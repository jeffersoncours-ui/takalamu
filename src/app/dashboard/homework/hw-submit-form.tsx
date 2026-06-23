"use client";

import { useRef, useState, useTransition } from "react";
import { submitHomework } from "./actions";

const GREEN = "#0F9D6E";
const RED = "#B4292E";

type Mode = "photo" | "audio";
type RecState = "idle" | "recording" | "recorded";

export function HwSubmitForm({ homeworkId }: { homeworkId: string }) {
  const [mode, setMode] = useState<Mode>("photo");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // ── Photo ──────────────────────────────────────────────────────────────────
  const [fileName, setFileName] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const [recState, setRecState] = useState<RecState>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const submit = (file: File) => {
    setError(null);
    const fd = new FormData();
    fd.append("submission_file", file);
    startTransition(async () => {
      const res = await submitHomework(homeworkId, {}, fd);
      if (res.error) setError(res.error);
    });
  };

  const submitPhoto = () => {
    const file = photoRef.current?.files?.[0];
    if (!file) {
      setError("Ajoute une photo de ton devoir.");
      return;
    }
    submit(file);
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setRecState("recorded");
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecState("recording");
    } catch {
      setError("Micro inaccessible. Autorise l'accès ou utilise une photo.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const redoRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    blobRef.current = null;
    setRecState("idle");
  };

  const submitAudio = () => {
    const blob = blobRef.current;
    if (!blob) {
      setError("Enregistre un message avant d'envoyer.");
      return;
    }
    const ext = blob.type.includes("mp4") ? "mp4" : "webm";
    submit(new File([blob], `recording.${ext}`, { type: blob.type }));
  };

  return (
    <div className="mt-3 pt-3" style={{ borderTop: "1px solid #F4F0E8" }}>
      {error && (
        <p className="mb-2 text-xs font-medium" style={{ color: RED }}>
          {error}
        </p>
      )}

      <p className="font-semibold mb-2" style={{ color: "#1C1A17", fontSize: 13 }}>
        Rendre mon devoir
      </p>

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
            {m === "photo" ? "📷 Photo" : "🎙 Audio"}
          </button>
        ))}
      </div>

      {mode === "photo" && (
        <>
          <label
            className="flex items-center gap-2 rounded-[12px] px-3 py-3 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: "#F7F4EE", border: "1px dashed #D8D2C6" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <span className="text-sm" style={{ color: fileName ? "#1C1A17" : "#8B857A" }}>
              {fileName ?? "Prendre / choisir une photo"}
            </span>
            <input
              ref={photoRef}
              type="file"
              accept="image/*,.pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            />
          </label>
          <button
            type="button"
            onClick={submitPhoto}
            disabled={pending || !fileName}
            className="mt-2.5 w-full rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: GREEN }}
          >
            {pending ? "Envoi…" : "Envoyer mon devoir"}
          </button>
        </>
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

          {recState === "recorded" && audioUrl && (
            <>
              <audio controls src={audioUrl} className="w-full" style={{ height: 40 }} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={redoRecording}
                  disabled={pending}
                  className="flex-1 rounded-[12px] py-3 font-semibold text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
                  style={{ background: "#F7F4EE", color: "#8B857A", border: "1px solid #EFEAE0" }}
                >
                  Refaire
                </button>
                <button
                  type="button"
                  onClick={submitAudio}
                  disabled={pending}
                  className="flex-[2] rounded-[12px] py-3 font-semibold text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ background: GREEN }}
                >
                  {pending ? "Envoi…" : "Envoyer l'audio"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
