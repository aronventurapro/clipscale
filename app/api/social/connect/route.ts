import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";
import { createOAuthState, isSocialPlatform, socialConfig, socialOAuthReady } from "@/lib/social-oauth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 2_048)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rate = await consumeRateLimit(auth, "social_connect_requested", 12, 600);
  if (!rate.allowed) return jsonError(rate.unavailable ? "Contrôle de sécurité indisponible" : "Trop de tentatives", rate.unavailable ? 503 : 429, auth.requestId);
  const body = await request.json().catch(() => ({})) as { platform?: unknown };
  if (!isSocialPlatform(body.platform)) return jsonError("Réseau non pris en charge", 400, auth.requestId);
  if (!socialOAuthReady(body.platform)) return jsonError(`${body.platform} n’est pas encore configuré côté serveur`, 503, auth.requestId);

  const state = createOAuthState(auth.user.id, body.platform);
  const config = socialConfig(body.platform);
  const redirectUri = `${new URL(request.url).origin}/api/social/callback`;
  const url = new URL(config.authorizeUrl);
  url.searchParams.set(config.clientIdField || "client_id", config.clientId!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", config.scopes.join(body.platform === "tiktok" ? "," : " "));
  url.searchParams.set("state", state);
  if (body.platform === "youtube") {
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
  }
  return Response.json({ url: url.toString() }, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": `clipscale_oauth_state=${encodeURIComponent(state)}; Path=/api/social/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
      "X-Request-Id": auth.requestId,
    },
  });
}
