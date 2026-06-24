import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Adresse expéditrice : domaine vérifié en prod, onboarding@resend.dev en dev.
// TODO: une fois le domaine OVH ajouté dans Resend, définir EMAIL_FROM en prod sur Vercel.
const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

export async function sendTrialCode(params: {
  to: string;
  firstName: string;
  code: string;
  scheduledAt?: string | null;
}): Promise<{ error?: string }> {
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
