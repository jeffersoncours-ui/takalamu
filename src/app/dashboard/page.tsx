import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, attendanceBadge } from "@/components/status-badge";

export default async function CoursPage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  const { data: recordsData, error: recordsError } = await supabase
    .from("lesson_records")
    .select("id, session_date, attendance, public_recap, lessons(title, audio_asset_id, audio_assets!lessons_audio_asset_fk(storage_path, title))")
    .order("session_date", { ascending: false });

  if (recordsError) {
    console.error("lesson_records query failed:", recordsError.message);
  }

  const records = recordsData ?? [];
  const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "—";

  // Batch-generate signed URLs for lesson audio (1 h TTL)
  const audioPaths = records
    .map((r) => {
      const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
      const asset = lesson?.audio_assets
        ? (Array.isArray(lesson.audio_assets) ? lesson.audio_assets[0] : lesson.audio_assets)
        : null;
      return (asset as { storage_path?: string } | null)?.storage_path ?? null;
    })
    .filter((p): p is string => p !== null);

  const audioUrlMap = new Map<string, string>();
  if (audioPaths.length > 0) {
    const { data: signedList } = await supabase.storage
      .from("lesson-audio")
      .createSignedUrls(audioPaths, 3600);
    signedList?.forEach((item) => {
      if (item.signedUrl && item.path) audioUrlMap.set(item.path, item.signedUrl);
    });
  }

  // Stats parcours
  const totalSessions = records.length;
  const presentish = records.filter(
    (r) => r.attendance === "present" || r.attendance === "late",
  ).length;
  const assiduite =
    totalSessions > 0 ? Math.round((presentish / totalSessions) * 100) : null;

  return (
    <div className="space-y-1">
      {/* Salutation */}
      <div className="px-0.5 pb-3">
        <div className="font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
          Salâm &apos;alaykoum,
        </div>
        <div
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          {firstName}
        </div>
      </div>

      {/* Parcours */}
      <div
        className="pt-6 pb-3 px-0.5"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 600, fontSize: 19, color: "#1C1A17" }}
      >
        Mon parcours
      </div>
      <div className="flex gap-3">
        <div
          className="flex-1 rounded-[18px] p-4"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
        >
          <div className="leading-none" style={{ fontWeight: 800, fontSize: 30, color: "#1C1A17" }}>
            {totalSessions}
          </div>
          <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>
            Séances suivies
          </div>
        </div>
        <div
          className="flex-1 rounded-[18px] p-4"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
        >
          <div className="leading-none" style={{ fontWeight: 800, fontSize: 30, color: "#0F9D6E" }}>
            {assiduite !== null ? `${assiduite}%` : "—"}
          </div>
          <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 12 }}>
            Assiduité
          </div>
        </div>
      </div>

      {/* Historique */}
      <div
        className="pt-6 pb-3 px-0.5"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 600, fontSize: 19, color: "#1C1A17" }}
      >
        Historique
      </div>

      {records.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun cours enregistré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {records.map((r) => {
            const lesson = Array.isArray(r.lessons) ? r.lessons[0] : r.lessons;
            const badge = attendanceBadge(r.attendance);
            const rawAsset = lesson?.audio_assets
              ? (Array.isArray(lesson.audio_assets) ? lesson.audio_assets[0] : lesson.audio_assets)
              : null;
            const audioAsset = rawAsset as { storage_path: string; title: string | null } | null;
            const audioUrl = audioAsset ? audioUrlMap.get(audioAsset.storage_path) ?? null : null;
            return (
              <div
                key={r.id}
                className="rounded-[16px] p-[15px]"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>
                    {lesson?.title ?? "Cours sans leçon"}
                  </div>
                  <StatusBadge hue={badge.hue} label={badge.label} />
                </div>
                <div className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
                  {format(new Date(r.session_date), "EEE d MMM", { locale: fr })}
                  {r.public_recap ? ` · ${r.public_recap}` : ""}
                </div>
                {audioUrl && (
                  <div className="mt-2.5">
                    {audioAsset?.title && (
                      <p className="mb-1 text-xs font-medium" style={{ color: "#8B857A" }}>
                        {audioAsset.title}
                      </p>
                    )}
                    <audio
                      src={audioUrl}
                      controls
                      className="w-full rounded-lg"
                      style={{ height: 36 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
