// Paiement via PayPal.Me (compte PayPal personnel du propriétaire).
// Pas d'API ni de webhook : le lien porte le montant exact, l'élève paie,
// l'enseignant confirme manuellement dans l'app quand l'argent est reçu.
// TODO: définir PAYPAL_ME_USERNAME dans Vercel (ex. "jefferson" pour paypal.me/jefferson).

export function isPaypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_ME_USERNAME);
}

/** Lien PayPal.Me à montant exact (EUR), ou null si non configuré. */
export function paypalMeUrl(amountCents: number): string | null {
  const username = process.env.PAYPAL_ME_USERNAME;
  if (!username) return null;
  // PayPal.Me accepte les décimales avec un point : /username/58.00EUR
  const amount = (amountCents / 100).toFixed(2);
  return `https://www.paypal.com/paypalme/${username}/${amount}EUR`;
}
