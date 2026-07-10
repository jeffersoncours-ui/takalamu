import { NextRequest, NextResponse } from "next/server";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSessionReminder } from "@/lib/resend";

export const dynamic = "force-dynamic";

const PARIS_TZ = "Europe/Paris";

/**
 * Cron quotidien (Vercel Cron) : rappel du jour pour toute séance ayant lieu
 * aujourd'hui (jour calendaire à Paris). Email + notification in-app, dédupliqué
 * via `bookings.reminder_sent`.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const todayParis = formatInTimeZone(new Date(), PARIS_TZ, "yyyy-MM-dd");
  const startUtc = fromZonedTime(`${todayParis}T00:00:00`, PARIS_TZ);
  const endUtc = fromZonedTime(`${todayParis}T23:59:59.999`, PARIS_TZ);

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, scheduled_at, zoom_link, students(profile_id, profiles(email, full_name))")
    .eq("status", "booked")
    .eq("reminder_sent", false)
    .gte("scheduled_at", startUtc.toISOString())
    .lte("scheduled_at", endUtc.toISOString());

  if (error) {
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const b of bookings ?? []) {
    const student = Array.isArray(b.students) ? b.students[0] : b.students;
    const profile = student
      ? (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles)
      : null;

    if (profile?.email) {
      const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "élève";
      const { error: mailErr } = await sendSessionReminder({
        to: profile.email,
        firstName,
        scheduledAt: b.scheduled_at,
        zoomLink: b.zoom_link,
      });
      if (mailErr) errors.push(`email ${b.id}: ${mailErr}`);
    }

    if (student?.profile_id) {
      await admin.rpc("insert_notification", {
        p_user_id: student.profile_id,
        p_type: "session_reminder",
        p_payload: { url: "/dashboard/bookings", scheduled_at: b.scheduled_at },
      });
    }

    const { error: updateErr } = await admin
      .from("bookings")
      .update({ reminder_sent: true })
      .eq("id", b.id);
    if (updateErr) errors.push(`update ${b.id}: ${updateErr.message}`);

    sent++;
  }

  return NextResponse.json({ candidates: bookings?.length ?? 0, remindersSent: sent, errors });
}
