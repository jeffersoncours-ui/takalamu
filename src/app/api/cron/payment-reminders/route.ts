import { NextRequest, NextResponse } from "next/server";
import { addMonths } from "date-fns";

import { createAdminClient } from "@/lib/supabase/admin";
import { paypalMeUrl } from "@/lib/paypal";
import { sendPaymentLink } from "@/lib/resend";
import { getAnnualPlan, installmentCents, isAnnualPlanKey } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/**
 * Cron quotidien (Vercel Cron) : relances des échéances des abonnements annuels
 * payés en plusieurs fois (2x / 3x / 12x).
 *
 * Ancre = date du 1er versement confirmé. Intervalle = 12 / nb de versements mois
 * (12x → mensuel, 3x → tous les 4 mois, 2x → tous les 6 mois).
 * À chaque échéance atteinte : ligne `payments` pending (dédupliquée par `period`)
 * + email PayPal.Me + notification in-app. L'enseignant confirme à réception.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Tous les paiements d'abonnement annuel fractionné, avec l'identité de l'élève
  const { data: rows, error } = await admin
    .from("payments")
    .select(
      "id, student_id, plan, status, period, created_at, students(profile_id, profiles(email, full_name))",
    )
    .eq("product", "individual_sub")
    .in("plan", ["2x", "3x", "12x"])
    .in("status", ["paid", "pending"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  // Grouper par élève
  const byStudent = new Map<string, NonNullable<typeof rows>>();
  for (const r of rows ?? []) {
    const list = byStudent.get(r.student_id) ?? [];
    list.push(r);
    byStudent.set(r.student_id, list);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const [studentId, payments] of byStudent) {
    const paid = payments.filter((p) => p.status === "paid");
    if (paid.length === 0) continue; // 1er versement pas encore confirmé

    const plan = paid[0].plan;
    if (!plan || !isAnnualPlanKey(plan)) continue;

    const { installments } = getAnnualPlan(plan);
    if (paid.length >= installments) continue; // échéancier soldé

    const intervalMonths = 12 / installments;
    const anchor = new Date(paid[0].created_at);
    const nextDue = addMonths(anchor, paid.length * intervalMonths);
    if (now < nextDue) continue; // échéance pas encore atteinte

    // Dédup : une seule ligne par période d'échéance
    const period = nextDue.toISOString().slice(0, 7); // YYYY-MM
    if (payments.some((p) => p.period === period)) continue;

    const student = Array.isArray(paid[0].students) ? paid[0].students[0] : paid[0].students;
    const profile = student
      ? (Array.isArray(student.profiles) ? student.profiles[0] : student.profiles)
      : null;
    if (!profile?.email) continue;

    const amountCents = installmentCents(plan);
    const reference = `TK-${period.replace("-", "")}-${studentId.slice(0, 4).toUpperCase()}`;

    const { error: insertErr } = await admin.from("payments").insert({
      student_id: studentId,
      product: "individual_sub",
      plan,
      status: "pending",
      amount_cents: amountCents,
      revolut_reference: reference,
      period,
    });
    if (insertErr) {
      errors.push(`insert ${studentId}: ${insertErr.message}`);
      continue;
    }

    const paypalUrl = paypalMeUrl(amountCents);
    if (paypalUrl) {
      const firstName = (profile.full_name ?? "").trim().split(" ")[0] || "élève";
      const { error: mailErr } = await sendPaymentLink({
        to: profile.email,
        firstName,
        amountCents,
        reference,
        paypalUrl,
        label: `Abonnement annuel — versement ${paid.length + 1} sur ${installments}`,
      });
      if (mailErr) errors.push(`email ${studentId}: ${mailErr}`);
    }

    // Notification in-app (cloche élève)
    if (student?.profile_id) {
      await admin.rpc("insert_notification", {
        p_user_id: student.profile_id,
        p_type: "payment_requested",
        p_payload: { url: "/dashboard/payments", period },
      });
    }

    sent++;
  }

  return NextResponse.json({ students: byStudent.size, remindersSent: sent, errors });
}
