import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { hasExpectedStripeMode, parseStripeEvent, stripeIdentifier, verifyStripeSignature } from "../lib/stripe-webhook.mjs";

const secret = "whsec_clipscale_test_only";
const timestamp = 1_788_345_000;
const event = { id: "evt_testClipScale01", type: "checkout.session.completed", livemode: false, data: { object: { mode: "subscription", currency: "eur", amount_total: 3900 } } };
const rawBody = JSON.stringify(event);
const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
const header = `t=${timestamp},v1=${signature}`;

test("accepts a valid signed Stripe test event", () => {
  assert.equal(verifyStripeSignature(rawBody, header, secret, timestamp), true);
  const parsed = parseStripeEvent(rawBody);
  assert.ok(parsed);
  assert.equal(hasExpectedStripeMode(parsed, false), true);
  assert.equal(hasExpectedStripeMode(parsed, true), false);
});

test("rejects tampered, expired and malformed Stripe events", () => {
  assert.equal(verifyStripeSignature(`${rawBody} `, header, secret, timestamp), false);
  assert.equal(verifyStripeSignature(rawBody, header, secret, timestamp + 301), false);
  assert.equal(parseStripeEvent("{}"), null);
  assert.equal(parseStripeEvent("not-json"), null);
});

test("normalizes Stripe identifiers safely", () => {
  assert.equal(stripeIdentifier("sub_123"), "sub_123");
  assert.equal(stripeIdentifier({ id: "cus_123" }), "cus_123");
  assert.equal(stripeIdentifier({}), null);
});
