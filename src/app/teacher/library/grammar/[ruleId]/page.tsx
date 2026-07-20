import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DuplicateForm } from "../../[recordId]/duplicate-form";
import { duplicateGrammarRule } from "./actions";

type Photo = { path: string; name: string };

export default async function LibraryGrammarRulePage({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const { ruleId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: rule, error: ruleError } = await supabase
    .from("grammar_rules")
    .select("id, title, content, photos, student_id, rule_group_id, created_at, lesson_records(session_date)")
    .eq("id", ruleId)
    .maybeSingle();

  if (ruleError) console.error("library/grammar/[ruleId] rule query failed:", ruleError.message);
  if (!rule) notFound();

  const [{ data: studentsRes }, { data: groupRows }] = await Promise.all([
    supabase.from("students").select("id, status, profiles(full_name)"),
    // Élèves qui possèdent déjà cette règle (même rule_group_id) → on les
    // marque pour éviter un doublon en re-dupliquant vers eux, comme pour
    // les cours.
    supabase.from("grammar_rules").select("student_id").eq("rule_group_id", rule.rule_group_id),
  ]);
  const alreadyHasIds = new Set((groupRows ?? []).map((r) => r.student_id));

  const lessonRecord = Array.isArray(rule.lesson_records) ? rule.lesson_records[0] : rule.lesson_records;
  const date = lessonRecord?.session_date ?? rule.created_at;

  const photos = (rule.photos as Photo[] | null) ?? [];
  let photoUrls: { name: string; url: string }[] = [];
  if (photos.length > 0) {
    const { data: signedList } = await supabase.storage
      .from("grammar-photos")
      .createSignedUrls(photos.map((p) => p.path), 3600);
    photoUrls = photos
      .map((p) => {
        const signed = signedList?.find((s) => s.path === p.path);
        return signed?.signedUrl ? { name: p.name, url: signed.signedUrl } : null;
      })
      .filter((f): f is { name: string; url: string } => f !== null);
  }

  // Pas de filtre sur rule.student_id : le représentant du groupe (ici Hamza)
  // doit rester visible dans la liste, grisé via alreadyHas — comme pour les
  // cours (library/[recordId]/page.tsx), qui ne filtrent jamais le source non
  // plus.
  const students = (studentsRes ?? []).map((s) => ({
    id: s.id,
    name: (Array.isArray(s.profiles) ? s.profiles[0]?.full_name : s.profiles?.full_name) ?? "Élève",
    status: s.status,
    alreadyHas: alreadyHasIds.has(s.id),
  }));

  return (
    <div className="space-y-5">
      <BackLink />

      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink-text)" }}
        >
          {rule.title}
        </h1>
        <p className="mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>
          {format(new Date(date), "d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="rounded-[16px] p-4 space-y-3" style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}>
        <p className="font-bold uppercase" style={{ color: "var(--tk-gold-dark)", fontSize: 11, letterSpacing: ".05em" }}>
          Contenu dupliqué
        </p>
        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>
          {rule.content}
        </p>

        {photoUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.url}
                src={p.url}
                alt={p.name}
                className="rounded-[10px] object-cover"
                style={{ width: "100%", aspectRatio: "1", border: "1px solid var(--tk-parchment-border)" }}
              />
            ))}
          </div>
        )}

        <p style={{ color: "var(--tk-faint-olive)", fontSize: 11.5 }}>
          {photoUrls.length > 0
            ? `${photoUrls.length} photo${photoUrls.length > 1 ? "s" : ""} seront aussi copiées.`
            : "Aucune photo attachée à cette règle."}
        </p>
      </div>

      <DuplicateForm
        dupAction={duplicateGrammarRule.bind(null, ruleId)}
        students={students}
        submitLabel="Dupliquer la règle"
        alreadyHasLabel="a déjà cette règle"
      />
    </div>
  );
}

async function BackLink() {
  const supabase = await createClient();
  const { data: grammarBook } = await supabase
    .from("course_books")
    .select("id")
    .eq("kind", "grammar")
    .maybeSingle();

  return (
    <Link
      href={grammarBook ? `/teacher/books/${grammarBook.id}` : "/teacher/books"}
      className="inline-flex items-center gap-1 font-semibold"
      style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}
    >
      ← Livre de grammaire
    </Link>
  );
}
