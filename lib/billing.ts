export const BILLING_PLANS = {
  starter: {
    label: "Starter",
    price: 39,
    sourceMinutes: 120,
    renderedMinutes: 30,
    members: 1,
    paymentLink: "https://buy.stripe.com/4gMcN473A4i9gx04nld7q0x",
  },
  pro: {
    label: "Pro",
    price: 89,
    sourceMinutes: 400,
    renderedMinutes: 100,
    members: 3,
    paymentLink: "https://buy.stripe.com/9B600i9bIaGx2GacTRd7q0y",
  },
  agency: {
    label: "Agency",
    price: 179,
    sourceMinutes: 1000,
    renderedMinutes: 250,
    members: 10,
    paymentLink: "https://buy.stripe.com/3cI6oG5Zw15X1C6aLJd7q0z",
  },
} as const;

export type BillingPlan = keyof typeof BILLING_PLANS;

export function isBillingPlan(value: unknown): value is BillingPlan {
  return typeof value === "string" && Object.hasOwn(BILLING_PLANS, value);
}

export function billingIsReady() {
  return (
    process.env.BILLING_ENABLED === "true" &&
    Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  );
}

export function checkoutReference(userId: string, plan: BillingPlan, secret: string) {
  const payload = `${userId}.${plan}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  return `${payload}.${signature}`;
}

export function parseCheckoutReference(value: unknown, secret: string) {
  if (typeof value !== "string") return null;
  const match = value.match(/^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\.(starter|pro|agency)\.([0-9a-f]{32})$/i);
  if (!match || !isBillingPlan(match[2].toLowerCase())) return null;
  const payload = `${match[1].toLowerCase()}.${match[2].toLowerCase()}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 32);
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(match[3], "hex");
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) return null;
  return { userId: match[1].toLowerCase(), plan: match[2].toLowerCase() as BillingPlan };
}
import { createHmac, timingSafeEqual } from "node:crypto";
