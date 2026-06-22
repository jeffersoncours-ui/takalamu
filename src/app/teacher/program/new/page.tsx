import { createLesson } from "../actions";
import { LessonForm } from "../lesson-form";

export default function NewLessonPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-slate-900">Nouvelle leçon</h1>
      <LessonForm action={createLesson} submitLabel="Créer la leçon" />
    </div>
  );
}
