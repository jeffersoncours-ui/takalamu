import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { groupByLesson } from "@/lib/group-by-lesson";
import FormulationSearch from "./formulation-search";

export default async function FormulationsPage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: forms } = await supabase
    .from("formulations")
    .select("id, arabic_text, french_text, created_at, lesson_record_id, lesson_records(session_date, custom_title)")
    .order("created_at", { ascending: true });

  const items = (forms ?? []).map((f) => {
    const record = Array.isArray(f.lesson_records) ? f.lesson_records[0] : f.lesson_records;
    return {
      id: f.id,
      arabic_text: f.arabic_text,
      french_text: f.french_text,
      lessonRecordId: f.lesson_record_id,
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
          Mes formulations
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} expression{items.length > 1 ? "s" : ""}
        </p>
      </div>

      <FormulationSearch groups={groups} />
    </div>
  );
}
