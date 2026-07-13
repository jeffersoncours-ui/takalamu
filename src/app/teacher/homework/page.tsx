import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/status-badge";
import { HwCorrectionForm } from "./hw-correction-form";

export default async function HomeworkQueuePage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: homework, error: homeworkError } = await supabase
    .from("homework")
    .select(
      "id, instructions, assigned_at, submission_file, submission_files, students(id, profiles(full_name)), lesson_records(session_date, custom_title)",
    )
    .eq("status", "rendu")
    .order("assigned_at", { ascending: true });

  if (homeworkError) console.error("teacher/homework query failed:", homeworkError.message);
  const items = homework ?? [];

  const AUDIO_RE = /\.(webm|mp4|m4a|ogg|mp3|wav)$/i;
  type SubmittedPiece = { url: string; name: string; isAudio: boolean };

  // Pièces déposées : la liste `submission_files`, sinon l'ancien champ mono-fichier.
  const filesOf = (hw: (typeof items)[number]): { path: string; name: string }[] => {
    const raw = hw.submission_files;
    if (Array.isArray(raw)) {
      return raw.filter(
        (f): f is { path: string; name: string } =>
          !!f && typeof f === "object" && typeof (f as { path?: unknown }).path === "string",
      );
    }
    return hw.submission_file
      ? [{ path: hw.submission_file, name: hw.submission_file.split("/").pop() ?? hw.submission_file }]
      : [];
  };

  // URLs signées (1 h) pour toutes les pièces déposées.
  const submissionFiles = new Map<string, SubmittedPiece[]>();
  await Promise.all(
    items.map(async (hw) => {
      const files = filesOf(hw);
      if (files.length === 0) return;
      const signed = await Promise.all(
        files.map(async (f) => {
          const { data } = await supabase.storage
            .from("homework-submissions")
            .createSignedUrl(f.path, 3600);
          return data?.signedUrl
            ? { url: data.signedUrl, name: f.name, isAudio: AUDIO_RE.test(f.name) || AUDIO_RE.test(f.path) }
            : null;
        }),
      );
      submissionFiles.set(hw.id, signed.filter((s): s is SubmittedPiece => s !== null));
    }),
  );

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
                    {record?.custom_title ? `${record.custom_title} · ` : ""}{format(new Date(hw.assigned_at), "d MMM", { locale: fr })}
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

              {(submissionFiles.get(hw.id)?.length ?? 0) > 0 && (
                <div className="flex flex-col gap-2">
                  {submissionFiles.get(hw.id)!.map((piece, i) =>
                    piece.isAudio ? (
                      <div
                        key={i}
                        className="rounded-[14px] p-3"
                        style={{ background: "#EAEFFD", border: "1px solid #C5D2F7" }}
                      >
                        <p className="font-semibold uppercase mb-2" style={{ color: "#2C4BB8", fontSize: 11, letterSpacing: ".05em" }}>
                          🎙 Réponse audio de l&apos;élève
                        </p>
                        <audio controls src={piece.url} className="w-full" style={{ height: 40 }} />
                      </div>
                    ) : (
                      <a
                        key={i}
                        href={piece.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-[14px] p-3 transition-opacity hover:opacity-80"
                        style={{ background: "#EAEFFD", border: "1px solid #C5D2F7" }}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3E63DD" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                          <circle cx="12" cy="13" r="3" />
                        </svg>
                        <span className="font-semibold" style={{ color: "#2C4BB8", fontSize: 13 }}>
                          {piece.name || "Voir la copie déposée"}
                        </span>
                      </a>
                    ),
                  )}
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
