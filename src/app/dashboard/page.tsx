import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CoursPage() {
  const { profile } = await requireStudent();
  const supabase = await createClient();

  const [
    { data: records, error: recordsError },
    { count: vocabCount },
    { count: formCount },
    { count: grammarCount },
    { data: lastAttempt },
    { data: books, error: booksError },
  ] = await Promise.all([
    supabase.from("lesson_records").select("id, session_date, book_id, course_group_id"),
    supabase.from("vocabulary").select("id", { count: "exact", head: true }),
    supabase.from("formulations").select("id", { count: "exact", head: true }),
    supabase.from("grammar_rules").select("id", { count: "exact", head: true }),
    supabase
      .from("quiz_attempts")
      .select("answers, taken_at")
      .order("taken_at", { ascending: false })
      .limit(1),
    supabase.from("course_books").select("id, title, subtitle, cover_url, kind, order_index").order("order_index"),
  ]);

  if (recordsError) console.error("lesson_records query failed:", recordsError.message);
  if (booksError) console.error("course_books query failed:", booksError.message);

  const rows = records ?? [];
  const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "—";

  const startDate =
    rows.length > 0
      ? format(
          new Date(rows.reduce((min, r) => (r.session_date < min ? r.session_date : min), rows[0].session_date)),
          "d MMMM yyyy",
          { locale: fr },
        )
      : null;

  // Dernière note = score du tout dernier quiz passé, affiché en brut "X/Y"
  // (bonnes réponses / total) recalculé depuis le détail des réponses — aucun
  // historique de quiz n'est exposé, seule cette dernière note l'est.
  const lastAnswers = (lastAttempt?.[0]?.answers as { is_correct?: boolean }[] | null) ?? null;
  const lastGrade =
    lastAnswers && lastAnswers.length > 0
      ? `${lastAnswers.filter((a) => a.is_correct).length}/${lastAnswers.length}`
      : null;

  // Nombre de cours distincts (course_group) par livre, pour cet élève.
  const courseGroupsByBook = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.book_id) continue;
    if (!courseGroupsByBook.has(r.book_id)) courseGroupsByBook.set(r.book_id, new Set());
    courseGroupsByBook.get(r.book_id)!.add(r.course_group_id);
  }

  // On n'affiche que les livres où l'élève a du contenu :
  //  - livre "courses" : au moins un cours ;
  //  - livre "grammar" : au moins une règle de grammaire (agrégation auto).
  const visibleBooks = (books ?? []).filter((b) =>
    b.kind === "grammar" ? (grammarCount ?? 0) > 0 : (courseGroupsByBook.get(b.id)?.size ?? 0) > 0,
  );

  const bookCount = (b: (typeof visibleBooks)[number]) =>
    b.kind === "grammar" ? (grammarCount ?? 0) : courseGroupsByBook.get(b.id)?.size ?? 0;
  const bookUnit = (b: (typeof visibleBooks)[number], n: number) =>
    b.kind === "grammar" ? (n > 1 ? "règles" : "règle") : n > 1 ? "cours" : "cours";

  return (
    <div className="space-y-1">
      {/* Salutation */}
      <div className="px-0.5 pb-1">
        <div className="font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
          Salâm &apos;alaykoum,
        </div>
        <div
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          {firstName}
        </div>
        {startDate && (
          <div className="mt-1 font-medium" style={{ color: "#8B857A", fontSize: 13 }}>
            En évolution depuis le {startDate}
          </div>
        )}
      </div>

      {/* Tuiles cliquables : Mots · Expressions · Dernière note */}
      <div className="flex gap-2.5 pt-3">
        <StatTile value={String(vocabCount ?? 0)} label="Mots" href="/dashboard/vocabulary" />
        <StatTile value={String(formCount ?? 0)} label="Expressions" href="/dashboard/formulations" />
        <StatTile value={lastGrade ?? "—"} label="Dernière note" accent />
      </div>

      {/* Reprendre mes cours */}
      <div
        className="pt-7 pb-3 px-0.5"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 600, fontSize: 19, color: "#1C1A17" }}
      >
        Reprendre mes cours
      </div>

      {visibleBooks.length === 0 ? (
        <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun cours enregistré pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleBooks.map((b) => {
            const n = bookCount(b);
            return (
              <Link
                key={b.id}
                href={`/dashboard/livres/${b.id}`}
                className="flex items-center gap-3.5 rounded-[18px] p-3 transition-opacity hover:opacity-90"
                style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.05)" }}
              >
                {/* Couverture */}
                {b.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.cover_url}
                    alt=""
                    className="shrink-0 rounded-[10px] object-cover"
                    style={{ width: 62, height: 84, boxShadow: "0 2px 8px rgba(28,26,23,.15)" }}
                  />
                ) : (
                  <div
                    className="shrink-0 rounded-[10px]"
                    style={{ width: 62, height: 84, background: "#EFEAE0" }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold leading-snug"
                    dir="rtl"
                    lang="ar"
                    style={{ color: "#1C1A17", fontSize: 18, fontFamily: "var(--font-amiri)" }}
                  >
                    {b.title}
                  </div>
                  {b.subtitle && (
                    <div className="mt-0.5 font-medium" style={{ color: "#8B857A", fontSize: 13 }}>
                      {b.subtitle}
                    </div>
                  )}
                  <div className="mt-1.5 font-semibold" style={{ color: "#0F9D6E", fontSize: 12 }}>
                    {n} {bookUnit(b, n)}
                  </div>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C7C0B4" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ value, label, href, accent }: { value: string; label: string; href?: string; accent?: boolean }) {
  const className = "flex-1 rounded-[16px] p-3.5";
  const style = { background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" };
  const inner = (
    <>
      <div className="leading-none" style={{ fontWeight: 800, fontSize: 22, color: accent ? "#0F9D6E" : "#1C1A17" }}>
        {value}
      </div>
      <div className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 11 }}>
        {label}
      </div>
    </>
  );

  // Tuile "Dernière note" : simple encart d'information, non cliquable.
  if (!href) {
    return (
      <div className={className} style={style}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={href} className={`${className} transition-opacity hover:opacity-85`} style={style}>
      {inner}
    </Link>
  );
}
