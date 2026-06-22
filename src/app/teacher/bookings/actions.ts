"use server";

import { revalidatePath } from "next/cache";

import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];
type ActionState = { error?: string };

export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  _prev: ActionState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) return { error: "Échec de la mise à jour." };

  revalidatePath("/teacher/bookings");
  revalidatePath("/teacher");
  return {};
}

export async function updateZoomLink(
  bookingId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const zoomLink = String(formData.get("zoom_link") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ zoom_link: zoomLink })
    .eq("id", bookingId);

  if (error) return { error: "Échec de la mise à jour du lien." };

  revalidatePath("/teacher/bookings");
  return {};
}
