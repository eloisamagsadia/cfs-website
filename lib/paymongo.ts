const PAYMONGO_BASE = "https://api.paymongo.com/v1";
const SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;

// Base64 encode the secret key for Basic Auth
const authHeader = `Basic ${Buffer.from(`${SECRET_KEY}:`).toString("base64")}`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PaymentType = "order" | "registration" | "donation";

export interface CreatePaymentLinkOptions {
  amount: number;           // in centavos (PHP cents) — e.g. ₱500 = 50000
  description: string;
  referenceId: string;      // your internal order/registration/donation ID
  type: PaymentType;
  remarks?: string;
  redirectUrl?: string;     // where PayMongo redirects after payment
}

export interface PayMongoPaymentLink {
  id: string;
  checkoutUrl: string;
  referenceNumber: string;
}

// ─── CREATE PAYMENT LINK ──────────────────────────────────────────────────────
/**
 * Creates a PayMongo Payment Link that redirects users to the PayMongo
 * hosted checkout page. Supports GCash, Maya, Cards, GrabPay, BPI, UnionBank.
 */
export async function createPaymentLink(
  options: CreatePaymentLinkOptions
): Promise<PayMongoPaymentLink> {
  const { amount, description, referenceId, type, remarks, redirectUrl } = options;

  const response = await fetch(`${PAYMONGO_BASE}/links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
    },
    body: JSON.stringify({
      data: {
        attributes: {
          amount,                  // in centavos
          description,
          remarks: remarks ?? description,
          redirect_url: redirectUrl,
          metadata: {
            reference: referenceId,
            type,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `PayMongo error: ${error.errors?.[0]?.detail ?? "Unknown error"}`
    );
  }

  const data = await response.json();
  const attrs = data.data.attributes;

  return {
    id: data.data.id,
    checkoutUrl: attrs.checkout_url,
    referenceNumber: attrs.reference_number,
  };
}

// ─── VERIFY WEBHOOK ───────────────────────────────────────────────────────────
/**
 * Verifies a PayMongo webhook signature.
 * Call this at the start of your webhook handler.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  signature: string
): Promise<boolean> {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET!;

  try {
    const parts = Object.fromEntries(
      signature.split(",").map((part) => part.split("=") as [string, string])
    );
    const timestamp = parts["t"];
    const teSig = parts["te"];
    const liSig = parts["li"];
    if (!timestamp || (!teSig && !liSig)) return false;

    const message = `${timestamp}.${rawBody}`;
    const encoder = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const computed = Buffer.from(
      await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message))
    ).toString("hex");

    return computed === teSig || computed === liSig;
  } catch {
    return false;
  }
}

// ─── PESO HELPERS ─────────────────────────────────────────────────────────────

/** Convert PHP pesos to centavos for PayMongo */
export const tocentavos = (pesos: number) => Math.round(pesos * 100);

/** Convert centavos back to pesos */
export const toPesos = (centavos: number) => centavos / 100;

/** Format amount as Philippine Peso string */
export const formatPHP = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

/** Calculate PayMongo fee for a given amount */
export const calculateFee = (amountPesos: number) =>
  amountPesos * 0.0245 + 15;
