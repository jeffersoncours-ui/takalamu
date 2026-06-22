import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatBox } from "@/components/chat-box";
import { sendMessage, markMessagesRead } from "./actions";

export default async function StudentMessagesPage() {
  const { studentId, userId } = await requireStudent();
  const supabase = await createClient();

  // Récupérer l'enseignant de l'élève
  const { data: student } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) {
    return (
      <p className="text-sm text-slate-500">Profil élève introuvable.</p>
    );
  }

  // Créer la conversation si elle n'existe pas (seul le teacher peut via RLS,
  // donc on passe par l'admin client)
  const admin = createAdminClient();
  const { data: conv } = await admin
    .from("conversations")
    .upsert(
      { teacher_id: student.teacher_id, student_id: studentId },
      { onConflict: "teacher_id,student_id", ignoreDuplicates: false },
    )
    .select("id")
    .maybeSingle();

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
      <h1 className="text-xl font-semibold text-slate-900">Messages</h1>
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
