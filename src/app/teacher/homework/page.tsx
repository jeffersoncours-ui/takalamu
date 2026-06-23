import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { HwCorrectionForm } from "./hw-correction-form";

export default async function HomeworkQueuePage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: homework } = await supabase
    .from("homework")
    .select(
      "id, instructions, assigned_at, students(id, profiles(full_name)), lesson_records(session_date, lessons(title))",
    )
    .eq("status", "rendu")
    .order("assigned_at", { ascending: true });

  const items = homework ?? [];

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          File de correction
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} devoir{items.length > 1 ? "s" : ""} en attente
        </p>
      </div>

      {items.length === 0 && (
        <p
          className="rounded-[16px] p-4"
          style={{ background: "#ECFAF4", border: "1px solid #C8EBDB", color: "#0A6B4E", fontSize: 14 }}
        >
          Aucun devoir en attente de correction. 🎉
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((hw) => {
          const student = Array.isArray(hw.students) ? hw.students[0] : hw.students;
          const profile = student
            ? Array.isArray(student.profiles)
              ? student.profiles[0]
              : student.profiles
            : null;
          const record = Array.isArray(hw.lesson_records)
            ? hw.lesson_records[0]
            : hw.lesson_records;
          const lesson = record
            ? Array.isArray(record.lessons)
              ? record.lessons[0]
              : record.lessons
            : null;
          const name = profile?.full_name ?? "—";

          return (
            <div
              key={hw.id}
              className="rounded-[18px] p-4 space-y-3"
              style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex shrink-0 items-center justify-center rounded-[12px] text-white font-bold"
                  style={{ width: 42, height: 42, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 16 }}
                >
                  {name[0]?.toUpperCase() ?? "?"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>{name}</p>
                  <p className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                    {lesson?.title ?? "Sans leçon"} · {format(new Date(hw.assigned_at), "d MMM", { locale: fr })}
                  </p>
                </div>
                <StatusBadge hue="blue" label="Rendu" />
              </div>

              {hw.instructions && (
                <div
                  className="rounded-[14px] p-3"
                  style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
                >
                  <p className="font-semibold uppercase mb-1" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
                    Consignes données
                  </p>
                  <p style={{ color: "#4A463F", fontSize: 14 }}>{hw.instructions}</p>
                </div>
              )}

              <HwCorrectionForm homeworkId={hw.id} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
