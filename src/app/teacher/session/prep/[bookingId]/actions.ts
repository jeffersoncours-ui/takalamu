"use server";

import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function savePrepNotes(bookingId: string, formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const notes = formData.get("prep_notes") as string | null;

  const { error } = await supabase
    .from("bookings")
    .update({ prep_notes: notes ?? "" })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);

  redirect("/teacher?prep=ok");
}
