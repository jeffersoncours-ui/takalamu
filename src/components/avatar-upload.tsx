"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadAvatar } from "@/lib/avatar-actions";

type Props = {
  currentUrl: string | null;
  fallbackLetter: string;
};

export function AvatarUpload({ currentUrl, fallbackLetter }: Props) {
  const [state, formAction, pending] = useActionState(uploadAvatar, {});
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state.success, router]);

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-4">
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-full shrink-0"
        style={{ width: 64, height: 64, background: "rgba(255,255,255,.1)", border: "1.5px solid rgba(199,154,62,.5)" }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="font-semibold text-xl"
            style={{ fontFamily: "var(--font-spectral)", color: "var(--tk-cream-text)" }}
          >
            {fallbackLetter}
          </span>
        )}
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(8,16,12,.5)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--tk-cream-text)" }}>…</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <label
          className="inline-flex cursor-pointer items-center rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "rgba(255,255,255,.06)", color: "var(--tk-cream-text)", border: "1px solid rgba(199,154,62,.35)" }}
        >
          {pending ? "Envoi…" : "Changer la photo"}
          <input
            type="file"
            name="avatar"
            accept="image/*"
            className="hidden"
            disabled={pending}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
        {state.error && (
          <p className="mt-1.5" style={{ color: "var(--tk-danger-soft)", fontSize: 12 }}>{state.error}</p>
        )}
      </div>
    </form>
  );
}
