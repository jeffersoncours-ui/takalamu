import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AccordionGroup } from "@/components/accordion-group";
import { groupByLesson } from "@/lib/group-by-lesson";
import { toArabicIndicDigits } from "@/lib/arabic-numerals";
import { ProfileNoteForm } from "./profile-note-form";
import { StatusForm } from "./status-form";

export default async function StudentCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ all?: string }>;
}) {
  const { id } = await params;
  const { all } = await searchParams;
  const showAllRecords = all === "true";
  await requireTeacher();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, status, profiles(full_name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [recordsRes, noteRes, hwRes, vocabRes, grammarRes, formRes, conjRes] =
    await Promise.all([
      supabase
        .from("lesson_records")
        .select("id, session_date, public_recap, custom_title", { count: "exact" })
        .eq("student_id", id)
        .order("session_date", { ascending: false })
        .limit(showAllRecords ? 200 : 8),
      supabase
        .from("student_profile_notes")
        .select("content")
        .eq("student_id", id)
        .maybeSingle(),
      supabase
        .from("homework")
        .select("id, instructions, status, assigned_at")
        .eq("student_id", id)
        .eq("status", "rendu")
        .order("assigned_at", { ascending: true }),
      supabase
        .from("vocabulary")
        .select("id, arabic_word, french_definition, lesson_record_id, lesson_records(session_date, custom_title)", { count: "exact" })
        .eq("student_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("grammar_rules")
        .select("id, title, content, lesson_record_id, lesson_records(session_date, custom_title)", { count: "exact" })
        .eq("student_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("formulations")
        .select("id, arabic_text, french_text, lesson_record_id, lesson_records(session_date, custom_title)", { count: "exact" })
        .eq("student_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("verb_conjugations")
        .select("vocab_id, tense")
        .eq("student_id", id),
    ]);

  // Mots qui ont déjà au moins un temps de conjugaison saisi.
  const conjVocabIds = new Set((conjRes.data ?? []).map((c) => c.vocab_id));

  const profile = Array.isArray(student.profiles)
    ? student.profiles[0]
    : student.profiles;
  const records = recordsRes.data ?? [];
  const totalRecords = recordsRes.count ?? records.length;
  const noteContent = noteRes.data?.content ?? "";
  const pendingHw = hwRes.data ?? [];
  const vocabCount = vocabRes.count ?? (vocabRes.data?.length ?? 0);
  const grammarCount = grammarRes.count ?? (grammarRes.data?.length ?? 0);
  const formCount = formRes.count ?? (formRes.data?.length ?? 0);

  // Numérotation « Cours N » : le plus ancien = Cours 1 (records triés desc).
  const courseNumber = new Map<string, number>();
  records.forEach((r, i) => courseNumber.set(r.id, totalRecords - i));

  // Vocabulaire & grammaire regroupés par cours (accordéons)
  const vocabGroups = groupByLesson(
    (vocabRes.data ?? []).map((v) => {
      const rec = Array.isArray(v.lesson_records) ? v.lesson_records[0] : v.lesson_records;
      return { id: v.id, arabic_word: v.arabic_word, french_definition: v.french_definition, lessonRecordId: v.lesson_record_id, sessionDate: rec?.session_date ?? null, customTitle: rec?.custom_title ?? null };
    }),
  );
  const grammarGroups = groupByLesson(
    (grammarRes.data ?? []).map((g) => {
      const rec = Array.isArray(g.lesson_records) ? g.lesson_records[0] : g.lesson_records;
      return { id: g.id, title: g.title, content: g.content, lessonRecordId: g.lesson_record_id, sessionDate: rec?.session_date ?? null, customTitle: rec?.custom_title ?? null };
    }),
  );
  const formGroups = groupByLesson(
    (formRes.data ?? []).map((f) => {
      const rec = Array.isArray(f.lesson_records) ? f.lesson_records[0] : f.lesson_records;
      return { id: f.id, arabic_text: f.arabic_text, french_text: f.french_text, lessonRecordId: f.lesson_record_id, sessionDate: rec?.session_date ?? null, customTitle: rec?.custom_title ?? null };
    }),
  );

  const name = profile?.full_name ?? "—";

  return (
    <div className="-mx-4 -mt-5">
      {/* Héros encre */}
      <div
        className="hachure-ink relative overflow-hidden px-[22px] pb-9 pt-6"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <Link href="/teacher/students" className="relative inline-flex items-center gap-2.5">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontFamily: "var(--font-spectral)", fontStyle: "italic", fontSize: 16, color: "var(--tk-sage)" }}>
            Mes élèves
          </span>
        </Link>

        <div className="relative mt-6 flex items-center gap-3.5">
          <span
            className="flex shrink-0 items-center justify-center rounded-[16px] font-bold"
            style={{
              width: 56,
              height: 56,
              background: "rgba(255,255,255,.08)",
              border: "1px solid rgba(199,154,62,.4)",
              color: "var(--tk-gold-light)",
              fontFamily: "var(--font-spectral)",
              fontSize: 28,
            }}
          >
            {name[0]?.toUpperCase() ?? "?"}
          </span>
          <div className="flex-1 min-w-0">
            <h1
              className="leading-tight"
              style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "var(--tk-cream-text)" }}
            >
              {name}
            </h1>
            {profile?.email && (
              <p className="truncate mt-0.5" style={{ color: "var(--tk-sage)", fontSize: 12 }}>{profile.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats — cliquables, superposées entre héros et corps */}
      <div className="relative px-[22px]" style={{ marginTop: -32 }}>
        <div className="flex gap-2.5">
          {[
            { label: "Séances", value: totalRecords, anchor: "#historique" },
            { label: "Mots", value: vocabCount, anchor: "#vocabulaire" },
            { label: "Règles", value: grammarCount, anchor: "#grammaire" },
          ].map(({ label, value, anchor }) => (
            <Link
              key={label}
              href={anchor}
              className="flex-1 rounded-[14px] text-center"
              style={{
                background: "#F7F0DF",
                border: "1px solid var(--tk-parchment-border-alt)",
                boxShadow: "0 16px 28px -18px rgba(10,20,15,.5)",
                padding: "12px 6px",
              }}
            >
              <p style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 24, color: "var(--tk-ink-hero-to)", lineHeight: 1 }}>
                {value}
              </p>
              <p className="mt-1.5" style={{ color: "var(--tk-muted-olive)", fontSize: 10 }}>{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="px-[22px] pt-5 pb-2 space-y-3.5">
        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <Link
            href={`/teacher/messages/${id}`}
            className="flex-1 flex items-center justify-center gap-1.5 text-center font-semibold rounded-[12px] py-2.5"
            style={{ color: "var(--tk-ink-hero-to)", fontSize: 13, border: "1px solid rgba(14,74,56,.3)", background: "rgba(14,74,56,.1)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-hero-to)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
            </svg>
            Chat
          </Link>
          <StatusForm studentId={id} currentStatus={student.status} />
        </div>

        {/* Note privée épinglée */}
        <ProfileNoteForm studentId={id} initialContent={noteContent} />

        {/* CTA nouvelle fiche */}
        <Link
          href={`/teacher/session/new?student_id=${id}`}
          className="flex items-center justify-center gap-2.5 rounded-[14px] p-[14px] font-bold"
          style={{
            background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
            border: "1px solid rgba(199,154,62,.3)",
            color: "var(--tk-cream-text)",
            fontSize: 14,
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold-light)" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
          Nouvelle fiche de fin de cours
        </Link>

        {/* Devoirs en attente */}
        {pendingHw.length > 0 && (
          <div
            className="rounded-[14px] p-4 space-y-2"
            style={{ background: "rgba(184,120,42,.09)", border: "1px solid rgba(184,120,42,.32)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: "var(--tk-gold-darker)" }}>
                Devoirs à corriger ({pendingHw.length})
              </p>
              <Link href="/teacher/homework" className="text-xs" style={{ color: "var(--tk-warning)" }}>
                Corriger →
              </Link>
            </div>
            {pendingHw.map((hw) => (
              <div key={hw.id} className="text-sm" style={{ color: "#7A5714" }}>
                • {hw.instructions ?? "Devoir sans instructions"}{" "}
                <span className="text-xs" style={{ color: "var(--tk-warning)" }}>
                  ({format(new Date(hw.assigned_at), "d MMM", { locale: fr })})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Historique des séances */}
        <div id="historique" className="space-y-2.5 scroll-mt-20">
          <div className="flex items-center gap-2.5">
            <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 11, letterSpacing: ".16em", color: "var(--tk-gold)", textTransform: "uppercase" }}>
              Historique ({totalRecords})
            </span>
            <span className="flex-1" style={{ height: 1, background: "linear-gradient(90deg,#D8C79E,transparent)" }} />
            {showAllRecords ? (
              <Link href={`/teacher/students/${id}`} className="font-semibold shrink-0" style={{ color: "var(--tk-ink-hero-to)", fontSize: 12 }}>
                Voir moins
              </Link>
            ) : totalRecords > 8 ? (
              <Link href={`/teacher/students/${id}?all=true`} className="font-semibold shrink-0" style={{ color: "var(--tk-ink-hero-to)", fontSize: 12 }}>
                Voir tout
              </Link>
            ) : null}
          </div>
          {records.length === 0 && (
            <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune séance enregistrée.</p>
          )}
          {records.map((r) => (
            <Link
              key={r.id}
              href={`/teacher/students/${id}/sessions/${r.id}`}
              className="flex items-center gap-3 rounded-[14px] p-[13px_15px] transition-opacity hover:opacity-80"
              style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
            >
              <span style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "var(--tk-gold)" }}>
                {toArabicIndicDigits(courseNumber.get(r.id) ?? 0)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-bold" style={{ color: "var(--tk-ink-hero-to)", fontSize: 15 }}>
                  {r.custom_title || `Cours ${courseNumber.get(r.id)}`}
                </p>
                <p className="mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 11 }}>
                  {format(new Date(r.session_date), "d MMMM yyyy", { locale: fr })}
                  {r.public_recap ? ` · ${r.public_recap}` : ""}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-gold)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Vocabulaire par cours */}
        <div id="vocabulaire" className="space-y-2 scroll-mt-20">
          <p className="font-bold uppercase px-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12, letterSpacing: ".06em" }}>
            Vocabulaire ({vocabCount})
          </p>
          {vocabGroups.length === 0 && (
            <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucun mot enregistré.</p>
          )}
          {vocabGroups.map((group) => (
            <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={false}>
              {group.key !== "none" && (
                <Link
                  href={`/teacher/students/${id}/sessions/${group.key}`}
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: "var(--tk-ink-hero-to)", fontSize: 12 }}
                >
                  Voir le cours →
                </Link>
              )}
              {group.items.map((v) => (
                <div
                  key={v.id}
                  className="rounded-[12px] px-3 py-2.5 space-y-1.5"
                  style={{ background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)" }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm" style={{ color: "var(--tk-ink-text-soft)" }}>{v.french_definition}</span>
                    <span dir="rtl" lang="ar" className="font-arabic shrink-0" style={{ fontSize: 18, fontWeight: 700, color: "var(--tk-ink-hero-to)" }}>
                      {v.arabic_word}
                    </span>
                  </div>
                  <Link
                    href={`/teacher/students/${id}/vocabulary/${v.id}`}
                    className="inline-flex items-center gap-1 font-semibold"
                    style={{ color: conjVocabIds.has(v.id) ? "var(--tk-green-active)" : "var(--tk-muted-olive)", fontSize: 11.5 }}
                  >
                    {conjVocabIds.has(v.id) ? "Conjugaison ✓ — modifier" : "Conjuguer ce verbe →"}
                  </Link>
                </div>
              ))}
            </AccordionGroup>
          ))}
        </div>

        {/* Grammaire — chaque règle porte son propre nom, indépendant du cours */}
        <div id="grammaire" className="space-y-2 scroll-mt-20">
          <p className="font-bold uppercase px-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12, letterSpacing: ".06em" }}>
            Règles de grammaire ({grammarCount})
          </p>
          {grammarGroups.length === 0 && (
            <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune règle enregistrée.</p>
          )}
          {grammarGroups.flatMap((group) =>
            group.items.map((g) => (
              <div
                key={g.id}
                className="rounded-[14px] px-3.5 py-3 space-y-1"
                style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)" }}
              >
                <p className="font-semibold" style={{ color: "var(--tk-ink-text)", fontSize: 14 }}>{g.title}</p>
                <p className="text-xs line-clamp-2" style={{ color: "var(--tk-muted-olive)" }}>{g.content}</p>
                {group.key !== "none" && (
                  <Link
                    href={`/teacher/students/${id}/sessions/${group.key}`}
                    className="inline-flex items-center gap-1 font-semibold"
                    style={{ color: "var(--tk-ink-hero-to)", fontSize: 12 }}
                  >
                    {group.label} →
                  </Link>
                )}
              </div>
            )),
          )}
        </div>

        {/* Formulations par cours */}
        <div id="formulations" className="space-y-2 scroll-mt-20">
          <p className="font-bold uppercase px-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 12, letterSpacing: ".06em" }}>
            Formulations ({formCount})
          </p>
          {formGroups.length === 0 && (
            <p style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>Aucune formulation enregistrée.</p>
          )}
          {formGroups.map((group) => (
            <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={false}>
              {group.key !== "none" && (
                <Link
                  href={`/teacher/students/${id}/sessions/${group.key}`}
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: "var(--tk-ink-hero-to)", fontSize: 12 }}
                >
                  Voir le cours →
                </Link>
              )}
              {group.items.map((f) => (
                <div
                  key={f.id}
                  className="rounded-[12px] px-3 py-2.5 space-y-1"
                  style={{ background: "var(--tk-parchment-field)", border: "1px solid var(--tk-parchment-border)" }}
                >
                  <p dir="rtl" lang="ar" className="font-arabic" style={{ fontSize: 16, fontWeight: 700, color: "var(--tk-ink-hero-to)" }}>
                    {f.arabic_text}
                  </p>
                  <p className="text-sm" style={{ color: "var(--tk-ink-text-soft)" }}>{f.french_text}</p>
                </div>
              ))}
            </AccordionGroup>
          ))}
        </div>
      </div>
    </div>
  );
}
