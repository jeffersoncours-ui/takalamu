import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ChatBox } from "@/components/chat-box";
import { sendMessage, markMessagesRead } from "./actions";

export default async function StudentMessagesPage() {
  const { studentId, userId } = await requireStudent();
  const supabase = await createClient();

  // Récupérer l'enseignant de l'élève
  const { data: student } = await supabase
    .from("students")
    .select("teacher_id, teachers:teacher_id(display_name)")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) {
    return (
      <p className="text-sm text-slate-500">Profil élève introuvable.</p>
    );
  }

  const teacher = Array.isArray(student.teachers)
    ? student.teachers[0]
    : student.teachers;
  const teacherName = teacher?.display_name ?? "Mon enseignant";

  // Trouver ou créer la conversation (la policy INSERT permet aux élèves de créer leur propre conv)
  let { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("teacher_id", student.teacher_id)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!conv) {
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({ teacher_id: student.teacher_id, student_id: studentId })
      .select("id")
      .maybeSingle();
    conv = newConv;
  }

  if (!conv) {
    return (
      <p className="text-sm text-slate-500">
        Impossible d&apos;ouvrir la conversation.
      </p>
    );
  }

  // Charger les 50 derniers messages
  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, body, sent_at, read_at")
    .eq("conversation_id", conv.id)
    .order("sent_at", { ascending: true })
    .limit(50);

  const sendAction = sendMessage.bind(null, conv.id);
  const markReadAction = markMessagesRead.bind(null, conv.id);

  return (
    <div className="space-y-4">
      {/* En-tête prof */}
      <div className="flex items-center gap-3 px-0.5">
        <div
          className="flex shrink-0 items-center justify-center rounded-[13px] text-white font-semibold"
          style={{ width: 44, height: 44, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 17 }}
        >
          {teacherName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <div className="font-bold" style={{ color: "#1C1A17", fontSize: 16 }}>{teacherName}</div>
          <div style={{ color: "#8B857A", fontSize: 12 }}>Enseignant</div>
        </div>
      </div>

      <div
        className="rounded-[20px] p-4"
        style={{ background: "#FBF9F5", border: "1px solid #EFEAE0" }}
      >
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
