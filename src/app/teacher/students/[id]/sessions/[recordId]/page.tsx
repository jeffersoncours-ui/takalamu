import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, homeworkBadge } from "@/components/status-badge";
import { deleteSession } from "./actions";
import { DeleteSessionButton } from "./delete-session-button";

type SupportFile = { path: string; name: string };

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("lesson_records")
    .select("id, session_date, public_recap, support_files, custom_title, students(profiles(full_name))")
    .eq("id", recordId)
    .eq("student_id", id)
    .maybeSingle();

  if (!record) notFound();

  const [noteRes, vocabRes, grammarRes, formRes, hwRes] = await Promise.all([
    supabase
      .from("session_private_notes")
      .select("content")
      .eq("lesson_record_id", recordId)
      .maybeSingle(),
    supabase
      .from("vocabulary")
      .select("id, arabic_word, french_definition")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("grammar_rules")
      .select("id, title, content")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("formulations")
      .select("id, arabic_text, french_text")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("homework")
      .select("id, instructions, status")
      .eq("lesson_record_id", recordId)
      .maybeSingle(),
  ]);

  const student = Array.isArray(record.students) ? record.students[0] : record.students;
  const profile = student
    ? (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles)
    : null;
  const studentName = profile?.full_name ?? "—";

  const vocab = vocabRes.data ?? [];
  const grammar = grammarRes.data ?? [];
  const formulations = formRes.data ?? [];
  const homework = hwRes.data;
  const privateNote = noteRes.data?.content ?? "";
  const supportFiles = (record.support_files as SupportFile[] | null) ?? [];

  let fileUrls: { name: string; url: string }[] = [];
  if (supportFiles.length > 0) {
    const paths = supportFiles.map((f) => f.path);
    const { data: signedList } = await supabase.storage
      .from("session-files")
      .createSignedUrls(paths, 3600);
    fileUrls = supportFiles
      .map((f) => {
        const signed = signedList?.find((s) => s.path === f.path);
        return signed?.signedUrl ? { name: f.name, url: signed.signedUrl } : null;
      })
      .filter((f): f is { name: string; url: string } => f !== null);
  }

  return (
    <div className="-mx-4 -mt-5">
      {/* Héros encre */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-6 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <Link href={`/teacher/students/${id}#historique`} className="relative inline-flex items-center gap-2.5">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 15, color: "var(--tk-sage)" }}>
            {studentName}
          </span>
        </Link>

        <div className="relative mt-5">
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "var(--tk-cream-text)" }}
          >
            {record.custom_title || format(new Date(record.session_date), "d MMMM yyyy", { locale: fr })}
          </h1>
          {record.custom_title && (
            <p className="mt-1" style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 14, color: "var(--tk-sage)" }}>
              {format(new Date(record.session_date), "d MMMM yyyy", { locale: fr })}
            </p>
          )}
        </div>
      </div>

      <div className="px-[22px] pt-5 pb-2 space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/teacher/students/${id}/sessions/${recordId}/edit`}
            className="flex-1 flex items-center justify-center rounded-[12px] py-2.5 font-semibold text-sm transition-opacity hover:opacity-85"
            style={{ background: "rgba(46,90,138,.10)", color: "var(--tk-info)", border: "1px solid rgba(46,90,138,.3)" }}
          >
            Modifier
          </Link>
          <DeleteSessionButton action={deleteSession.bind(null, id, recordId)} />
        </div>

        {/* Récap public */}
        {record.public_recap && (
          <div
            className="rounded-[16px] p-4"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
          >
            <p className="font-bold uppercase mb-1.5" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Récap — vu par l&apos;élève
            </p>
            <p className="leading-relaxed" style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>{record.public_recap}</p>
          </div>
        )}

        {/* Vocabulaire du jour */}
        {vocab.length > 0 && (
          <div className="rounded-[16px] p-4 space-y-2" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Vocabulaire ({vocab.length})
            </p>
            {vocab.map((v) => (
              <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
                <span dir="rtl" lang="ar" className="font-arabic font-bold" style={{ color: "var(--tk-ink-hero-to)", fontSize: 18 }}>{v.arabic_word}</span>
                <span style={{ color: "var(--tk-ink-text-soft)" }}>{v.french_definition}</span>
              </div>
            ))}
          </div>
        )}

        {/* Grammaire du jour */}
        {grammar.length > 0 && (
          <div className="rounded-[16px] p-4 space-y-2" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Règles de grammaire ({grammar.length})
            </p>
            {grammar.map((g) => (
              <div key={g.id}>
                <p className="font-semibold" style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>{g.title}</p>
                <p className="leading-relaxed" style={{ color: "var(--tk-ink-text-soft)", fontSize: 13 }}>{g.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* Formulations du jour */}
        {formulations.length > 0 && (
          <div className="rounded-[16px] p-4 space-y-2.5" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Formulations ({formulations.length})
            </p>
            {formulations.map((f) => (
              <div key={f.id} className="space-y-1">
                <p dir="rtl" lang="ar" className="font-arabic font-bold" style={{ fontSize: 16, color: "var(--tk-ink-hero-to)" }}>{f.arabic_text}</p>
                <p style={{ color: "var(--tk-ink-text-soft)", fontSize: 13 }}>{f.french_text}</p>
              </div>
            ))}
          </div>
        )}

        {/* Devoir */}
        {homework && (
          <div className="rounded-[16px] p-4 space-y-1.5" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
            <div className="flex items-center justify-between">
              <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
                Devoir
              </p>
              <StatusBadge {...homeworkBadge(homework.status)} />
            </div>
            <p style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>{homework.instructions}</p>
          </div>
        )}

        {/* Supports */}
        {fileUrls.length > 0 && (
          <div className="rounded-[16px] p-4 space-y-2" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Supports
            </p>
            {fileUrls.map((f) => (
              <a
                key={f.url}
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-medium"
                style={{ color: "var(--tk-green-active)", fontSize: 13 }}
              >
                {f.name}
              </a>
            ))}
          </div>
        )}

        {/* Note privée */}
        {privateNote && (
          <div
            className="rounded-[16px] p-4 space-y-1"
            style={{ background: "rgba(184,120,42,.08)", border: "1px solid rgba(184,120,42,.3)" }}
          >
            <p className="flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 700, color: "var(--tk-gold-darker)", textTransform: "uppercase", letterSpacing: ".14em" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--tk-warning)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Note privée — non visible par l&apos;élève
            </p>
            <p className="leading-relaxed" style={{ color: "#7A5714", fontSize: 13 }}>{privateNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
