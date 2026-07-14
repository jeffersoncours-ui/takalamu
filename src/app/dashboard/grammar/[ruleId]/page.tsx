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
    <div className="space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Mes cours
      </Link>

      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "#1C1A17" }}
        >
          {rule.title}
        </h1>
        <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 13 }}>
          {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="rounded-[16px] p-4" style={{ background: "#fff", border: "1px solid #EFEAE0" }}>
        <p className="leading-relaxed whitespace-pre-wrap" style={{ color: "#1C1A17", fontSize: 14 }}>
          {rule.content}
        </p>
      </div>

      {photoUrls.length > 0 && (
        <div className="space-y-2.5">
          <p className="font-bold uppercase px-0.5" style={{ color: "#8B857A", fontSize: 11, letterSpacing: ".05em" }}>
            Photos
          </p>
          {photoUrls.map((p) => (
            <a
              key={p.url}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-[16px]"
              style={{ border: "1px solid #EFEAE0" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="w-full" style={{ display: "block" }} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
