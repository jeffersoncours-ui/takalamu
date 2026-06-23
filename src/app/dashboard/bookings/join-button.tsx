"use client";

import { useEffect, useState } from "react";

export function JoinButton({
  scheduledAt,
  zoomLink,
}: {
  scheduledAt: string;
  zoomLink: string | null;
}) {
  const [now, setNow] = useState<Date | null>(null);

  // Initialize on client only to avoid SSR/hydration mismatch
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const courseTime = new Date(scheduledAt);
  const openAt = new Date(courseTime.getTime() - 30 * 60 * 1000);
  const closeAt = new Date(courseTime.getTime() + 5 * 60 * 1000);
  const timeStr = courseTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Placeholder stable pendant le SSR + avant la fenêtre d'ouverture
  if (!now || now < openAt) {
    return (
      <span
        className="flex h-10 items-center gap-1.5 rounded-[12px] px-3 font-semibold"
        style={{ background: "#F4F1EB", color: "#8B857A", fontSize: 13 }}
        suppressHydrationWarning
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <polyline points="12 7 12 12 15 14" />
        </svg>
        {timeStr}
      </span>
    );
  }

  if (now > closeAt) {
    return (
      <span
        className="flex h-10 items-center gap-1.5 rounded-[12px] px-3 font-semibold"
        style={{ background: "#FDECEC", color: "#B4292E", fontSize: 13 }}
      >
        Accès fermé
      </span>
    );
  }

  if (!zoomLink) {
    return (
      <span className="font-medium" style={{ color: "#A8A29E", fontSize: 13 }}>
        Lien non disponible
      </span>
    );
  }

  return (
    <a
      href={zoomLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 items-center gap-1.5 rounded-[12px] px-4 font-bold text-white"
      style={{ background: "#0F9D6E", fontSize: 13, boxShadow: "0 6px 13px rgba(15,157,110,.26)" }}
    >
      <span className="rounded-full" style={{ width: 8, height: 8, background: "#fff", animation: "tkPulse 1.6s ease-in-out infinite" }} />
      Rejoindre
    </a>
  );
}
