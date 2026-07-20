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
    <div className="-mx-4 -mt-5">
      {/* Héros encre avec filigrane arabe */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-8 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <span
          aria-hidden
          className="font-arabic pointer-events-none absolute select-none"
          style={{ right: 18, bottom: -8, fontSize: 80, lineHeight: 1, color: "rgba(228,200,118,.12)" }}
        >
          ف
        </span>
        <Link href={`/teacher/students/${id}#vocabulaire`} className="relative inline-flex items-center gap-2.5">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 16, color: "var(--tk-sage)" }}>
            Fiche élève
          </span>
        </Link>

        <div className="relative mt-6 flex items-baseline gap-3.5">
          <span dir="rtl" lang="ar" className="font-arabic font-bold" style={{ fontSize: 40, color: "var(--tk-cream-text)", lineHeight: 1 }}>
            {vocab.arabic_word}
          </span>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 17, color: "var(--tk-sage)" }}>
            {vocab.french_definition}
          </span>
        </div>
      </div>

      <div className="px-[22px] pt-6 pb-2">
        <ConjugationForm
          studentId={id}
          vocabId={vocabId}
          arabicWord={vocab.arabic_word}
          frenchDefinition={vocab.french_definition}
          initial={initial}
        />
      </div>
    </div>
  );
}
