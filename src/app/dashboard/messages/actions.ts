"use server";

import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ActionState = { error?: string };

export async function sendMessage(
  conversationId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { userId } = await requireStudent();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return {};

  const supabase = await createClient();

  // Vérifier que l'utilisateur est bien membre de cette conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, teacher_id, student_id")
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

  // Créer une notification pour le destinataire (admin client car pas de policy INSERT)
  const admin = createAdminClient();
  const recipientProfileId =
    conv.student_id === (await getStudentId(supabase, userId))
      ? await getTeacherProfileId(admin, conv.teacher_id)
      : null;

  if (recipientProfileId) {
    await admin.from("notifications").insert({
      user_id: recipientProfileId,
      type: "new_message",
      payload: { conversation_id: conversationId },
      read: false,
    });
  }

  return {};
}

export async function markMessagesRead(
  conversationId: string,
): Promise<void> {
  const { userId } = await requireStudent();
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

// Helpers internes
async function getStudentId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.id ?? null;
}

async function getTeacherProfileId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  teacherId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("teachers")
    .select("profile_id")
    .eq("id", teacherId)
    .maybeSingle();
  return data?.profile_id ?? null;
}
