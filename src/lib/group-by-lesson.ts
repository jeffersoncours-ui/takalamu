export type LessonGroup<T> = {
  key: string;
  label: string;
  sessionDate: string | null;
  items: T[];
};

type Groupable = { lessonRecordId: string | null; sessionDate: string | null };

/** Regroupe des entrées (vocabulaire, grammaire…) par séance, "Cours 1" = la plus ancienne. */
export function groupByLesson<T extends Groupable>(items: T[]): LessonGroup<T>[] {
  const withRecord = items.filter((i) => i.lessonRecordId);
  const withoutRecord = items.filter((i) => !i.lessonRecordId);

  const byRecord = new Map<string, T[]>();
  for (const item of withRecord) {
    const key = item.lessonRecordId as string;
    const bucket = byRecord.get(key);
    if (bucket) bucket.push(item);
    else byRecord.set(key, [item]);
  }

  const recordGroups = Array.from(byRecord.entries())
    .map(([key, groupItems]) => ({
      key,
      sessionDate: groupItems[0].sessionDate,
      items: groupItems,
    }))
    .sort((a, b) => {
      if (!a.sessionDate) return 1;
      if (!b.sessionDate) return -1;
      return new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime();
    })
    .map((g, idx) => ({ ...g, label: `Cours ${idx + 1}` }));

  const groups: LessonGroup<T>[] = recordGroups;
  if (withoutRecord.length > 0) {
    groups.push({ key: "none", label: "Sans séance associée", sessionDate: null, items: withoutRecord });
  }
  return groups;
}
