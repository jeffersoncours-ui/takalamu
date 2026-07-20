import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DuplicateForm } from "./duplicate-form";
import { duplicateSession } from "./actions";

type SupportFile = { path: string; name: string };

export default async function LibraryCoursePage({
  params,
}: {
  params: Promise<{ recordId: string }>;
}) {
  const { recordId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: record, error: recordError } = await supabase
    .from("lesson_records")
    .select("id, custom_title, session_date, support_files, student_id, course_group_id, book_id")
    .eq("id", recordId)
    .maybeSingle();

  if (recordError) console.error("library/[recordId] record query failed:", recordError.message);
  if (!record) notFound();

  const [vocabRes, formRes, studentsRes, groupRes] = await Promise.all([
    supabase.from("vocabulary").select("id, arabic_word, french_definition").eq("lesson_record_id", recordId).order("created_at", { ascending: true }),
    supabase.from("formulations").select("id, arabic_text, french_text, audio_path").eq("lesson_record_id", recordId).order("created_at", { ascending: true }),
    supabase.from("students").select("id, status, profiles(full_name)"),
    supabase.from("lesson_records").select("student_id").eq("course_group_id", record.course_group_id),
  ]);

  // Élèves qui possèdent déjà ce cours (même groupe) → on les marque pour éviter
  // de créer un doublon en re-dupliquant vers eux.
  const alreadyHas = new Set((groupRes.data ?? []).map((r) => r.student_id));

  const vocab = vocabRes.data ?? [];
  const formulations = formRes.data ?? [];
  const audioCount = formulations.filter((f) => !!f.audio_path).length;
  const supportCount = ((record.support_files as SupportFile[] | null) ?? []).length;
  const title =
    record.custom_title || format(new Date(record.session_date), "d MMMM yyyy", { locale: fr });

  const students = (studentsRes.data ?? []).map((s) => ({
    id: s.id,
    name: (Array.isArray(s.profiles) ? s.profiles[0]?.full_name : s.profiles?.full_name) ?? "Élève",
    status: s.status,
    alreadyHas: alreadyHas.has(s.id),
  }));

  return (
    <div className="space-y-5">
      <Link
        href={record.book_id ? `/teacher/books/${record.book_id}` : "/teacher/books"}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}
      >
        ← Mes livres
      </Link>

      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink-text)" }}
        >
          {title}
        </h1>
        <p className="mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>
          {format(new Date(record.session_date), "d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      {/* Aperçu du contenu qui sera dupliqué */}
      <div className="rounded-[16px] p-4 space-y-3" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
        <p className="font-bold uppercase" style={{ color: "var(--tk-gold-dark)", fontSize: 11, letterSpacing: ".05em" }}>
          Contenu dupliqué
        </p>

        {vocab.length > 0 && (
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--tk-ink-text)", fontSize: 13 }}>
              Vocabulaire ({vocab.length})
            </p>
            {vocab.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3" style={{ fontSize: 13 }}>
                <span dir="rtl" lang="ar" style={{ color: "var(--tk-ink-text)" }}>{v.arabic_word}</span>
                <span style={{ color: "var(--tk-muted-olive)" }}>{v.french_definition}</span>
              </div>
            ))}
          </div>
        )}

        {formulations.length > 0 && (
          <div>
            <p className="font-semibold mb-1" style={{ color: "var(--tk-ink-text)", fontSize: 13 }}>
              Formulations ({formulations.length}
              {audioCount > 0 ? ` · ${audioCount} audio${audioCount > 1 ? "s" : ""}` : ""})
            </p>
            {formulations.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3" style={{ fontSize: 13 }}>
                <span dir="rtl" lang="ar" style={{ color: "var(--tk-ink-text)" }}>{f.arabic_text}</span>
                <span className="flex items-center gap-1.5" style={{ color: "var(--tk-muted-olive)" }}>
                  {f.audio_path && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--tk-green-active)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                  )}
                  {f.french_text}
                </span>
              </div>
            ))}
          </div>
        )}

        {supportCount > 0 && (
          <p style={{ color: "var(--tk-muted-olive)", fontSize: 12.5 }}>
            {supportCount} support{supportCount > 1 ? "s" : ""} (fichiers) seront aussi copiés.
          </p>
        )}

        <p style={{ color: "var(--tk-faint-olive)", fontSize: 11.5 }}>
          Le devoir, la note privée et la règle de grammaire du cours d&apos;origine ne
          sont pas copiés (la grammaire se duplique séparément, depuis le livre de
          grammaire).
        </p>
      </div>

      <DuplicateForm
        dupAction={duplicateSession.bind(null, recordId)}
        students={students}
        submitLabel="Dupliquer le cours"
      />
    </div>
  );
}
