import { Resend } from "resend";

// TODO: une fois le domaine OVH ajouté dans Resend, définir EMAIL_FROM en prod sur Vercel.
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export async function sendTrialCode(params: {
  to: string;
  firstName: string;
  code: string;
  scheduledAt?: string | null;
}): Promise<{ error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { error: "RESEND_API_KEY non configurée." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { to, firstName, code, scheduledAt } = params;

  let slotLine = "";
  if (scheduledAt) {
    const d = new Date(scheduledAt);
    slotLine =
      `Ton cours d'essai était prévu le ${d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })}.\n\n`;
  }

  const body = [
    `Bonjour ${firstName},`,
    "",
    slotLine + "Ton cours d'essai d'arabe est confirmé — félicitations !",
    "Pour t'inscrire et choisir ton abonnement, utilise ce code :",
    "",
    `    ${code}`,
    "",
    "Ce code est valable 30 jours. Il te sera demandé lors de ton inscription.",
    "",
    "À bientôt,",
    "L'équipe Takalamu",
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Ton cours d'essai est confirmé — voici ton code",
    text: body,
  });

  if (error) return { error: error.message };
  return {};
}

/** Email avec le lien de paiement PayPal (1er versement ou échéance mensuelle). */
export async function sendPaymentLink(params: {
  to: string;
  firstName: string;
  amountCents: number;
  reference: string;
  paypalUrl: string;
  /** Ex. « Abonnement annuel — 3e versement sur 12 » ou « Heure à la carte ». */
  label: string;
}): Promise<{ error?: string }> {
  if (!process.env.RESEND_API_KEY) {
    return { error: "RESEND_API_KEY non configurée." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { to, firstName, amountCents, reference, paypalUrl, label } = params;
  const amount = (amountCents / 100).toFixed(2).replace(".", ",");

  const body = [
    `Bonjour ${firstName},`,
    "",
    `Voici ton lien de paiement pour : ${label}.`,
    "",
    `Montant : ${amount} €`,
    `Référence : ${reference}`,
    "",
    `Payer maintenant : ${paypalUrl}`,
    "",
    `Important : indique bien la référence ${reference} dans la note du paiement PayPal,`,
    "pour qu'on puisse valider ton règlement rapidement.",
    "",
    "À bientôt,",
    "L'équipe Takalamu",
  ].join("\n");

  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `Ton paiement Takalamu — ${amount} € (réf. ${reference})`,
    text: body,
  });

  if (error) return { error: error.message };
  return {};
}
