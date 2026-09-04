import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rtnkxqoenakebgeuittq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_se9rZq3CDLxGU1T8iAGwdA_HpL-7z6Q";

export type AuthenticatedRequest = { supabase: SupabaseClient; user: User; requestId: string };

export function jsonError(message: string, status: number, requestId?: string) {
  return Response.json(
    { error: message, ...(requestId ? { requestId } : {}) },
    { status, headers: { "Cache-Control": "no-store", ...(requestId ? { "X-Request-Id": requestId } : {}) } },
  );
}

export function requestId(request: Request) {
  const incoming = request.headers.get("x-request-id");
  return incoming && /^[A-Za-z0-9_-]{8,80}$/.test(incoming) ? incoming : crypto.randomUUID();
}

export function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const allowed = new Set([
    new URL(request.url).origin,
    "https://clipscale-kappa.vercel.app",
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000", "http://localhost:5173"] : []),
  ]);
  return allowed.has(origin);
}

export function bodyWithinLimit(request: Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return true;
  const length = Number(raw);
  return Number.isFinite(length) && length >= 0 && length <= maxBytes;
}

export async function authenticate(request: Request): Promise<AuthenticatedRequest | null> {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token || token.length > 4096) return null;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error || !user ? null : { supabase, user, requestId: requestId(request) };
}

export async function hasCommercialAccess(auth: AuthenticatedRequest) {
  const email = auth.user.email?.trim().toLowerCase();
  const [{ data: subscription, error: subscriptionError }, { data: grant, error: grantError }] = await Promise.all([
    auth.supabase.from("user_subscriptions").select("status").eq("user_id", auth.user.id).maybeSingle(),
    email
      ? auth.supabase.from("access_grants").select("active").eq("email", email).eq("active", true).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  if (subscriptionError || grantError) {
    console.error("commercial_access_lookup_failed", { requestId: auth.requestId });
    return { allowed: false, unavailable: true };
  }
  return {
    allowed: Boolean(subscription && ["active", "trialing"].includes(String(subscription.status))) || Boolean(grant?.active),
    unavailable: false,
  };
}

export async function consumeRateLimit(
  auth: AuthenticatedRequest,
  action: string,
  maximum: number,
  windowSeconds: number,
  metadata: Record<string, string | number | boolean> = {},
) {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error: countError } = await auth.supabase
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("event_type", action)
    .gte("created_at", since);
  if (countError) {
    console.error("security_rate_limit_lookup_failed", { requestId: auth.requestId, action, code: countError.code });
    return { allowed: false, unavailable: true };
  }
  if ((count ?? 0) >= maximum) return { allowed: false, unavailable: false };
  const { error } = await auth.supabase.from("security_events").insert({
    user_id: auth.user.id,
    event_type: action,
    request_id: auth.requestId,
    metadata,
  });
  if (error) {
    console.error("security_event_insert_failed", { requestId: auth.requestId, action, code: error.code });
    return { allowed: false, unavailable: true };
  }
  return { allowed: true, unavailable: false };
}

export async function ownsRender(auth: AuthenticatedRequest, renderId: string) {
  const { count, error } = await auth.supabase
    .from("security_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id)
    .eq("event_type", "studio_render_created")
    .contains("metadata", { render_id: renderId });
  return !error && (count ?? 0) > 0;
}

export async function recordEvent(auth: AuthenticatedRequest, eventType: string, metadata: Record<string, string | number | boolean>) {
  const { error } = await auth.supabase.from("security_events").insert({
    user_id: auth.user.id,
    event_type: eventType,
    request_id: auth.requestId,
    metadata,
  });
  if (error) console.error("security_event_insert_failed", { requestId: auth.requestId, eventType, code: error.code });
}
