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
    .select("teacher_id, teachers:teacher_id(display_name, profiles(avatar_url))")
    .eq("id", studentId)
    .maybeSingle();

  if (!student?.teacher_id) {
    return (
      <p className="text-sm" style={{ color: "var(--tk-muted-olive)" }}>Profil élève introuvable.</p>
    );
  }

  const teacher = Array.isArray(student.teachers)
    ? student.teachers[0]
    : student.teachers;
  const teacherName = teacher?.display_name ?? "Mon enseignant";

  const teacherProfile = teacher
    ? Array.isArray(teacher.profiles)
      ? teacher.profiles[0]
      : teacher.profiles
    : null;
  let teacherAvatarUrl: string | null = null;
  if (teacherProfile?.avatar_url) {
    const { data: signed } = await supabase.storage
      .from("avatars")
      .createSignedUrl(teacherProfile.avatar_url, 3600);
    teacherAvatarUrl = signed?.signedUrl ?? null;
  }

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
      <p className="text-sm" style={{ color: "var(--tk-muted-olive)" }}>
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
    <div className="-mx-4 -mt-5 flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* En-tête prof, encre */}
      <div
        className="hachure-ink flex items-center gap-3 px-[22px] py-5"
        style={{ background: "linear-gradient(160deg, var(--tk-ink-hero-from), var(--tk-ink-hero-to))" }}
      >
        <div
          className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,.1)",
            border: "1px solid rgba(199,154,62,.4)",
            color: "var(--tk-gold-light)",
            fontFamily: "var(--font-spectral)",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {teacherAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={teacherAvatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            teacherName[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <div>
          <div style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 18, color: "var(--tk-cream-text)" }}>
            {teacherName}
          </div>
          <div className="mt-0.5" style={{ color: "var(--tk-sage-bright)", fontSize: 11 }}>Enseignant</div>
        </div>
      </div>

      <div className="flex-1 px-[18px] py-4" style={{ background: "#E7EDE4" }}>
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
