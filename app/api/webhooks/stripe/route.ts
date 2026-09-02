import { createClient } from "@supabase/supabase-js";
import { BILLING_PLANS, parseCheckoutReference } from "../../../../lib/billing";
import { hasExpectedStripeMode, parseStripeEvent, stripeIdentifier, verifyStripeSignature } from "../../../../lib/stripe-webhook.mjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!webhookSecret || !serviceRole || !supabaseUrl) return new Response("Billing unavailable", { status: 503 });

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody) > 1_048_576) return new Response("Payload too large", { status: 413 });
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) return new Response("Invalid signature", { status: 400 });

  const event = parseStripeEvent(rawBody);
  if (!event) return new Response("Invalid event", { status: 400 });
  if (!hasExpectedStripeMode(event, process.env.STRIPE_LIVE_MODE !== "false")) return new Response("Stripe mode mismatch", { status: 409 });

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: processed } = await admin.from("stripe_webhook_events").select("event_id").eq("event_id", event.id).maybeSingle();
  if (processed) return Response.json({ received: true, duplicate: true });

  const object = event.data?.object ?? {};
  if (event.type === "checkout.session.completed") {
    const reference = parseCheckoutReference(object.client_reference_id, webhookSecret);
    const paymentStatus = object.payment_status;
    if (!reference || object.mode !== "subscription" || object.currency !== "eur" ||
        object.amount_total !== BILLING_PLANS[reference.plan].price * 100 ||
        (paymentStatus !== "paid" && paymentStatus !== "no_payment_required")) {
      return new Response("Checkout not provisionable", { status: 422 });
    }
    const selected = BILLING_PLANS[reference.plan];
    const customerId = stripeIdentifier(object.customer);
    const subscriptionId = stripeIdentifier(object.subscription);
    if (!customerId || !subscriptionId) return new Response("Subscription identifiers missing", { status: 422 });

    const { error } = await admin.from("user_subscriptions").upsert({
      user_id: reference.userId,
      plan: reference.plan,
      status: "active",
      monthly_minutes: selected.sourceMinutes,
      monthly_rendered_minutes: selected.renderedMinutes,
      member_limit: selected.members,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) {
      console.error("stripe_subscription_upsert_failed", { eventId: event.id, code: error.code });
      return new Response("Provisioning failed", { status: 500 });
    }
  } else if (["customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    const subscriptionId = stripeIdentifier(object.id);
    if (subscriptionId) {
      const stripeStatus = typeof object.status === "string" ? object.status : "inactive";
      const active = event.type !== "customer.subscription.deleted" && ["active", "trialing"].includes(stripeStatus);
      const { error } = await admin.from("user_subscriptions").update({
        status: active ? stripeStatus : "inactive",
        cancel_at_period_end: Boolean(object.cancel_at_period_end),
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", subscriptionId);
      if (error) return new Response("Subscription update failed", { status: 500 });
    }
  } else if (event.type === "invoice.payment_failed") {
    const subscriptionId = stripeIdentifier(object.subscription);
    if (subscriptionId) {
      const { error } = await admin.from("user_subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
      if (error) return new Response("Payment state update failed", { status: 500 });
    }
  } else if (event.type === "invoice.paid") {
    const subscriptionId = stripeIdentifier(object.subscription);
    if (subscriptionId) {
      const { error } = await admin.from("user_subscriptions").update({ status: "active", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
      if (error) return new Response("Payment state update failed", { status: 500 });
    }
  }

  const { error: eventError } = await admin.from("stripe_webhook_events").insert({ event_id: event.id, event_type: event.type });
  if (eventError && eventError.code !== "23505") return new Response("Event persistence failed", { status: 500 });
  return Response.json({ received: true });
}
