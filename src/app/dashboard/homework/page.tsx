import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, homeworkBadge } from "@/components/status-badge";

export default async function DevoirsPage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: homeworks } = await supabase
    .from("homework")
    .select("id, instructions, status, feedback, grade, assigned_at, lesson_records(lessons(title))")
    .order("assigned_at", { ascending: false });

  const list = homeworks ?? [];

  return (
    <div className="space-y-5">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Mes devoirs
      </h1>

      {list.length === 0 && (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun devoir pour le moment.</p>
      )}

      <div className="flex flex-col gap-3">
        {list.map((hw) => {
          const badge = homeworkBadge(hw.status);
          const record = Array.isArray(hw.lesson_records) ? hw.lesson_records[0] : hw.lesson_records;
          const lesson = record
            ? Array.isArray(record.lessons)
              ? record.lessons[0]
              : record.lessons
            : null;
          return (
            <div
              key={hw.id}
              className="rounded-[18px] p-4"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-bold" style={{ color: "#1C1A17", fontSize: 16 }}>
                    {hw.instructions
                      ? hw.instructions.split("\n")[0].slice(0, 60)
                      : "Devoir"}
                  </div>
                  {lesson?.title && (
                    <div className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 12 }}>
                      {lesson.title}
                    </div>
                  )}
                </div>
                <StatusBadge hue={badge.hue} label={badge.label} />
              </div>

              {hw.instructions && (
                <p
                  className="leading-relaxed whitespace-pre-wrap mt-2"
                  style={{ color: "#4A463F", fontSize: 14 }}
                >
                  {hw.instructions}
                </p>
              )}

              {hw.feedback && (
                <div
                  className="rounded-[14px] px-3 py-2.5 mt-3"
                  style={{ background: "#ECFAF4", border: "1px solid #C8EBDB" }}
                >
                  <p style={{ color: "#0A6B4E", fontSize: 13 }}>
                    <span className="font-semibold">Retour : </span>
                    {hw.feedback}
                    {hw.grade && <span className="ml-2 font-bold">— Note : {hw.grade}</span>}
                  </p>
                </div>
              )}

              <div
                className="flex items-center gap-2 mt-3 pt-2.5"
                style={{ borderTop: "1px solid #F4F0E8" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 14" />
                </svg>
                <span className="font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>
                  {format(new Date(hw.assigned_at), "d MMMM yyyy", { locale: fr })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
