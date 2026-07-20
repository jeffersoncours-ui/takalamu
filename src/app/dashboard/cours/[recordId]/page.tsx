import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SupportFile = { path: string; name: string };

const IMG_EXT = /\.(jpe?g|png|gif|webp|avif)$/i;

export default async function StudentSessionPage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("lesson_records")
    .select("id, session_date, public_recap, support_files, custom_title")
    .eq("id", recordId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!record) notFound();

  const [orderRes, vocabRes, formRes] = await Promise.all([
    supabase
      .from("lesson_records")
      .select("id")
      .eq("student_id", studentId)
      .order("session_date", { ascending: true }),
    supabase
      .from("vocabulary")
      .select("id, arabic_word, french_definition")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("formulations")
      .select("id, arabic_text, french_text")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
  ]);

  const courseNumber =
    (orderRes.data ?? []).findIndex((r) => r.id === recordId) + 1;
  const vocab = vocabRes.data ?? [];
  const formulations = formRes.data ?? [];

  const supportFiles = (record.support_files as SupportFile[] | null) ?? [];
  let files: { name: string; url: string; isImage: boolean }[] = [];
  if (supportFiles.length > 0) {
    const { data: signedList } = await supabase.storage
      .from("session-files")
      .createSignedUrls(supportFiles.map((f) => f.path), 3600);
    files = supportFiles
      .map((f) => {
        const signed = signedList?.find((s) => s.path === f.path);
        return signed?.signedUrl
          ? { name: f.name, url: signed.signedUrl, isImage: IMG_EXT.test(f.name) }
          : null;
      })
      .filter((f): f is { name: string; url: string; isImage: boolean } => f !== null);
  }

  return (
    <div className="-mx-4 -mt-5">
      {/* Héros encre */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-7 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <Link href="/dashboard" className="relative inline-flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 19, color: "var(--tk-sage)" }}>
            Mes cours
          </span>
        </Link>

        <div className="relative mt-6 text-right">
          <h1
            dir="rtl"
            lang="ar"
            className="leading-tight"
            style={{ fontFamily: "var(--font-amiri)", fontWeight: 700, fontSize: 34, color: "var(--tk-cream-text)" }}
          >
            {record.custom_title || (courseNumber > 0 ? `Cours ${courseNumber}` : "Cours")}
          </h1>
          <p className="mt-1" style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 15, color: "var(--tk-sage)" }}>
            {format(new Date(record.session_date), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      <div className="px-[22px] pt-5 pb-2 space-y-5">
        {/* Récap */}
        {record.public_recap && (
          <div
            className="rounded-[16px] p-[15px_17px] font-medium"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 12px 26px -18px rgba(10,20,15,.4)" }}
          >
            <p className="leading-relaxed" style={{ color: "var(--tk-ink-text)", fontSize: 14.5 }}>{record.public_recap}</p>
          </div>
        )}

        {/* Documents / photos du cours */}
        {files.length > 0 && (
          <div className="space-y-2.5">
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Documents du cours
            </p>
            {files.map((f) =>
              f.isImage ? (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-[16px]"
                  style={{ border: "1px solid var(--tk-parchment-border)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.url} alt={f.name} className="w-full" style={{ display: "block" }} />
                </a>
              ) : (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-[14px] px-4 py-3 transition-opacity hover:opacity-80"
                  style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-green-active)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="font-medium text-sm" style={{ color: "var(--tk-ink-text)" }}>{f.name}</span>
                </a>
              ),
            )}
          </div>
        )}

        {/* Vocabulaire du cours */}
        {vocab.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-3.5">
              <h3 style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 21, color: "var(--tk-ink-text)" }}>
                Vocabulaire
              </h3>
              <span
                className="font-bold"
                style={{
                  background: "rgba(199,154,62,.16)",
                  border: "1px solid rgba(199,154,62,.4)",
                  color: "var(--tk-gold-darker)",
                  fontSize: 11,
                  padding: "2px 9px",
                  borderRadius: 8,
                }}
              >
                {vocab.length} mot{vocab.length > 1 ? "s" : ""}
              </span>
              <span className="flex-1" style={{ height: 1, background: "linear-gradient(90deg,#D8C79E,transparent)" }} />
            </div>
            <div
              className="overflow-hidden rounded-[16px]"
              style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 14px 28px -18px rgba(10,20,15,.42)" }}
            >
              {vocab.map((v, i) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between gap-3 px-[17px] py-[13px]"
                  style={i < vocab.length - 1 ? { borderBottom: "1px solid #EEE4CC" } : undefined}
                >
                  <span className="text-sm" style={{ color: "#3C4A3F" }}>{v.french_definition}</span>
                  <span dir="rtl" lang="ar" className="font-arabic shrink-0 font-bold" style={{ fontSize: 21, color: "var(--tk-ink-hero-to)" }}>
                    {v.arabic_word}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* La grammaire n'est plus affichée ici : elle est centralisée dans le
            livre de grammaire (النحو الميسّر) côté élève. */}

        {/* Formulations du cours */}
        {formulations.length > 0 && (
          <div
            className="rounded-[16px] p-4 space-y-3"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 12px 26px -18px rgba(10,20,15,.4)" }}
          >
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Formulations ({formulations.length})
            </p>
            {formulations.map((f) => (
              <div key={f.id} className="space-y-1">
                <p dir="rtl" lang="ar" className="font-arabic" style={{ fontSize: 18, fontWeight: 700, color: "var(--tk-ink-hero-to)", lineHeight: 1.5 }}>
                  {f.arabic_text}
                </p>
                <p style={{ color: "var(--tk-ink-text-soft)", fontSize: 14 }}>{f.french_text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Le devoir n'est plus affiché ici : il vit dans l'onglet « Devoirs »
            (+ la cloche), pas dans la présentation du cours. */}
      </div>
    </div>
  );
}
