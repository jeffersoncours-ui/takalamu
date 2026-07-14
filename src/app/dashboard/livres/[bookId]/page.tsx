import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
    <div className="space-y-5">
      {/* Retour */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 font-semibold" style={{ color: "#8B857A", fontSize: 13 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B857A" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Mes cours
      </Link>

      {/* En-tête du livre */}
      <div className="flex items-center gap-3.5">
        {book.cover_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.cover_url}
            alt=""
            className="shrink-0 rounded-[10px] object-cover"
            style={{ width: 70, height: 94, boxShadow: "0 3px 10px rgba(28,26,23,.18)" }}
          />
        )}
        <div className="min-w-0">
          <h1 dir="rtl" lang="ar" className="leading-snug" style={{ fontFamily: "var(--font-amiri)", fontWeight: 700, fontSize: 24, color: "#1C1A17" }}>
            {book.title}
          </h1>
          {book.subtitle && (
            <p className="mt-0.5 font-medium" style={{ color: "#8B857A", fontSize: 14 }}>
              {book.subtitle}
            </p>
          )}
        </div>
      </div>

      {book.kind === "grammar" ? <GrammarBookContent /> : <CoursesBookContent bookId={book.id} />}
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
    return <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun cours dans ce livre pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-[10px]">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/dashboard/cours/${r.id}`}
          className="block rounded-[16px] p-[15px] transition-opacity hover:opacity-80"
          style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 5px 14px rgba(28,26,23,.03)" }}
        >
          <div className="flex items-center gap-1.5 mb-1.5 font-bold" style={{ color: "#1C1A17", fontSize: 15 }}>
            {r.custom_title || `Cours ${number.get(r.id)}`}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>
          <div className="font-medium" style={{ color: "#8B857A", fontSize: 12 }}>
            {format(new Date(r.session_date), "EEE d MMM", { locale: fr })}
            {r.public_recap ? ` · ${r.public_recap}` : ""}
          </div>
        </Link>
      ))}
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
    return <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune règle de grammaire pour le moment.</p>;
  }

  return <GrammarSearch items={items} />;
}
