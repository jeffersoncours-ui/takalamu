import Link from "next/link";
import { notFound } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EditSessionForm } from "./edit-session-form";

type SupportFile = { path: string; name: string };

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = await params;
  await requireTeacher();
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("lesson_records")
    .select("id, session_date, public_recap, support_files, custom_title, book_id, students(profiles(full_name))")
    .eq("id", recordId)
    .eq("student_id", id)
    .maybeSingle();

  if (!record) notFound();

  const { data: bookRows } = await supabase
    .from("course_books")
    .select("id, title, subtitle, order_index")
    .eq("kind", "courses")
    .order("order_index");
  const books = (bookRows ?? []).map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle }));

  const [noteRes, vocabRes, grammarRes, formRes, hwRes] = await Promise.all([
    supabase
      .from("session_private_notes")
      .select("content")
      .eq("lesson_record_id", recordId)
      .maybeSingle(),
    supabase
      .from("vocabulary")
      .select("id, arabic_word, french_definition")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("grammar_rules")
      .select("id, title, content, photos, rule_group_id")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("formulations")
      .select("id, arabic_text, french_text, audio_path")
      .eq("lesson_record_id", recordId)
      .order("created_at", { ascending: true }),
    supabase
      .from("homework")
      .select("instructions, status")
      .eq("lesson_record_id", recordId)
      .maybeSingle(),
  ]);

  const student = Array.isArray(record.students) ? record.students[0] : record.students;
  const profile = student
    ? (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles)
    : null;
  const studentName = profile?.full_name ?? "—";

  return (
    <div className="space-y-5">
      <Link
        href={`/teacher/students/${id}/sessions/${recordId}`}
        className="inline-flex items-center gap-1 font-semibold"
        style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}
      >
        ← Annuler
      </Link>

      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 22, color: "var(--tk-ink-text)" }}
        >
          Modifier le cours
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 13 }}>
          {studentName}
        </p>
      </div>

      <EditSessionForm
        studentId={id}
        recordId={recordId}
        studentName={studentName}
        sessionDateIso={record.session_date}
        customTitle={record.custom_title ?? ""}
        books={books}
        currentBookId={record.book_id ?? ""}
        publicRecap={record.public_recap ?? ""}
        privateNote={noteRes.data?.content ?? ""}
        homeworkInstructions={hwRes.data?.instructions ?? ""}
        homeworkTouched={!!hwRes.data && hwRes.data.status !== "a_rendre"}
        vocab={vocabRes.data ?? []}
        grammar={(grammarRes.data ?? []).map((g) => ({
          id: g.id,
          title: g.title,
          content: g.content,
          photos: (g.photos as SupportFile[] | null) ?? [],
          ruleGroupId: g.rule_group_id,
        }))}
        formulations={formRes.data ?? []}
        supportFiles={(record.support_files as SupportFile[] | null) ?? []}
      />
    </div>
  );
}
