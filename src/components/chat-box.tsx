"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  body: string;
  sent_at: string;
  read_at: string | null;
};

type ActionFn = (
  prev: { error?: string },
  formData: FormData,
) => Promise<{ error?: string; message?: Message }>;

type Props = {
  conversationId: string;
  initialMessages: Message[];
  currentUserId: string;
  sendAction: ActionFn;
  markReadAction: () => Promise<void>;
};

export function ChatBox({
  conversationId,
  initialMessages,
  currentUserId,
  sendAction,
  markReadAction,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: Message[], newMsg: Message) => [...state, newMsg],
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Fix 3 : client créé une seule fois (useRef, pas dans useEffect)
  const supabaseRef = useRef(createClient());
  const markReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Fix 4 : distinguer montage (auto) de nouveaux messages (smooth)
  const isFirstRender = useRef(true);

  useEffect(() => {
    const behavior = isFirstRender.current ? "auto" : "smooth";
    isFirstRender.current = false;
    bottomRef.current?.scrollIntoView({ behavior });
  }, [optimisticMessages]);

  // Marquer comme lu au montage
  useEffect(() => {
    markReadAction();
    return () => {
      if (markReadTimer.current) clearTimeout(markReadTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fix 2 : markRead debounced (600 ms) pour éviter N appels en rafale
  const debouncedMarkRead = () => {
    if (markReadTimer.current) clearTimeout(markReadTimer.current);
    markReadTimer.current = setTimeout(() => markReadAction(), 600);
  };

  // Realtime — uniquement les messages entrants (les nôtres sont gérés via startTransition)
  useEffect(() => {
    const supabase = supabaseRef.current;
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === currentUserId) return; // déjà ajouté en optimistic
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          debouncedMarkRead();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  // Fix 1 : envoi optimiste — le message apparaît avant la réponse serveur
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = (formData.get("body") as string)?.trim();
    if (!body) return;

    formRef.current?.reset();

    startTransition(async () => {
      addOptimisticMessage({
        id: `opt-${Date.now()}`,
        sender_id: currentUserId,
        body,
        sent_at: new Date().toISOString(),
        read_at: null,
      });
      const result = await sendAction({}, formData);
      if (result.error) {
        setError(result.error);
      } else {
        // Ajouter le vrai message retourné par le serveur avant que l'optimistic se dissipe
        if (result.message) {
          setMessages((prev) => [...prev, result.message!]);
        }
        setError(undefined);
      }
    });
  };

  return (
    <div className="flex flex-col h-[64vh] min-h-[340px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-2">
        {optimisticMessages.length === 0 && (
          <p className="text-center py-8" style={{ color: "var(--tk-faint-olive)", fontSize: 14 }}>
            Aucun message pour l&apos;instant.
          </p>
        )}
        {optimisticMessages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          const isOptimistic = msg.id.startsWith("opt-");
          return (
            <div
              key={msg.id}
              className="max-w-[78%]"
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                background: isMine
                  ? "linear-gradient(180deg, var(--tk-emerald-btn-from), var(--tk-emerald-btn-to))"
                  : "var(--tk-parchment-card)",
                border: isMine ? "none" : "1px solid var(--tk-parchment-border)",
                borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                padding: "11px 14px",
                boxShadow: "0 8px 18px -12px rgba(10,20,15,.4)",
                opacity: isOptimistic ? 0.7 : 1,
                transition: "opacity 0.15s",
              }}
            >
              <p
                className="whitespace-pre-wrap break-words"
                style={{ color: isMine ? "var(--tk-cream-text)" : "var(--tk-ink-text)", fontSize: 14, lineHeight: 1.45 }}
              >
                {msg.body}
              </p>
              <p
                className="mt-1.5"
                style={{
                  color: isMine ? "rgba(243,234,214,.65)" : "var(--tk-faint-olive)",
                  fontSize: 10,
                  fontWeight: 600,
                  textAlign: isMine ? "right" : "left",
                }}
                suppressHydrationWarning
              >
                {isOptimistic
                  ? "…"
                  : new Date(msg.sent_at).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                {isMine && !isOptimistic && msg.read_at && " · Lu"}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--tk-parchment-border)" }}>
        {error && (
          <p className="mb-2" style={{ color: "var(--tk-danger)", fontSize: 12 }}>{error}</p>
        )}
        <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2.5 items-center">
          <input
            name="body"
            type="text"
            placeholder="Écrire un message…"
            autoComplete="off"
            className="flex-1 outline-none"
            style={{
              height: 46,
              borderRadius: 23,
              border: "1px solid var(--tk-parchment-border)",
              background: "var(--tk-parchment-card)",
              padding: "0 16px",
              fontSize: 14,
              color: "var(--tk-ink-text)",
            }}
          />
          <button
            type="submit"
            disabled={isPending}
            aria-label="Envoyer"
            className="flex shrink-0 items-center justify-center disabled:opacity-50 rounded-full"
            style={{
              width: 46,
              height: 46,
              background: "linear-gradient(180deg, var(--tk-gold-light), var(--tk-gold))",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tk-ink-hero-to)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
