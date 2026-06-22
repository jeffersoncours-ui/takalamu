import { notFound } from "next/navigation";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatBox } from "@/components/chat-box";
import { sendMessageAsTeacher, markMessagesReadAsTeacher } from "../actions";

export default async function TeacherMessagesPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { userId } = await requireTeacher();
  const supabase = await createClient();

  // Vérifier que l'élève appartient bien à cet enseignant
  const { data: student } = await supabase
    .from("students")
    .select("id, profiles(full_name)")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) notFound();

  const studentName = Array.isArray(student.profiles)
    ? student.profiles[0]?.full_name
    : student.profiles?.full_name;

  // Obtenir le teacher_id
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!teacher) notFound();

  // Créer ou récupérer la conversation (le teacher a la policy d'écriture)
  const { data: conv } = await supabase
    .from("conversations")
    .upsert(
      { teacher_id: teacher.id, student_id: studentId },
      { onConflict: "teacher_id,student_id", ignoreDuplicates: false },
    )
    .select("id")
    .maybeSingle();

  if (!conv) notFound();

  // Charger les 50 derniers messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, sent_at, read_at")
    .eq("conversation_id", conv.id)
    .order("sent_at", { ascending: true })
    .limit(50);

  const sendAction = sendMessageAsTeacher.bind(null, conv.id);
  const markReadAction = markMessagesReadAsTeacher.bind(null, conv.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-slate-900">
          Chat — {studentName ?? "Élève"}
        </h1>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <ChatBox
          conversationId={conv.id}
          initialMessages={messages ?? []}
          currentUserId={userId}
          sendAction={sendAction}
          markReadAction={markReadAction}
        />
      </div>
    </div>
  );
}
