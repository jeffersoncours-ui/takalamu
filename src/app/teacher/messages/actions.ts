"use server";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = { error?: string };

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

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: userId,
    body,
    sent_at: new Date().toISOString(),
  });

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

  return {};
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
