"use server";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SentMessage = { id: string; sender_id: string; body: string; sent_at: string; read_at: string | null };
type ActionState = { error?: string; message?: SentMessage };

export async function sendMessageAsTeacher(
  conversationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await requireTeacher();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return {};

  const supabase = await createClient();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, student_id")
    .eq("id", conversationId)
    .maybeSingle();

  if (!conv) return { error: "Conversation introuvable." };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: userId,
      body,
      sent_at: new Date().toISOString(),
    })
    .select("id, sender_id, body, sent_at, read_at")
    .single();

  if (error) return { error: "Impossible d'envoyer le message." };

  // Notification pour l'élève
  const admin = createAdminClient();
  const { data: student } = await admin
    .from("students")
    .select("profile_id")
    .eq("id", conv.student_id)
    .maybeSingle();

  if (student?.profile_id) {
    await admin.from("notifications").insert({
      user_id: student.profile_id,
      type: "new_message",
      payload: { conversation_id: conversationId },
      read: false,
    });
  }

  return { message };
}

export async function markMessagesReadAsTeacher(
  conversationId: string,
): Promise<void> {
  const { userId } = await requireTeacher();
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}
