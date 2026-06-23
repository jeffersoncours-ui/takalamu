import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import VocabSearch from "./vocab-search";

export default async function VocabulairePage() {
  await requireStudent();
  const supabase = await createClient();

  const { data: vocab } = await supabase
    .from("vocabulary")
    .select("id, arabic_word, french_definition, root, created_at")
    .order("created_at", { ascending: false });

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
          {vocab?.length ?? 0} mot{(vocab?.length ?? 0) > 1 ? "s" : ""} appris
        </p>
      </div>
      <VocabSearch items={vocab ?? []} />
    </div>
  );
}
