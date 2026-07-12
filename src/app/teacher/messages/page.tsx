import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function TeacherMessagesListPage() {
  const { userId } = await requireTeacher();
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!teacher) return <p style={{ color: "#8B857A" }}>Profil enseignant introuvable.</p>;

  // Toutes les conversations de ce teacher, avec le nom de l'élève et le dernier message
  const { data: conversations, error: convError } = await supabase
    .from("conversations")
    .select(
      "id, student_id, students(id, profiles(full_name)), messages(id, body, sent_at, sender_id, read_at)",
    )
    .eq("teacher_id", teacher.id)
    .order("sent_at", { referencedTable: "messages", ascending: false });

  if (convError) console.error("teacher/messages query failed:", convError.message);

  const items = (conversations ?? []).map((conv) => {
    const student = Array.isArray(conv.students) ? conv.students[0] : conv.students;
    const profile = student
      ? Array.isArray(student.profiles)
        ? student.profiles[0]
        : student.profiles
      : null;
    const name = profile?.full_name ?? "Élève";

    // Premier message du tableau = le plus récent (trié desc)
    const msgs = Array.isArray(conv.messages) ? conv.messages : conv.messages ? [conv.messages] : [];
    const lastMsg = msgs[0] ?? null;

    // Nombre de messages non lus envoyés par l'élève
    const unreadCount = msgs.filter(
      (m) => m.sender_id !== userId && !m.read_at,
    ).length;

    return {
      convId: conv.id,
      studentId: student?.id ?? "",
      name,
      lastMsg,
      unreadCount,
    };
  });

  // Trier par date du dernier message (les plus récents en premier)
  items.sort((a, b) => {
    const dateA = a.lastMsg?.sent_at ?? "";
    const dateB = b.lastMsg?.sent_at ?? "";
    return dateB.localeCompare(dateA);
  });

  return (
    <div className="space-y-5">
      <div className="px-0.5">
        <h1
          className="leading-tight"
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "#1C1A17" }}
        >
          Messages
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "#8B857A", fontSize: 14 }}>
          {items.length} conversation{items.length > 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 && (
        <p
          className="rounded-[16px] p-4"
          style={{ background: "#FBF9F5", border: "1px solid #EFEAE0", color: "#8B857A", fontSize: 14 }}
        >
          Aucune conversation pour le moment.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.map(({ convId, studentId, name, lastMsg, unreadCount }) => (
          <Link
            key={convId}
            href={`/teacher/messages/${studentId}`}
            className="flex items-center gap-3 rounded-[18px] p-4 transition-opacity hover:opacity-80"
            style={{ background: "#fff", border: "1px solid #EFEAE0", boxShadow: "0 6px 16px rgba(28,26,23,.04)" }}
          >
            {/* Avatar */}
            <div
              className="flex shrink-0 items-center justify-center rounded-[13px] text-white font-bold"
              style={{ width: 46, height: 46, background: "#0A553F", fontFamily: "var(--font-spectral)", fontSize: 17 }}
            >
              {name[0]?.toUpperCase() ?? "?"}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-bold truncate"
                  style={{ color: "#1C1A17", fontSize: 15, fontFamily: "var(--font-spectral)" }}
                >
                  {name}
                </span>
                {lastMsg && (
                  <span
                    className="shrink-0 text-xs font-medium"
                    style={{ color: "#A8A29E" }}
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: true, locale: fr })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span
                  className="truncate text-sm"
                  style={{ color: unreadCount > 0 ? "#1C1A17" : "#8B857A", fontWeight: unreadCount > 0 ? 600 : 400 }}
                >
                  {lastMsg ? lastMsg.body : "Démarrer la conversation →"}
                </span>
                {unreadCount > 0 && (
                  <span
                    className="shrink-0 flex items-center justify-center rounded-full text-white font-bold"
                    style={{ minWidth: 20, height: 20, background: "#0F9D6E", fontSize: 11, padding: "0 5px" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C7C0B4" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
