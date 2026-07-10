import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, attendanceBadge, homeworkBadge } from "@/components/status-badge";

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
    .select("id, session_date, attendance, public_recap, support_files, students(profiles(full_name))")
    .eq("id", recordId)
    .eq("student_id", id)
    .maybeSingle();

  if (!record) notFound();

  const [noteRes, vocabRes, grammarRes, hwRes] = await Promise.all([
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

  const badge = attendanceBadge(record.attendance);
  const vocab = vocabRes.data ?? [];
  const grammar = grammarRes.data ?? [];
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
    <div className="space-y-5">
      {/* Retour */}
      <Link
        href={`/teacher/students/${id}#historique`}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← {studentName}
      </Link>

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "#1C1A17" }}
        >
          {format(new Date(record.session_date), "d MMMM yyyy", { locale: fr })}
        </h1>
        <StatusBadge hue={badge.hue} label={badge.label} />
      </div>

      {/* Récap public */}
      {record.public_recap && (
        <div
          className="rounded-[16px] p-4"
          style={{ background: "#fff", border: "1px solid #EFEAE0" }}
        >
          <p className="font-bold uppercase mb-1.5" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Récap — vu par l&apos;élève
          </p>
          <p className="leading-relaxed" style={{ color: "#1C1A17", fontSize: 14 }}>{record.public_recap}</p>
        </div>
      )}

      {/* Vocabulaire du jour */}
      {vocab.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Vocabulaire ({vocab.length})
          </p>
          {vocab.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
              <span dir="rtl" lang="ar" className="font-medium" style={{ color: "#1C1A17" }}>{v.arabic_word}</span>
              <span style={{ color: "#4A463F" }}>{v.french_definition}</span>
            </div>
          ))}
        </div>
      )}

      {/* Grammaire du jour */}
      {grammar.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Règles de grammaire ({grammar.length})
          </p>
          {grammar.map((g) => (
            <div key={g.id}>
              <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>{g.title}</p>
              <p className="leading-relaxed" style={{ color: "#4A463F", fontSize: 13 }}>{g.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Devoir */}
      {homework && (
        <div className="rounded-[16px] p-4 space-y-1.5" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <div className="flex items-center justify-between">
            <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
              Devoir
            </p>
            <StatusBadge {...homeworkBadge(homework.status)} />
          </div>
          <p style={{ color: "#1C1A17", fontSize: 14 }}>{homework.instructions}</p>
        </div>
      )}

      {/* Supports */}
      {fileUrls.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Supports
          </p>
          {fileUrls.map((f) => (
            <a
              key={f.url}
              href={f.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-medium"
              style={{ color: "#0F9D6E", fontSize: 13 }}
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
          style={{ background: "#FFFBF2", border: "1px solid #F2E3C2" }}
        >
          <p className="flex items-center gap-1.5" style={{ fontSize: 11, fontWeight: 700, color: "#9A6206", textTransform: "uppercase", letterSpacing: ".05em" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9A6206" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Note privée — non visible par l&apos;élève
          </p>
          <p className="leading-relaxed" style={{ color: "#7A5A0F", fontSize: 13 }}>{privateNote}</p>
        </div>
      )}
    </div>
  );
}
