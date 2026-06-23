import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import QuizRunner from "./quiz-runner";

export default async function EvaluationsPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const [{ count: vocabCount }, { data: attempts }] = await Promise.all([
    supabase
      .from("vocabulary")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
    supabase
      .from("quiz_attempts")
      .select("id, score, taken_at, quizzes(scope, source_type)")
      .eq("student_id", studentId)
      .order("taken_at", { ascending: false })
      .limit(10),
  ]);

  const history = (attempts ?? []).filter((a) => {
    const q = Array.isArray(a.quizzes) ? a.quizzes[0] : a.quizzes;
    return q?.scope === "individual" && q?.source_type === "glossary";
  });

  return (
    <div className="space-y-6">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
      >
        Évaluations
      </h1>

      <QuizRunner vocabCount={vocabCount ?? 0} />

      {history.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide px-0.5" style={{ color: "#8B857A" }}>
            Mes tentatives
          </p>
          <div className="flex flex-col gap-2">
            {history.map((a) => {
              const pct = a.score != null ? Math.round(a.score * 100) : null;
              const isGood = pct != null && pct >= 70;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-[14px] px-4 py-3"
                  style={{ background: "#fff", border: "1px solid #EFEAE0" }}
                >
                  <span className="text-sm" style={{ color: "#4A463F" }}>
                    {format(new Date(a.taken_at), "d MMMM yyyy", { locale: fr })}
                  </span>
                  {pct != null && (
                    <span
                      className="text-sm font-bold"
                      style={{ color: isGood ? "#0F9D6E" : "#B4292E" }}
                    >
                      {pct} %
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
