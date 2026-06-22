import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { updateLesson } from "../../actions";
import { LessonForm } from "../../lesson-form";

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
      "id, title, phase, objective, grammar_point, reading_support, homework_template",
    )
    .eq("id", id)
    .maybeSingle();

  if (!lesson) notFound();

  // Lie l'id de la leçon à l'action de mise à jour.
  const action = updateLesson.bind(null, lesson.id);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Éditer la leçon</h1>
      <LessonForm
        action={action}
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
  );
}
