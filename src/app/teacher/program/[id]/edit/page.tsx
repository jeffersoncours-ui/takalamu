import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { updateLesson, uploadLessonAudio, removeLessonAudio } from "../../actions";
import { LessonForm } from "../../lesson-form";
import { AudioSection } from "./audio-section";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select(
      "id, title, phase, objective, grammar_point, reading_support, homework_template, audio_asset_id, audio_assets(id, storage_path, title)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lesson) notFound();

  const audioAsset = lesson.audio_asset_id
    ? (Array.isArray(lesson.audio_assets)
        ? lesson.audio_assets[0]
        : lesson.audio_assets) as { id: string; storage_path: string; title: string | null } | null
    : null;

  let signedUrl: string | null = null;
  if (audioAsset) {
    const { data } = await supabase.storage
      .from("lesson-audio")
      .createSignedUrl(audioAsset.storage_path, 3600);
    signedUrl = data?.signedUrl ?? null;
  }

  const updateAction = updateLesson.bind(null, lesson.id);
  const uploadAction = uploadLessonAudio.bind(null, lesson.id);
  const removeAction = removeLessonAudio.bind(null, lesson.id);

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-slate-900">Éditer la leçon</h1>
        <LessonForm
          action={updateAction}
          submitLabel="Enregistrer"
          defaults={{
            title: lesson.title,
            phase: lesson.phase,
            objective: lesson.objective,
            grammar_point: lesson.grammar_point,
            reading_support: lesson.reading_support,
            homework_template: lesson.homework_template,
          }}
        />
      </div>

      <AudioSection
        uploadAction={uploadAction}
        removeAction={removeAction}
        currentAudio={audioAsset ? { title: audioAsset.title, signedUrl } : null}
      />
    </div>
  );
}
