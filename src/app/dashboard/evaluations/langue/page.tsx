import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LangueClient } from "./langue-client";

export default async function LangueQuizPage() {
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const [vocabRes, formsRes] = await Promise.all([
    supabase
      .from("vocabulary")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
    supabase
      .from("formulations")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
  ]);

  const count = (vocabRes.count ?? 0) + (formsRes.count ?? 0);

  return <LangueClient count={count} />;
}
