import Link from "next/link";
import { notFound } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Tense } from "@/lib/conjugation";
import { ConjugationForm } from "./conjugation-form";

export default async function VocabConjugationPage({
  params,
}: {
  params: Promise<{ id: string; vocabId: string }>;
}) {
  const { id, vocabId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("id, arabic_word, french_definition, student_id")
    .eq("id", vocabId)
    .maybeSingle();

  if (!vocab || vocab.student_id !== id) notFound();

  const { data: rows } = await supabase
    .from("verb_conjugations")
    .select("tense, forms")
    .eq("vocab_id", vocabId);

  const initial: Record<Tense, Record<string, string>> = { madi: {}, mudari: {}, amr: {} };
  for (const r of rows ?? []) {
    const forms = (r.forms ?? {}) as Record<string, string>;
    if (r.tense === "madi" || r.tense === "mudari" || r.tense === "amr") {
      initial[r.tense] = forms;
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/students/${id}#vocabulaire`}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Fiche élève
      </Link>

      <h1 className="leading-tight" style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "#1C1A17" }}>
        Conjugaison
      </h1>

      <ConjugationForm
        studentId={id}
        vocabId={vocabId}
        arabicWord={vocab.arabic_word}
        frenchDefinition={vocab.french_definition}
        initial={initial}
      />
    </div>
  );
}
