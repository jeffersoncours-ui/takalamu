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

  if (!teacher) return <p style={{ color: "var(--tk-muted-olive)" }}>Profil enseignant introuvable.</p>;

  // Tous les élèves de ce teacher (pas seulement ceux ayant déjà une ligne
  // `conversations`) — sinon un élève jamais contacté disparaît purement et
  // simplement de la liste au lieu d'apparaître avec "Démarrer la
  // conversation →", comme les autres élèves sans message.
  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select(
      "id, profiles(full_name, avatar_url), conversations(id, messages(id, body, sent_at, sender_id, read_at))",
    )
    .eq("teacher_id", teacher.id);

  if (studentsError) console.error("teacher/messages query failed:", studentsError.message);

  const avatarPaths = (students ?? [])
    .map((s) => (Array.isArray(s.profiles) ? s.profiles[0]?.avatar_url : s.profiles?.avatar_url))
    .filter((p): p is string => !!p);

  let signedAvatars: { path: string; signedUrl: string }[] = [];
  if (avatarPaths.length > 0) {
    const { data: signedList } = await supabase.storage.from("avatars").createSignedUrls(avatarPaths, 3600);
    signedAvatars = (signedList ?? [])
      .filter((s) => !!s.path && !!s.signedUrl)
      .map((s) => ({ path: s.path as string, signedUrl: s.signedUrl as string }));
  }

  const items = (students ?? []).map((s) => {
    const profile = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
    const name = profile?.full_name ?? "Élève";
    const avatarUrl = profile?.avatar_url
      ? (signedAvatars.find((sa) => sa.path === profile.avatar_url)?.signedUrl ?? null)
      : null;

    const conv = Array.isArray(s.conversations) ? s.conversations[0] : s.conversations;
    const msgs = conv ? (Array.isArray(conv.messages) ? conv.messages : conv.messages ? [conv.messages] : []) : [];
    const sortedMsgs = [...msgs].sort((a, b) => b.sent_at.localeCompare(a.sent_at));
    const lastMsg = sortedMsgs[0] ?? null;

    // Nombre de messages non lus envoyés par l'élève
    const unreadCount = msgs.filter(
      (m) => m.sender_id !== userId && !m.read_at,
    ).length;

    return {
      studentId: s.id,
      name,
      avatarUrl,
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
          style={{ fontFamily: "var(--font-spectral)", fontWeight: 700, fontSize: 27, color: "var(--tk-ink-text)" }}
        >
          Messages
        </h1>
        <p className="font-medium mt-0.5" style={{ color: "var(--tk-muted-olive)", fontSize: 14 }}>
          {items.length} élève{items.length > 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 && (
        <p
          className="rounded-[16px] p-4"
          style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", color: "var(--tk-muted-olive)", fontSize: 14 }}
        >
          Aucun élève pour le moment.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {items.map(({ studentId, name, avatarUrl, lastMsg, unreadCount }) => (
          <Link
            key={studentId}
            href={`/teacher/messages/${studentId}`}
            className="flex items-center gap-3 rounded-[18px] p-4 transition-opacity hover:opacity-80"
            style={{ background: "var(--tk-parchment-card)", border: "1px solid var(--tk-parchment-border)", boxShadow: "0 10px 22px -16px rgba(10,20,15,.4)" }}
          >
            {/* Avatar */}
            <div
              className="flex shrink-0 items-center justify-center overflow-hidden rounded-[13px] font-bold"
              style={{
                width: 46,
                height: 46,
                background: "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))",
                color: "var(--tk-gold-light)",
                fontFamily: "var(--font-spectral)",
                fontSize: 17,
              }}
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                name[0]?.toUpperCase() ?? "?"
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-bold truncate"
                  style={{ color: "var(--tk-ink-text)", fontSize: 15, fontFamily: "var(--font-spectral)" }}
                >
                  {name}
                </span>
                {lastMsg && (
                  <span
                    className="shrink-0 text-xs font-medium"
                    style={{ color: "var(--tk-faint-olive)" }}
                    suppressHydrationWarning
                  >
                    {formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: true, locale: fr })}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span
                  className="truncate text-sm"
                  style={{ color: unreadCount > 0 ? "var(--tk-ink-text)" : "var(--tk-muted-olive)", fontWeight: unreadCount > 0 ? 600 : 400 }}
                >
                  {lastMsg ? lastMsg.body : "Démarrer la conversation →"}
                </span>
                {unreadCount > 0 && (
                  <span
                    className="shrink-0 flex items-center justify-center rounded-full font-bold"
                    style={{ minWidth: 20, height: 20, background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))", color: "var(--tk-ink-screen)", fontSize: 11, padding: "0 5px" }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            </div>

            {/* Chevron */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--tk-faint-olive)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
