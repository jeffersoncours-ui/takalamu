import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BookManager } from "./book-manager";

export default async function TeacherBooksPage() {
  await requireTeacher();
  const supabase = await createClient();

  const { data: books, error } = await supabase
    .from("course_books")
    .select("id, title, subtitle, cover_url, kind, order_index")
    .order("order_index");
  if (error) console.error("teacher/books query failed:", error.message);

  // Nombre de cours distincts par livre (pour l'info + le garde-fou de suppression).
  const { data: records } = await supabase.from("lesson_records").select("book_id, course_group_id");
  const groupsByBook = new Map<string, Set<string>>();
  for (const r of records ?? []) {
    if (!r.book_id) continue;
    if (!groupsByBook.has(r.book_id)) groupsByBook.set(r.book_id, new Set());
    groupsByBook.get(r.book_id)!.add(r.course_group_id);
  }

  // Nombre de règles distinctes (rule_group_id) pour le livre de grammaire —
  // pas de book_id sur grammar_rules, RLS (gr_teacher_all) scope déjà aux
  // élèves de l'enseignant courant.
  const { data: ruleRows } = await supabase.from("grammar_rules").select("rule_group_id");
  const ruleGroupCount = new Set((ruleRows ?? []).map((r) => r.rule_group_id)).size;

  const items = (books ?? []).map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    cover_url: b.cover_url,
    kind: b.kind,
    courseCount: b.kind === "grammar" ? ruleGroupCount : (groupsByBook.get(b.id)?.size ?? 0),
  }));

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
        >
          Mes livres
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>
          Range tes cours par livre. La grammaire (livre « grammaire ») se remplit toute seule.
        </p>
      </div>

      <BookManager books={items} />
    </div>
  );
}
