import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const GREEN = "#0F9D6E";
const RED = "#B4292E";

type StoredAnswer = {
  vocab_id: string;
  direction: "fr_to_ar" | "ar_to_fr";
  chosen: string;
  correct: string;
  is_correct: boolean;
};

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, score, taken_at, answers, student_id")
    .eq("id", attemptId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!attempt) notFound();

  const answers = (attempt.answers as StoredAnswer[] | null) ?? [];

  // Reconstruit le mot demandé (prompt) : opposé de la bonne réponse.
  const vocabIds = answers.map((a) => a.vocab_id).filter(Boolean);
  const promptMap = new Map<string, { arabic: string; french: string }>();
  if (vocabIds.length > 0) {
    const { data: words } = await supabase
      .from("vocabulary")
      .select("id, arabic_word, french_definition")
      .in("id", vocabIds);
    (words ?? []).forEach((w) =>
      promptMap.set(w.id, { arabic: w.arabic_word, french: w.french_definition }),
    );
  }

  const total = answers.length;
  const score = answers.filter((a) => a.is_correct).length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const isGood = pct >= 70;

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/evaluations"
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Évaluations
      </Link>

      <p className="px-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
        Quiz du {format(new Date(attempt.taken_at), "d MMMM yyyy", { locale: fr })}
      </p>

      {/* Score hero */}
      <div
        className="rounded-[18px] p-6 text-center"
        style={{ background: isGood ? "#ECFAF4" : "#FDECEC", border: `1px solid ${isGood ? "#C8EBDB" : "#F3B0B2"}` }}
      >
        <p className="text-5xl font-bold" style={{ color: isGood ? GREEN : RED, fontFamily: "var(--font-spectral)" }}>
          {score}/{total}
        </p>
        <p className="text-lg font-semibold mt-1" style={{ color: isGood ? "#0A6B4E" : "#7A1A1E" }}>
          {pct}%
        </p>
      </div>

      {/* Détail des réponses */}
      <div className="flex flex-col gap-2">
        {answers.map((a, idx) => {
          const word = promptMap.get(a.vocab_id);
          const isAr = a.direction === "fr_to_ar";
          const prompt = word
            ? (a.direction === "ar_to_fr" ? word.arabic : word.french)
            : null;
          return (
            <div
              key={idx}
              className="rounded-[14px] p-3.5"
              style={{
                background: a.is_correct ? "#ECFAF4" : "#FFF8F8",
                border: `1px solid ${a.is_correct ? "#C8EBDB" : "#F3B0B2"}`,
              }}
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0" style={{ color: a.is_correct ? GREEN : RED, fontSize: 14 }}>
                  {a.is_correct ? "✓" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: "#8B857A" }}>
                    {a.direction === "ar_to_fr" ? "Arabe → Français" : "Français → Arabe"}
                  </p>
                  {prompt && (
                    <p
                      className="text-sm font-medium mt-0.5"
                      style={{ color: "#1C1A17" }}
                      dir={a.direction === "ar_to_fr" ? "rtl" : undefined}
                    >
                      {prompt}
                    </p>
                  )}
                  {!a.is_correct && (
                    <div className="mt-1.5 space-y-0.5">
                      <p className="text-xs" style={{ color: RED }}>
                        Ta réponse :{" "}
                        <span dir={isAr ? "rtl" : undefined} style={{ fontFamily: isAr ? "var(--font-amiri)" : undefined }}>
                          {a.chosen}
                        </span>
                      </p>
                      <p className="text-xs font-semibold" style={{ color: "#0A6B4E" }}>
                        Bonne réponse :{" "}
                        <span dir={isAr ? "rtl" : undefined} style={{ fontFamily: isAr ? "var(--font-amiri)" : undefined }}>
                          {a.correct}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
