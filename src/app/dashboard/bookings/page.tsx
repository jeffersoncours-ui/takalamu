import { formatInTimeZone } from "date-fns-tz";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getNextCourseContext } from "@/lib/next-course";
import { NextCourseHero } from "../next-course-hero";

const PARIS_TZ = "Europe/Paris";

export default async function SessionPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const next = await getNextCourseContext(supabase, studentId);

  const isToday =
    next != null &&
    formatInTimeZone(new Date(next.scheduledAt), PARIS_TZ, "yyyy-MM-dd") ===
      formatInTimeZone(new Date(), PARIS_TZ, "yyyy-MM-dd");

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Session
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Ton prochain cours avec ton enseignant.
        </p>
      </div>

      {isToday && (
        <div
          className="flex items-center gap-3 rounded-[16px] px-4 py-3"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}
        >
          <span
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 30, height: 30, background: "#0F9D6E" }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="12 7 12 12 15 14" />
            </svg>
          </span>
          <p className="font-semibold" style={{ color: "#0A6B4E", fontSize: 14 }}>
            C&apos;est aujourd&apos;hui ! Ton cours a lieu dans la journée.
          </p>
        </div>
      )}

      {next ? (
        <>
          <NextCourseHero
            scheduledAt={next.scheduledAt}
            lessonTitle={next.lessonTitle}
            teacherName={next.teacherName}
            zoomLink={next.zoomLink}
          />

          {/* Rappel présentation — caméra + posture */}
          <div
            className="rounded-[16px] p-4"
            style={{ background: "#FFFBF2", border: "1px solid #F2E3C2" }}
          >
            <p
              className="flex items-center gap-1.5 font-bold mb-2"
              style={{ fontSize: 11, color: "#9A6206", textTransform: "uppercase", letterSpacing: ".05em" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A6206" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              Avant de rejoindre
            </p>
            <ul className="space-y-1.5">
              {[
                "Caméra allumée pendant toute la séance.",
                "Assis(e) à une table, dans une position adaptée au cours.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2" style={{ color: "#7A5A0F", fontSize: 13.5, lineHeight: 1.5 }}>
                  <span aria-hidden="true" style={{ marginTop: 1 }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div
          className="rounded-[20px] p-5 text-center"
          style={{ background: "#FBF9F5", border: "1px solid #E9E3D8" }}
        >
          <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 15 }}>
            Aucun cours prévu pour l&apos;instant
          </p>
          <p className="mt-1" style={{ color: "#8B857A", fontSize: 13 }}>
            Écris à ton enseignant dans Messages pour convenir d&apos;un horaire.
          </p>
        </div>
      )}
    </div>
  );
}
