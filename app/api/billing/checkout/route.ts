import { BILLING_PLANS, billingIsReady, checkoutReference, isBillingPlan } from "../../../../lib/billing";
import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "../../../../lib/server-security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  if (!hasAllowedOrigin(request)) return jsonError("Origine refusée", 403, auth.requestId);
  if (!bodyWithinLimit(request, 2_048)) return jsonError("Requête trop volumineuse", 413, auth.requestId);
  if (!billingIsReady()) return jsonError("Les paiements ne sont pas encore activés", 503, auth.requestId);

  const rateLimit = await consumeRateLimit(auth, "billing_checkout_requested", 8, 600);
  if (!rateLimit.allowed) return jsonError(rateLimit.unavailable ? "Service temporairement indisponible" : "Trop de tentatives", rateLimit.unavailable ? 503 : 429, auth.requestId);

  const { data: currentSubscription, error: subscriptionError } = await auth.supabase
    .from("user_subscriptions")
    .select("status")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (subscriptionError) return jsonError("Vérification de l’abonnement indisponible", 503, auth.requestId);
  if (currentSubscription && ["active", "trialing"].includes(currentSubscription.status)) {
    return jsonError("Un abonnement est déjà actif sur ce compte", 409, auth.requestId);
  }

  let body: { plan?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError("Requête invalide", 400, auth.requestId);
  }
  if (!isBillingPlan(body.plan)) return jsonError("Forfait invalide", 400, auth.requestId);

  const url = new URL(BILLING_PLANS[body.plan].paymentLink);
  url.searchParams.set("client_reference_id", checkoutReference(auth.user.id, body.plan, process.env.STRIPE_WEBHOOK_SECRET!));
  if (auth.user.email) url.searchParams.set("prefilled_email", auth.user.email);
  return Response.json(
    { url: url.toString() },
    { headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } },
  );
}
