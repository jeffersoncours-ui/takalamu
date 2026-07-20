"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Enregistreur micro qui dépose le résultat dans un <input type="file"> caché,
 * soumis avec le formulaire parent (aucun câblage JS côté action : FormData
 * transporte le fichier comme un upload classique).
 *
 * L'input file est TOUJOURS rendu, même vide — un input file non rempli soumet
 * une entrée vide, ce qui garde l'alignement d'index avec les autres champs
 * répétés de la ligne (form_arabic / form_french).
 *
 * En édition, `existingPath` signale un audio déjà en Storage : un hidden
 * `existingName` renvoie le chemin tant qu'il est conservé, vidé si retiré ou
 * remplacé par un nouvel enregistrement.
 */

type RecState = "empty" | "recording" | "recorded" | "existing";

/** Format le plus compatible en LECTURE (iOS Safari ne lit pas toujours webm). */
function pickMimeType(): { mime: string; ext: string } | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c.mime)) return c;
  }
  return null;
}

export function AudioRecorderInput({
  name,
  existingName,
  existingPath,
}: {
  name: string;
  existingName?: string;
  existingPath?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const previewUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<RecState>(existingPath ? "existing" : "empty");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Libère l'object URL au démontage
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  // Compteur de secondes pendant l'enregistrement
  useEffect(() => {
    if (state !== "recording") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [state]);

  const clearFileInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const start = async () => {
    setError(null);
    const picked = pickMimeType();
    if (!picked || !navigator.mediaDevices?.getUserMedia) {
      setError("Enregistrement non supporté par ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 64 kbps suffit largement pour de la voix (défaut navigateur ≈ 128 kbps,
      // calibré musique) — divise le poids par deux sur le Storage.
      const recorder = new MediaRecorder(stream, {
        mimeType: picked.mime,
        audioBitsPerSecond: 64000,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: picked.mime });
        if (blob.size === 0) {
          setState("empty");
          return;
        }
        const file = new File([blob], `enregistrement.${picked.ext}`, { type: picked.mime });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (inputRef.current) inputRef.current.files = dt.files;

        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        const url = URL.createObjectURL(blob);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setState("recorded");
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      setState("recording");
    } catch {
      setError("Micro refusé — autorise l'accès au micro pour enregistrer.");
    }
  };

  const stop = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
  };

  const remove = () => {
    clearFileInput();
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
    setState("empty");
  };

  // L'audio existant n'est conservé que si aucun nouvel enregistrement ne le
  // remplace et qu'il n'a pas été retiré.
  const keepExisting = state === "existing";

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        name={name}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      {existingName ? (
        <input type="hidden" name={existingName} value={keepExisting ? existingPath ?? "" : ""} />
      ) : null}

      {state === "empty" && (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-1.5 font-semibold"
          style={{ color: "var(--tk-green-active)", fontSize: 12 }}
        >
          <MicIcon color="var(--tk-green-active)" />
          Enregistrer l&apos;audio (ar)
        </button>
      )}

      {state === "recording" && (
        <div className="flex items-center gap-2.5">
          <span
            className="rounded-full animate-pulse shrink-0"
            style={{ width: 9, height: 9, background: "var(--tk-danger)" }}
          />
          <span style={{ color: "var(--tk-danger)", fontSize: 12, fontWeight: 600 }}>
            {seconds}s
          </span>
          <button
            type="button"
            onClick={stop}
            className="rounded-full font-bold"
            style={{ background: "var(--tk-danger)", color: "#fff", fontSize: 12, padding: "4px 14px" }}
          >
            Stop
          </button>
        </div>
      )}

      {state === "recorded" && previewUrl && (
        <div className="flex items-center gap-2 flex-wrap">
          <audio src={previewUrl} controls preload="metadata" style={{ height: 32, maxWidth: 190 }} />
          <button type="button" onClick={start} style={{ color: "var(--tk-green-active)", fontSize: 12, fontWeight: 600 }}>
            Refaire
          </button>
          <button type="button" onClick={remove} style={{ color: "var(--tk-faint-olive)", fontSize: 12 }}>
            Retirer
          </button>
        </div>
      )}

      {state === "existing" && (
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5" style={{ color: "var(--tk-green-active)", fontSize: 12, fontWeight: 600 }}>
            <MicIcon color="var(--tk-green-active)" />
            Audio enregistré
          </span>
          <button type="button" onClick={start} style={{ color: "var(--tk-green-active)", fontSize: 12, fontWeight: 600 }}>
            Réenregistrer
          </button>
          <button type="button" onClick={remove} style={{ color: "var(--tk-faint-olive)", fontSize: 12 }}>
            Retirer
          </button>
        </div>
      )}

      {error && (
        <p style={{ color: "var(--tk-danger)", fontSize: 11 }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="22" />
    </svg>
  );
}
