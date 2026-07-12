import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import VocabSearch from "./vocab-search";

export default async function VocabulairePage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: vocab, error: vocabError } = await supabase
    .from("vocabulary")
    .select("id, arabic_word, french_definition, root, created_at, lesson_record_id, lesson_records(session_date, custom_title)")
    .order("created_at", { ascending: true });

  if (vocabError) console.error("dashboard/vocabulary query failed:", vocabError.message);

  const items = (vocab ?? []).map((v) => {
    const record = Array.isArray(v.lesson_records) ? v.lesson_records[0] : v.lesson_records;
    return {
      id: v.id,
      arabic_word: v.arabic_word,
      french_definition: v.french_definition,
      root: v.root,
      lessonRecordId: v.lesson_record_id,
      sessionDate: record?.session_date ?? null,
      customTitle: record?.custom_title ?? null,
    };
  });

  const groups = groupByLesson(items);

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Mon glossaire
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} mot{items.length > 1 ? "s" : ""} appris
        </p>
      </div>
      <VocabSearch groups={groups} />
    </div>
  );
}
