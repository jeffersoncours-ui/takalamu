import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SupportFile = { path: string; name: string };

/** Bibliothèque : tous les cours donnés par l'enseignant, réutilisables comme
 *  modèle à dupliquer vers d'autres élèves. */
export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ dup?: string }>;
}) {
  const { dup } = await searchParams;
  const dupCount = dup ? parseInt(dup, 10) : 0;
  await requireTeacher();
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("lesson_records")
    .select(
      "id, custom_title, session_date, updated_at, support_files, course_group_id, student_id, students(profiles(full_name)), vocabulary(count), grammar_rules(count), formulations(audio_path)"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("library lesson_records", error.message);
  }

  // Regroupe les fiches par cours (course_group_id) : un même cours donné à
  // plusieurs élèves = une seule carte. Le représentant du groupe est la fiche
  // la plus récemment modifiée (rows déjà triées par updated_at décroissant).
  const byGroup = new Map<
    string,
    {
      id: string;
      title: string;
      date: string;
      students: string[];
      vocabCount: number;
      grammarCount: number;
      formCount: number;
      audioCount: number;
      supportCount: number;
    }
  >();

  for (const r of rows ?? []) {
    const student = Array.isArray(r.students) ? r.students[0] : r.students;
    const profile = student
      ? Array.isArray(student.profiles)
        ? student.profiles[0]
        : student.profiles
      : null;
    const name = profile?.full_name ?? "—";
    const existing = byGroup.get(r.course_group_id);

    if (existing) {
      // Membre non-représentant : n'ajoute que le nom de l'élève.
      if (!existing.students.includes(name)) existing.students.push(name);
      continue;
    }

    const vocabCount = Array.isArray(r.vocabulary) ? (r.vocabulary[0]?.count ?? 0) : 0;
    const grammarCount = Array.isArray(r.grammar_rules) ? (r.grammar_rules[0]?.count ?? 0) : 0;
    const forms = Array.isArray(r.formulations) ? r.formulations : [];
    byGroup.set(r.course_group_id, {
      id: r.id,
      title: r.custom_title || format(new Date(r.session_date), "d MMMM yyyy", { locale: fr }),
      date: format(new Date(r.session_date), "d MMM yyyy", { locale: fr }),
      students: [name],
      vocabCount,
      grammarCount,
      formCount: forms.length,
      audioCount: forms.filter((f) => !!f.audio_path).length,
      supportCount: ((r.support_files as SupportFile[] | null) ?? []).length,
    });
  }

  const courses = [...byGroup.values()];

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Bibliothèque
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          Tous tes cours donnés. Duplique-en un vers d&apos;autres élèves pour
          leur donner le même contenu sans tout refaire.
        </p>
      </div>

      {dupCount > 0 && (
        <p
          className="rounded-[14px] px-4 py-3"
          style={{ background: "#ECFAF4", border: "1px solid #9FE3C8", color: "#0A6B4E", fontSize: 13.5, fontWeight: 600 }}
        >
          Cours dupliqué vers {dupCount} élève{dupCount > 1 ? "s" : ""} ✓
        </p>
      )}

      {courses.length === 0 ? (
        <p
          className="rounded-[16px] p-4"
          style={{ background: "#FDF4E3", border: "1px solid #F4D193", color: "#9A6206", fontSize: 14 }}
        >
          Aucun cours enregistré pour l&apos;instant.
        </p>
      ) : (
        <div className="space-y-2.5">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/teacher/library/${c.id}`}
              className="block rounded-[16px] p-4 transition-opacity hover:opacity-90"
              style={{ background: "#fff", border: "1px solid #EFEAE0" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: "#1C1A17", fontSize: 15 }}>
                    {c.title}
                  </p>
                  <p className="mt-0.5" style={{ color: "#8B857A", fontSize: 12.5 }}>
                    {c.students.length > 1
                      ? `Donné à ${c.students.join(", ")}`
                      : c.students[0]}{" "}
                    · {c.date}
                  </p>
                </div>
                <span
                  className="shrink-0 inline-flex items-center gap-1 rounded-full font-semibold"
                  style={{ background: "#ECFAF4", color: "#0A6B4E", fontSize: 11, padding: "4px 10px" }}
                >
                  Dupliquer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0A6B4E" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {c.vocabCount > 0 && <Chip label={`${c.vocabCount} mot${c.vocabCount > 1 ? "s" : ""}`} />}
                {c.grammarCount > 0 && <Chip label={`${c.grammarCount} règle${c.grammarCount > 1 ? "s" : ""}`} />}
                {c.formCount > 0 && (
                  <Chip
                    label={
                      c.audioCount > 0
                        ? `${c.formCount} formulation${c.formCount > 1 ? "s" : ""} · ${c.audioCount} audio${c.audioCount > 1 ? "s" : ""}`
                        : `${c.formCount} formulation${c.formCount > 1 ? "s" : ""}`
                    }
                  />
                )}
                {c.supportCount > 0 && <Chip label={`${c.supportCount} support${c.supportCount > 1 ? "s" : ""}`} />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full"
      style={{ background: "#FBF9F5", border: "1px solid #EFEAE0", color: "#6B6459", fontSize: 11, padding: "3px 9px" }}
    >
      {label}
    </span>
  );
}
