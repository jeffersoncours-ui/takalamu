"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
) => Promise<{ error?: string }>;

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
  const [state, formAction, pending] = useActionState(sendAction, {});
  const bottomRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Marquer comme lu au montage
  useEffect(() => {
    markReadAction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Réinitialiser le formulaire après envoi réussi
  useEffect(() => {
    if (!pending && !state.error) {
      formRef.current?.reset();
    }
  }, [pending, state.error]);

  // Supabase Realtime — nouveaux messages
  useEffect(() => {
    const supabase = createClient();
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
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          // Marquer lu si c'est un message entrant
          if (msg.sender_id !== currentUserId) {
            markReadAction();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  return (
    <div className="flex flex-col h-[60vh] min-h-[320px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">
            Aucun message pour l&apos;instant.
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-emerald-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                <p
                  className={`text-xs mt-1 ${
                    isMine ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {new Date(msg.sent_at).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {isMine && msg.read_at && " · Lu"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Saisie */}
      <div className="border-t border-slate-200 pt-3">
        {state.error && (
          <p className="text-xs text-red-600 mb-2">{state.error}</p>
        )}
        <form ref={formRef} action={formAction} className="flex gap-2">
          <input
            name="body"
            type="text"
            placeholder="Écrire un message…"
            autoComplete="off"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {pending ? "…" : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}
