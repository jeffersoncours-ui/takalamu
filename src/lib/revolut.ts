import { createHmac, timingSafeEqual } from "crypto";

// Revolut Merchant API — accepter les paiements des élèves.
// TODO: configurer REVOLUT_MERCHANT_API_KEY dans Vercel une fois le compte Revolut Business activé.
// Docs: https://developer.revolut.com/docs/merchant/create-an-order

const MERCHANT_API = "https://merchant.revolut.com/api/1.0";

export type RevolutOrderResult =
  | { checkoutUrl: string; orderId: string; error?: never }
  | { checkoutUrl?: never; orderId?: never; error: string }
  | { checkoutUrl?: never; orderId?: never; error?: never }; // pas de clé → mode manuel

export async function createRevolutOrder(params: {
  amountCents: number;
  currency: string;
  orderRef: string;
  customerEmail: string;
  description: string;
}): Promise<RevolutOrderResult> {
  const apiKey = process.env.REVOLUT_MERCHANT_API_KEY;
  if (!apiKey) return {}; // pas de clé → paiement manuel, pas d'erreur

  try {
    const res = await fetch(`${MERCHANT_API}/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: params.amountCents,
        currency: params.currency,
        merchant_order_ext_ref: params.orderRef,
        customer_email: params.customerEmail,
        description: params.description,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { error: `Revolut ${res.status}: ${text.slice(0, 120)}` };
    }

    const data = (await res.json()) as { id: string; checkout_url: string };
    return { checkoutUrl: data.checkout_url, orderId: data.id };
  } catch (e) {
    return { error: String(e) };
  }
}

/** Vérifie la signature HMAC-SHA256 d'un webhook Revolut (header Revolut-Signature: v1=<hex>). */
export function verifyRevolutSignature(body: string, signature: string): boolean {
  const secret = process.env.REVOLUT_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const hex = signature.startsWith("v1=") ? signature.slice(3) : signature;
  const expected = createHmac("sha256", secret).update(body).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hex, "hex"));
  } catch {
    return false;
  }
}
