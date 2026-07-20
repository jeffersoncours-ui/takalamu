import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { KhatamOrnament } from "@/components/khatam-ornament";

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
    <div className="-mx-4 -mt-5">
      {/* Héros encre */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-14 pt-7"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <KhatamOrnament
          size={200}
          strokeWidth={0.4}
          className="pointer-events-none absolute -right-10 -top-8"
          style={{ opacity: 0.5 }}
        />
        <p className="relative" style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 19, color: "var(--tk-sage)" }}>
          Salâm &apos;alaykoum,
        </p>
        <h1
          className="relative leading-none"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 44, color: "var(--tk-cream-text)", marginTop: 1 }}
        >
          {firstName}
        </h1>
        {startDate && (
          <p className="relative mt-1" style={{ color: "var(--tk-gold)", fontSize: 12, letterSpacing: ".03em" }}>
            En évolution depuis le {startDate}
          </p>
        )}
      </div>

      {/* Ruban de stats, superposé entre héros et corps */}
      <div className="relative px-[22px]" style={{ marginTop: -40 }}>
        <div
          className="flex overflow-hidden rounded-[18px]"
          style={{ background: "#F7F0DF", border: "1px solid var(--tk-parchment-border-alt)", boxShadow: "0 22px 40px -18px rgba(10,20,15,.55)" }}
        >
          <StatCell value={String(vocabCount ?? 0)} label="Mots" href="/dashboard/vocabulary" borderRight />
          <StatCell value={String(formCount ?? 0)} label="Expressions" href="/dashboard/formulations" borderRight />
          <StatCell value={lastGrade ?? "—"} label="Note" accent />
        </div>
      </div>

      {/* Reprendre mes cours */}
      <div className="px-[22px] pt-7 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <h3 style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 23, color: "var(--tk-ink-text)" }}>
            Reprendre mes cours
          </h3>
          <span className="flex-1" style={{ height: 1, background: "linear-gradient(90deg,#D8C79E,transparent)" }} />
          <KhatamOrnament size={15} strokeWidth={1.6} />
        </div>

        {visibleBooks.length === 0 ? (
          <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun cours enregistré pour le moment.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleBooks.map((b) => {
              const n = bookCount(b);
              return (
                <Link
                  key={b.id}
                  href={`/dashboard/livres/${b.id}`}
                  className="flex items-stretch gap-0 overflow-hidden rounded-[16px] transition-opacity hover:opacity-90"
                  style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 12px 26px -18px rgba(10,20,15,.4)" }}
                >
                  {/* Couverture */}
                  {b.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.cover_url}
                      alt=""
                      className="shrink-0 object-cover"
                      style={{ width: 60 }}
                    />
                  ) : (
                    <div className="shrink-0" style={{ width: 60, background: "var(--tk-parchment-border)" }} />
                  )}
                  <div className="flex-1 min-w-0 px-3.5 py-3">
                    <div
                      className="font-bold leading-snug"
                      dir="rtl"
                      lang="ar"
                      style={{ color: "var(--tk-ink-text)", fontSize: 22, fontFamily: "var(--font-amiri)" }}
                    >
                      {b.title}
                    </div>
                    {b.subtitle && (
                      <div className="mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12 }}>
                        {b.subtitle}
                      </div>
                    )}
                    <div
                      className="mt-2 inline-block font-bold uppercase"
                      style={{
                        fontSize: 10.5,
                        letterSpacing: ".05em",
                        color: "var(--tk-ink-hero-to)",
                        border: "1px solid #CFB98A",
                        borderRadius: 20,
                        padding: "3px 10px",
                      }}
                    >
                      {n} {bookUnit(b, n)}
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCell({
  value,
  label,
  href,
  accent,
  borderRight,
}: {
  value: string;
  label: string;
  href?: string;
  accent?: boolean;
  borderRight?: boolean;
}) {
  const className = "flex-1 text-center py-4 px-1.5";
  const style = borderRight ? { borderRight: "1px solid #EADFC0" } : undefined;
  const inner = (
    <>
      <div
        className="leading-none"
        style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 30, color: accent ? "var(--tk-gold-dark)" : "var(--tk-ink-hero-to)" }}
      >
        {value}
      </div>
      <div className="mt-1.5" style={{ color: "var(--tk-muted-olive)", fontSize: 10.5, letterSpacing: ".04em" }}>
        {label}
      </div>
    </>
  );

  // Cellule "Note" : simple encart d'information, non cliquable.
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
