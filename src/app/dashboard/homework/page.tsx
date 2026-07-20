import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HomeworkTabs, type HomeworkItem } from "./homework-tabs";

type SubmissionFile = { path: string; name: string };
const AUDIO_RE = /\.(webm|mp4|m4a|ogg|mp3|wav)$/i;

function parseFiles(raw: unknown, fallback: string | null): SubmissionFile[] {
  if (Array.isArray(raw)) {
    return raw.filter(
      (f): f is SubmissionFile =>
        !!f && typeof f === "object" && typeof (f as SubmissionFile).path === "string",
    );
  }
  return fallback ? [{ path: fallback, name: fallback.split("/").pop() ?? fallback }] : [];
}

export default async function DevoirsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const initialFilter =
    filter === "corrige" || filter === "rendu" || filter === "a_rendre" ? filter : "a_rendre";
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: homeworks, error } = await supabase
    .from("homework")
    .select(
      "id, instructions, status, feedback, grade, assigned_at, submission_file, submission_files, correction_file, lesson_records(custom_title)",
    )
    .order("assigned_at", { ascending: false });

  if (error) console.error("dashboard/homework query failed:", error.message);

  const items: HomeworkItem[] = await Promise.all(
    (homeworks ?? []).map(async (hw) => {
      const files = parseFiles(hw.submission_files, hw.submission_file);
      const record = Array.isArray(hw.lesson_records) ? hw.lesson_records[0] : hw.lesson_records;
      const corrected = hw.status === "corrige" || hw.status === "vu";

      // Pour un devoir corrigé : on signe les pièces rendues + la copie corrigée
      // afin que l'élève puisse revoir son travail et la correction (lecture seule).
      let pieces: { url: string; name: string; isAudio: boolean }[] = [];
      let correctionUrl: string | null = null;
      if (corrected) {
        if (files.length > 0) {
          const { data: signed } = await supabase.storage
            .from("homework-submissions")
            .createSignedUrls(files.map((f) => f.path), 3600);
          pieces = files
            .map((f) => {
              const s = signed?.find((x) => x.path === f.path);
              return s?.signedUrl
                ? { url: s.signedUrl, name: f.name, isAudio: AUDIO_RE.test(f.name) || AUDIO_RE.test(f.path) }
                : null;
            })
            .filter((p): p is { url: string; name: string; isAudio: boolean } => p !== null);
        }
        if (hw.correction_file) {
          const { data: c } = await supabase.storage
            .from("homework-corrections")
            .createSignedUrl(hw.correction_file, 3600);
          correctionUrl = c?.signedUrl ?? null;
        }
      }

      return {
        id: hw.id,
        instructions: hw.instructions,
        status: hw.status,
        feedback: hw.feedback,
        grade: hw.grade,
        assignedAt: hw.assigned_at,
        courseTitle: record?.custom_title ?? null,
        existingFiles: files,
        pieceCount: files.length,
        pieces,
        correctionUrl,
      };
    }),
  );

  return (
    <div className="space-y-5">
      <h1
        className="px-0.5 leading-tight"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
      >
        Mes devoirs
      </h1>

      <HomeworkTabs items={items} studentId={studentId} initialFilter={initialFilter} />
    </div>
  );
}
