import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStripeSignature(rawBody, signature, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  const fields = signature.split(",").map((part) => part.split("=", 2));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return signatures.some((value) => {
    if (!/^[0-9a-f]{64}$/i.test(value)) return false;
    const actual = Buffer.from(value, "hex");
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  });
}

export function parseStripeEvent(rawBody) {
  try {
    const event = JSON.parse(rawBody);
    if (!event || typeof event !== "object") return null;
    if (typeof event.id !== "string" || !/^evt_[A-Za-z0-9]+$/.test(event.id)) return null;
    if (typeof event.type !== "string" || !event.data || typeof event.data.object !== "object") return null;
    return event;
  } catch {
    return null;
  }
}

export function hasExpectedStripeMode(event, expectedLiveMode) {
  return event.livemode === expectedLiveMode;
}

export function stripeIdentifier(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof value.id === "string") return value.id;
  return null;
}
