"use client";

import { useEffect, useState } from "react";

type Props = {
  scheduledAt: string;
  lessonTitle: string;
  teacherName: string;
  zoomLink: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function NextCourseHero({ scheduledAt, lessonTitle, teacherName, zoomLink }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const courseTime = new Date(scheduledAt);
  const openAt = new Date(courseTime.getTime() - 30 * 60 * 1000);
  const closeAt = new Date(courseTime.getTime() + 5 * 60 * 1000);
  const heure = courseTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Compte à rebours (ms restantes avant le cours)
  const diffMs = now ? Math.max(0, courseTime.getTime() - now.getTime()) : 0;
  const totalSec = Math.floor(diffMs / 1000);
  const cdH = pad(Math.floor(totalSec / 3600));
  const cdM = pad(Math.floor((totalSec % 3600) / 60));
  const cdS = pad(totalSec % 60);

  // État du bouton Rejoindre
  let joinState: "soon" | "open" | "ended" = "soon";
  if (now) {
    if (now > closeAt) joinState = "ended";
    else if (now >= openAt) joinState = "open";
  }

  return (
    <div
      className="relative overflow-hidden rounded-[24px] p-[22px]"
      style={{ background: "#0A553F", boxShadow: "0 16px 32px rgba(10,85,63,.32)" }}
    >
      {/* Filigrane losanges */}
      <svg
        width="220"
        height="220"
        viewBox="0 0 220 220"
        className="absolute"
        style={{ top: -40, right: -40, opacity: 0.14 }}
        fill="none"
        stroke="#9FE3C8"
        strokeWidth={1.5}
      >
        <rect x="50" y="50" width="120" height="120" rx="8" transform="rotate(45 110 110)" />
        <rect x="78" y="78" width="64" height="64" rx="5" transform="rotate(45 110 110)" />
        <rect x="22" y="22" width="176" height="176" rx="10" transform="rotate(45 110 110)" />
      </svg>

      <div className="relative">
        <div
          className="inline-flex items-center gap-[7px] rounded-full px-3 py-[5px] mb-[14px]"
          style={{ background: "rgba(255,255,255,.14)" }}
        >
          <span
            className="rounded-full"
            style={{ width: 7, height: 7, background: "#6FD3AE", animation: "tkPulse 1.6s ease-in-out infinite" }}
          />
          <span
            className="font-bold"
            style={{ color: "#CFF0E2", fontSize: 11, letterSpacing: ".03em" }}
          >
            Prochain cours
          </span>
        </div>

        <div
          className="text-white leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24 }}
        >
          {lessonTitle}
        </div>
        <div className="font-semibold mb-[18px] mt-1" style={{ color: "#9FE3C8", fontSize: 13 }}>
          avec {teacherName}
        </div>

        {/* Compte à rebours */}
        <div className="flex items-center gap-2 mb-[18px]">
          {[
            { v: cdH, l: "HEURES" },
            { v: cdM, l: "MINUTES" },
            { v: cdS, l: "SECONDES" },
          ].map((b) => (
            <div
              key={b.l}
              className="flex-1 rounded-[13px] py-[10px] text-center"
              style={{ background: "rgba(255,255,255,.10)" }}
            >
              <div
                className="text-white leading-none"
                style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24 }}
                suppressHydrationWarning
              >
                {now ? b.v : "--"}
              </div>
              <div
                className="font-bold mt-[3px]"
                style={{ color: "#7FC9AC", fontSize: 9, letterSpacing: ".1em" }}
              >
                {b.l}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Rejoindre */}
        {joinState === "open" && zoomLink ? (
          <a
            href={zoomLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] w-full items-center justify-center gap-[9px] rounded-[15px]"
            style={{ background: "#0F9D6E", boxShadow: "0 8px 18px rgba(15,157,110,.30)" }}
          >
            <span
              className="rounded-full"
              style={{ width: 9, height: 9, background: "#fff", animation: "tkPulse 1.6s ease-in-out infinite" }}
            />
            <span className="font-bold text-white" style={{ fontSize: 14 }}>
              Rejoindre le cours
            </span>
          </a>
        ) : (
          <div
            className="flex h-[50px] w-full items-center justify-center gap-[9px] rounded-[15px]"
            style={{
              background: "rgba(255,255,255,.16)",
              border: "1px solid rgba(255,255,255,.22)",
              cursor: "not-allowed",
            }}
          >
            {joinState === "ended" ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#CFF0E2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="font-bold text-white" style={{ fontSize: 14 }}>Séance terminée</span>
              </>
            ) : (
              <>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#CFF0E2" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
                <span className="font-bold text-white" style={{ fontSize: 14 }} suppressHydrationWarning>
                  Disponible à {heure}
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
