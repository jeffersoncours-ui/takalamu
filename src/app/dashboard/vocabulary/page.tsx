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
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-slate-900">
        Mon vocabulaire{vocab?.length ? ` (${vocab.length})` : ""}
      </h1>
      <VocabSearch items={vocab ?? []} />
    </div>
  );
}
