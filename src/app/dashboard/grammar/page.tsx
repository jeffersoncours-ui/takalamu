import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import GrammarSearch from "./grammar-search";

export default async function GrammairePage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("grammar_rules")
    .select("id, title, content, created_at, lesson_record_id, lesson_records(session_date)")
    .order("created_at", { ascending: true });

  const items = (rules ?? []).map((r) => {
    const record = Array.isArray(r.lesson_records) ? r.lesson_records[0] : r.lesson_records;
    return {
      id: r.id,
      title: r.title,
      content: r.content,
      lessonRecordId: r.lesson_record_id,
      sessionDate: record?.session_date ?? null,
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
          Mes règles de grammaire
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} règle{items.length > 1 ? "s" : ""}
        </p>
      </div>

      <GrammarSearch groups={groups} />
    </div>
  );
}
