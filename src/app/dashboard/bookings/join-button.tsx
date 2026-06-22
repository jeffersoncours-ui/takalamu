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
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const courseTime = new Date(scheduledAt);
  const openAt = new Date(courseTime.getTime() - 30 * 60 * 1000);
  const closeAt = new Date(courseTime.getTime() + 5 * 60 * 1000);

  // Stable placeholder during SSR
  if (!now) {
    const timeStr = courseTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <span className="text-sm text-slate-500">
        Rejoindre à {timeStr} (UTC)
      </span>
    );
  }

  if (now < openAt) {
    const timeStr = courseTime.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <span className="text-sm text-slate-500">
        Rejoindre à {timeStr} (heure locale)
      </span>
    );
  }

  if (now > closeAt) {
    return (
      <span className="text-sm font-medium text-red-500">Accès fermé</span>
    );
  }

  if (!zoomLink) {
    return (
      <span className="text-sm text-slate-400">Lien non disponible</span>
    );
  }

  return (
    <a
      href={zoomLink}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
    >
      Rejoindre →
    </a>
  );
}
