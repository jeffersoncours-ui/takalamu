"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type SupportFile = { path: string; name: string };

export async function deleteSession(studentId: string, recordId: string) {
  await requireTeacher();
  const supabase = await createClient();

  // Nettoyage best-effort des fichiers de support avant suppression DB
  // (pattern déjà accepté ailleurs — un fichier orphelin en Storage est sans
  // conséquence à cette échelle, cf. lessons.md session 11).
  const { data: record } = await supabase
    .from("lesson_records")
    .select("support_files")
    .eq("id", recordId)
    .maybeSingle();

  const files = (record?.support_files as SupportFile[] | null) ?? [];
  if (files.length > 0) {
    await supabase.storage.from("session-files").remove(files.map((f) => f.path));
  }

  const { error } = await supabase.rpc("delete_session_record", {
    p_record_id: recordId,
  });

  if (error) {
    redirect(`/teacher/students/${studentId}/sessions/${recordId}?error=delete`);
  }

  revalidatePath(`/teacher/students/${studentId}`);
  redirect(`/teacher/students/${studentId}#historique`);
}
