import type { Database } from "@/lib/supabase/database.types";

export type LessonPhase = Database["public"]["Enums"]["lesson_phase"];

/** Phases du programme (valeur en base ↔ libellé affiché). */
export const LESSON_PHASES: { value: LessonPhase; label: string }[] = [
  { value: "dechiffrage", label: "Déchiffrage" },
  { value: "lecture_oral", label: "Lecture orale" },
  { value: "grammaire", label: "Grammaire" },
];

export function phaseLabel(phase: LessonPhase): string {
  return LESSON_PHASES.find((p) => p.value === phase)?.label ?? phase;
}

export function isLessonPhase(value: unknown): value is LessonPhase {
  return LESSON_PHASES.some((p) => p.value === value);
}
