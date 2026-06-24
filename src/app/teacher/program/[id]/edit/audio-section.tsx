"use client";

import { useActionState } from "react";

type ActionState = { error?: string };

type Props = {
  uploadAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  removeAction: (formData: FormData) => Promise<void>;
  currentAudio: { title: string | null; signedUrl: string | null } | null;
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 text-sm";

export function AudioSection({ uploadAction, removeAction, currentAudio }: Props) {
  const [state, formAction, pending] = useActionState(uploadAction, {});

  return (
    <div className="space-y-3 border-t border-slate-200 pt-6">
      <p className="text-sm font-semibold text-slate-700">Audio de la leçon</p>

      {currentAudio ? (
        <div className="space-y-3">
          {currentAudio.title && (
            <p className="text-sm text-slate-600">{currentAudio.title}</p>
          )}
          {currentAudio.signedUrl && (
            <audio
              src={currentAudio.signedUrl}
              controls
              className="w-full rounded-lg"
              style={{ height: 44 }}
            />
          )}
          <form action={removeAction}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:text-red-700 font-medium transition"
            >
              Supprimer l&apos;audio
            </button>
          </form>
        </div>
      ) : (
        <form action={formAction} encType="multipart/form-data" className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="audio_title" className="block text-sm font-medium text-slate-700">
              Titre (optionnel)
            </label>
            <input
              id="audio_title"
              name="audio_title"
              placeholder="Ex. : Prononciation de la sourate Al-Fatiha"
              className={fieldClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="audio_file" className="block text-sm font-medium text-slate-700">
              Fichier audio *
            </label>
            <input
              id="audio_file"
              name="audio_file"
              type="file"
              accept="audio/*"
              required
              className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600" role="alert">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Envoi…" : "Ajouter l'audio"}
          </button>
        </form>
      )}
    </div>
  );
}
