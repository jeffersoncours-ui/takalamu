import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, attendanceBadge } from "@/components/status-badge";
import { AccordionGroup } from "@/components/accordion-group";
import { groupByLesson } from "@/lib/group-by-lesson";
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
    .select("id, status, unjustified_absences_count, profiles(full_name, email)")
    .eq("id", id)
    .maybeSingle();

  if (!student) notFound();

  const [recordsRes, noteRes, hwRes, vocabRes, grammarRes, formRes] =
    await Promise.all([
      supabase
        .from("lesson_records")
        .select("id, session_date, attendance, public_recap, custom_title", { count: "exact" })
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
    ]);

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
    <div className="space-y-5">
      {/* Retour */}
      <Link
        href="/teacher/students"
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "#8B857A", fontSize: 13 }}
      >
        ← Mes élèves
      </Link>

      {/* En-tête */}
      <div className="flex items-center gap-[14px]">
        <span
          className="flex shrink-0 items-center justify-center rounded-[17px] text-white font-bold"
          style={{ width: 58, height: 58, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 23 }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="flex-1 min-w-0">
          <h1
            className="leading-tight"
            style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "#1C1A17" }}
          >
            {name}
          </h1>
          {profile?.email && (
            <p className="truncate" style={{ color: "#8B857A", fontSize: 13 }}>{profile.email}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href={`/teacher/messages/${id}`}
          className="flex-1 text-center font-semibold rounded-[12px] py-2.5"
          style={{ color: "#1C1A17", fontSize: 13, border: "1.5px solid #E9E3D8", background: "#fff" }}
        >
          Chat
        </Link>
        <StatusForm studentId={id} currentStatus={student.status} />
      </div>

      {/* Stats — cliquables, ancrent vers la section correspondante */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "séances", value: totalRecords, anchor: "#historique" },
          { label: "abs. injust.", value: student.unjustified_absences_count, anchor: null },
          { label: "mots", value: vocabCount, anchor: "#vocabulaire" },
          { label: "règles", value: grammarCount, anchor: "#grammaire" },
        ].map(({ label, value, anchor }) => {
          const content = (
            <>
              <p style={{ fontWeight: 800, fontSize: 22, color: "#1C1A17", lineHeight: 1 }}>{value}</p>
              <p className="mt-1 font-semibold" style={{ color: "#8B857A", fontSize: 11 }}>{label}</p>
            </>
          );
          const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #EFEAE0" };
          return anchor ? (
            <Link key={label} href={anchor} className="block rounded-[16px] p-3 text-center" style={cardStyle}>
              {content}
            </Link>
          ) : (
            <div key={label} className="rounded-[16px] p-3 text-center" style={cardStyle}>
              {content}
            </div>
          );
        })}
      </div>

      {/* Note privée épinglée */}
      <ProfileNoteForm studentId={id} initialContent={noteContent} />

      {/* CTA nouvelle fiche */}
      <Link
        href={`/teacher/session/new?student_id=${id}`}
        className="flex items-center gap-3 rounded-[16px] p-[15px]"
        style={{ background: "#0F9D6E", boxShadow: "0 8px 18px rgba(15,157,110,.26)" }}
      >
        <span
          className="flex shrink-0 items-center justify-center rounded-[12px]"
          style={{ width: 40, height: 40, background: "rgba(255,255,255,.20)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <span className="flex-1 font-bold text-white" style={{ fontSize: 15 }}>
          Nouvelle fiche de fin de cours
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </Link>

      {/* Devoirs en attente */}
      {pendingHw.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-900">
              Devoirs à corriger ({pendingHw.length})
            </p>
            <Link
              href="/teacher/homework"
              className="text-xs text-amber-700 hover:underline"
            >
              Corriger →
            </Link>
          </div>
          {pendingHw.map((hw) => (
            <div key={hw.id} className="text-sm text-amber-800">
              • {hw.instructions ?? "Devoir sans instructions"}{" "}
              <span className="text-xs text-amber-600">
                ({format(new Date(hw.assigned_at), "d MMM", { locale: fr })})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Historique des séances */}
      <div id="historique" className="space-y-2 scroll-mt-20">
        <div className="flex items-center justify-between px-0.5">
          <p className="font-bold uppercase" style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}>
            Cours ({totalRecords})
          </p>
          {showAllRecords ? (
            <Link href={`/teacher/students/${id}`} className="font-semibold" style={{ color: "#0F9D6E", fontSize: 12 }}>
              Voir moins
            </Link>
          ) : totalRecords > 8 ? (
            <Link href={`/teacher/students/${id}?all=true`} className="font-semibold" style={{ color: "#0F9D6E", fontSize: 12 }}>
              Voir tout ({totalRecords})
            </Link>
          ) : null}
        </div>
        {records.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune séance enregistrée.</p>
        )}
        {records.map((r) => {
          const badge = attendanceBadge(r.attendance);
          return (
            <Link
              key={r.id}
              href={`/teacher/students/${id}/sessions/${r.id}`}
              className="block rounded-[14px] p-[13px] space-y-1 transition-opacity hover:opacity-80"
              style={{ background: "#fff", border: "1px solid #EFEAE0" }}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold" style={{ color: "#1C1A17", fontSize: 14 }}>
                  {r.custom_title || `Cours ${courseNumber.get(r.id)}`}
                </p>
                <StatusBadge hue={badge.hue} label={badge.label} />
              </div>
              <p style={{ color: "#A8A29E", fontSize: 11 }}>
                {format(new Date(r.session_date), "d MMMM yyyy", { locale: fr })}
              </p>
              {r.public_recap && (
                <p className="leading-relaxed" style={{ color: "#4A463F", fontSize: 13 }}>
                  {r.public_recap}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      {/* Vocabulaire par cours */}
      <div id="vocabulaire" className="space-y-2 scroll-mt-20">
        <p className="font-bold uppercase px-0.5" style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}>
          Vocabulaire ({vocabCount})
        </p>
        {vocabGroups.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucun mot enregistré.</p>
        )}
        {vocabGroups.map((group) => (
          <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={false}>
            {group.key !== "none" && (
              <Link
                href={`/teacher/students/${id}/sessions/${group.key}`}
                className="inline-flex items-center gap-1 font-semibold"
                style={{ color: "#0F9D6E", fontSize: 12 }}
              >
                Voir le cours →
              </Link>
            )}
            {group.items.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between gap-3 rounded-[12px] px-3 py-2.5"
                style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
              >
                <span className="text-sm" style={{ color: "#4A463F" }}>{v.french_definition}</span>
                <span dir="rtl" lang="ar" className="font-arabic shrink-0" style={{ fontSize: 18, fontWeight: 700, color: "#0A553F" }}>
                  {v.arabic_word}
                </span>
              </div>
            ))}
          </AccordionGroup>
        ))}
      </div>

      {/* Grammaire — chaque règle porte son propre nom, indépendant du cours */}
      <div id="grammaire" className="space-y-2 scroll-mt-20">
        <p className="font-bold uppercase px-0.5" style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}>
          Règles de grammaire ({grammarCount})
        </p>
        {grammarGroups.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune règle enregistrée.</p>
        )}
        {grammarGroups.flatMap((group) =>
          group.items.map((g) => (
            <div
              key={g.id}
              className="rounded-[14px] px-3.5 py-3 space-y-1"
              style={{ background: "#fff", border: "1px solid #EFEAE0" }}
            >
              <p className="font-semibold" style={{ color: "#1C1A17", fontSize: 14 }}>{g.title}</p>
              <p className="text-xs line-clamp-2" style={{ color: "#8B857A" }}>{g.content}</p>
              {group.key !== "none" && (
                <Link
                  href={`/teacher/students/${id}/sessions/${group.key}`}
                  className="inline-flex items-center gap-1 font-semibold"
                  style={{ color: "#0F9D6E", fontSize: 12 }}
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
        <p className="font-bold uppercase px-0.5" style={{ color: "#8B857A", fontSize: 12, letterSpacing: ".06em" }}>
          Formulations ({formCount})
        </p>
        {formGroups.length === 0 && (
          <p style={{ color: "#8B857A", fontSize: 14 }}>Aucune formulation enregistrée.</p>
        )}
        {formGroups.map((group) => (
          <AccordionGroup key={group.key} label={group.label} count={group.items.length} forceOpen={false}>
            {group.key !== "none" && (
              <Link
                href={`/teacher/students/${id}/sessions/${group.key}`}
                className="inline-flex items-center gap-1 font-semibold"
                style={{ color: "#0F9D6E", fontSize: 12 }}
              >
                Voir le cours →
              </Link>
            )}
            {group.items.map((f) => (
              <div
                key={f.id}
                className="rounded-[12px] px-3 py-2.5 space-y-1"
                style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
              >
                <p dir="rtl" lang="ar" className="font-arabic" style={{ fontSize: 16, fontWeight: 700, color: "#0A553F" }}>
                  {f.arabic_text}
                </p>
                <p className="text-sm" style={{ color: "#4A463F" }}>{f.french_text}</p>
              </div>
            ))}
          </AccordionGroup>
        ))}
      </div>

    </div>
  );
}
