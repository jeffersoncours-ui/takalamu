import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";
import GrammarSearch from "../../grammar/grammar-search";

export default async function LivrePage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = await params;
  await requireStudent();
  const supabase = await createClient();

  const { data: book, error: bookError } = await supabase
    .from("course_books")
    .select("id, title, subtitle, cover_url, kind")
    .eq("id", bookId)
    .maybeSingle();

  if (bookError) console.error("livre query failed:", bookError.message);
  if (!book) notFound();

  return (
    <div className="-mx-4 -mt-5">
      {/* Héros encre */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-7 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <Link href="/dashboard" className="relative inline-flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 19, color: "var(--tk-sage)" }}>
            Mes cours
          </span>
        </Link>

        <div className="relative mt-6 flex items-end gap-4">
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={book.cover_url}
              alt=""
              className="shrink-0 object-cover"
              style={{ width: 92, height: 120, borderRadius: 10, boxShadow: "0 18px 30px -14px rgba(0,0,0,.6)", border: "2px solid rgba(199,154,62,.5)" }}
            />
          ) : (
            <div className="shrink-0" style={{ width: 92, height: 120, borderRadius: 10, background: "rgba(255,255,255,.08)", border: "2px solid rgba(199,154,62,.5)" }} />
          )}
          <div className="min-w-0 pb-1.5">
            <h1 dir="rtl" lang="ar" className="leading-tight" style={{ fontFamily: "var(--font-amiri)", fontWeight: 700, fontSize: 26, color: "var(--tk-cream-text)" }}>
              {book.title}
            </h1>
            {book.subtitle && (
              <p className="mt-1" style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 16, color: "var(--tk-sage)" }}>
                {book.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-[22px] pt-6 pb-2">
        {book.kind === "grammar" ? <GrammarBookContent /> : <CoursesBookContent bookId={book.id} />}
      </div>
    </div>
  );
}

async function CoursesBookContent({ bookId }: { bookId: string }) {
  const supabase = await createClient();
  const { data: records, error } = await supabase
    .from("lesson_records")
    .select("id, session_date, public_recap, custom_title")
    .eq("book_id", bookId)
    .order("session_date", { ascending: false });

  if (error) console.error("livre cours query failed:", error.message);
  const rows = records ?? [];
  const total = rows.length;
  // Numérotation « Cours N » : le plus ancien = Cours 1 (rows triés desc).
  const number = new Map<string, number>();
  rows.forEach((r, i) => number.set(r.id, total - i));

  if (rows.length === 0) {
    return <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun cours dans ce livre pour le moment.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-[18px]">
        <h3 style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink-text)" }}>Leçons</h3>
        <span className="flex-1" style={{ height: 1, background: "linear-gradient(90deg,#D8C79E,transparent)" }} />
        <svg width="15" height="15" viewBox="0 0 40 40" fill="none" stroke="var(--tk-gold)" strokeWidth={1.6}>
          <rect x="9" y="9" width="22" height="22" />
          <rect x="9" y="9" width="22" height="22" transform="rotate(45 20 20)" />
        </svg>
      </div>
      <div className="flex flex-col gap-3.5">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/cours/${r.id}`}
            className="flex items-start gap-3.5 rounded-[16px] p-4 transition-opacity hover:opacity-90"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 12px 26px -18px rgba(10,20,15,.4)" }}
          >
            <span
              className="shrink-0 text-center leading-none"
              style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 30, color: "var(--tk-gold)", width: 34 }}
            >
              {toArabicIndicDigits(number.get(r.id) ?? 0)}
            </span>
            <div className="flex-1 min-w-0">
              <div
                dir="rtl"
                lang="ar"
                className="font-bold"
                style={{ color: "var(--tk-ink-hero-to)", fontSize: 23, fontFamily: "var(--font-amiri)" }}
              >
                {r.custom_title || `Cours ${number.get(r.id)}`}
              </div>
              <div className="mt-1.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12.5 }}>
                {format(new Date(r.session_date), "EEE d MMM", { locale: fr })}
                {r.public_recap ? ` · ${r.public_recap}` : ""}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

async function GrammarBookContent() {
  const supabase = await createClient();
  const { data: rules, error } = await supabase
    .from("grammar_rules")
    .select("id, title, created_at, lesson_records(session_date)")
    .order("created_at", { ascending: false });

  if (error) console.error("livre grammaire query failed:", error.message);

  const items = (rules ?? []).map((r) => {
    const record = Array.isArray(r.lesson_records) ? r.lesson_records[0] : r.lesson_records;
    return {
      id: r.id,
      title: r.title,
      date: record?.session_date ?? r.created_at,
    };
  });

  if (items.length === 0) {
    return <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune règle de grammaire pour le moment.</p>;
  }

  return <GrammarSearch items={items} />;
}
