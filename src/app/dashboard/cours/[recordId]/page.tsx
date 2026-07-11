import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, attendanceBadge } from "@/components/status-badge";

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
    .select("id, session_date, attendance, public_recap, support_files, custom_title")
    .eq("id", recordId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!record) notFound();

  const [orderRes, vocabRes, grammarRes, formRes, hwRes] = await Promise.all([
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
      .select("id, instructions")
      .eq("lesson_record_id", recordId)
      .maybeSingle(),
  ]);

  const courseNumber =
    (orderRes.data ?? []).findIndex((r) => r.id === recordId) + 1;
  const vocab = vocabRes.data ?? [];
  const grammar = grammarRes.data ?? [];
  const formulations = formRes.data ?? [];
  const homework = hwRes.data;
  const badge = attendanceBadge(record.attendance);

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
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Mes cours
      </Link>

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "#1C1A17" }}
          >
            {record.custom_title || (courseNumber > 0 ? `Cours ${courseNumber}` : "Cours")}
          </h1>
          <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
            {format(new Date(record.session_date), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <StatusBadge hue={badge.hue} label={badge.label} />
      </div>

      {/* Récap */}
      {record.public_recap && (
        <div className="rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="leading-relaxed" style={{ color: "#1C1A17", fontSize: 14 }}>{record.public_recap}</p>
        </div>
      )}

      {/* Documents / photos du cours */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <p className="font-bold uppercase px-0.5" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
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
                style={{ border: "1px solid #EFEAE0" }}
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
                style={{ background: "#fff", border: "1px solid #EFEAE0" }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F9D6E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="font-medium text-sm" style={{ color: "#1C1A17" }}>{f.name}</span>
              </a>
            ),
          )}
        </div>
      )}

      {/* Vocabulaire du cours */}
      {vocab.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Vocabulaire ({vocab.length})
          </p>
          {vocab.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-3">
              <span className="text-sm" style={{ color: "#4A463F" }}>{v.french_definition}</span>
              <span dir="rtl" lang="ar" className="font-arabic shrink-0" style={{ fontSize: 18, fontWeight: 700, color: "#0A553F" }}>
                {v.arabic_word}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Grammaire du cours */}
      {grammar.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2.5" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Règles de grammaire ({grammar.length})
          </p>
          {grammar.map((g) => (
            <div key={g.id}>
              <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>{g.title}</p>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "#4A463F", fontSize: 13 }}>{g.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Formulations du cours */}
      {formulations.length > 0 && (
        <div className="rounded-[16px] p-4 space-y-2.5" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Formulations ({formulations.length})
          </p>
          {formulations.map((f) => (
            <div key={f.id} className="space-y-1">
              <p dir="rtl" lang="ar" className="font-arabic" style={{ fontSize: 18, fontWeight: 700, color: "#0A553F", lineHeight: 1.5 }}>
                {f.arabic_text}
              </p>
              <p style={{ color: "#4A463F", fontSize: 14 }}>{f.french_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Devoir du cours */}
      {homework?.instructions && (
        <div className="rounded-[16px] p-4 space-y-1.5" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
          <div className="flex items-center justify-between">
            <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
              Devoir
            </p>
            <Link href="/dashboard/homework" className="font-semibold" style={{ color: "#0F9D6E", fontSize: 12 }}>
              Voir →
            </Link>
          </div>
          <p style={{ color: "#1C1A17", fontSize: 14 }}>{homework.instructions}</p>
        </div>
      )}
    </div>
  );
}
