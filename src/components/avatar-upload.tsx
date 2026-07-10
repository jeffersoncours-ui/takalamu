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
        style={{ width: 64, height: 64, background: "#0A553F" }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="font-semibold text-white text-xl"
            style={{ fontFamily: "var(--font-spectral)" }}
          >
            {fallbackLetter}
          </span>
        )}
        {pending && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(28,26,23,.4)" }}
          >
            <span className="text-xs font-semibold text-white">…</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <label
          className="inline-flex cursor-pointer items-center rounded-[12px] px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: "#F7F4EE", color: "#1C1A17", border: "1px solid #E9E3D8" }}
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
          <p className="mt-1.5" style={{ color: "#B4292E", fontSize: 12 }}>{state.error}</p>
        )}
      </div>
    </form>
  );
}
