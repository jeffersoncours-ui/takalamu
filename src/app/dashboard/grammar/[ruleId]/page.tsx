import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Photo = { path: string; name: string };

export default async function GrammarRuleDetailPage({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const { ruleId } = await params;
  const { studentId } = await requireStudent();
  const supabase = await createClient();

  const { data: rule } = await supabase
    .from("grammar_rules")
    .select("id, title, content, photos, created_at, lesson_records(session_date)")
    .eq("id", ruleId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!rule) notFound();

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

  return (
    <div className="-mx-4 -mt-5">
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

        <div className="relative mt-6">
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-cream-text)" }}
          >
            {rule.title}
          </h1>
          <p className="mt-1" style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 15, color: "var(--tk-sage)" }}>
            {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      <div className="px-[22px] pt-6 pb-2 space-y-5">
        <div
          className="rounded-[16px] p-4"
          style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "var(--tk-shadow-card)" }}
        >
          <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>
            {rule.content}
          </p>
        </div>

        {photoUrls.length > 0 && (
          <div className="space-y-2.5">
            <p className="font-bold uppercase" style={{ color: "var(--tk-muted-olive)", fontSize: 11, letterSpacing: ".05em" }}>
              Photos
            </p>
            {photoUrls.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block overflow-hidden rounded-[16px]"
                style={{ border: "1px solid var(--tk-parchment-border)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="w-full" style={{ display: "block" }} />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
