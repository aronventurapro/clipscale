import { encryptSocialToken, socialConfig, verifyOAuthState } from "@/lib/social-oauth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

function done(origin: string, status: "connected" | "error", platform?: string) {
  const url = new URL("/", origin);
  url.searchParams.set("social", status);
  if (platform) url.searchParams.set("platform", platform);
  return new Response(null, { status: 303, headers: { Location: url.toString(), "Cache-Control": "no-store", "Set-Cookie": "clipscale_oauth_state=; Path=/api/social/callback; HttpOnly; Secure; SameSite=Lax; Max-Age=0" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stateRaw = url.searchParams.get("state") || "";
  const cookieState = request.headers.get("cookie")?.match(/(?:^|; )clipscale_oauth_state=([^;]+)/)?.[1];
  const state = verifyOAuthState(stateRaw);
  if (!state || !cookieState || decodeURIComponent(cookieState) !== stateRaw || url.searchParams.get("error")) return done(url.origin, "error", state?.platform);
  const code = url.searchParams.get("code");
  const admin = supabaseAdmin();
  if (!code || !admin) return done(url.origin, "error", state.platform);
  const config = socialConfig(state.platform);
  const body = new URLSearchParams({
    [config.clientIdField || "client_id"]: config.clientId!,
    client_secret: config.clientSecret!, code,
    redirect_uri: `${url.origin}/api/social/callback`, grant_type: "authorization_code",
  });
  const tokenResponse = await fetch(config.tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, cache: "no-store" });
  const token = await tokenResponse.json().catch(() => ({})) as { access_token?: string; refresh_token?: string; expires_in?: number; open_id?: string; scope?: string };
  if (!tokenResponse.ok || !token.access_token) {
    console.error("social_oauth_token_exchange_failed", { platform: state.platform, status: tokenResponse.status });
    return done(url.origin, "error", state.platform);
  }
  const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000).toISOString() : null;
  const platforms = state.platform === "instagram" || state.platform === "facebook" ? ["instagram", "facebook"] : [state.platform];
  const rows = platforms.map((platform) => ({
    user_id: state.userId, platform, provider_account_id: token.open_id || null,
    access_token_encrypted: encryptSocialToken(token.access_token!),
    refresh_token_encrypted: token.refresh_token ? encryptSocialToken(token.refresh_token) : null,
    scopes: token.scope ? token.scope.split(/[ ,]+/).filter(Boolean) : config.scopes,
    expires_at: expiresAt, status: "connected", updated_at: new Date().toISOString(),
  }));
  const { error } = await admin.from("social_connections").upsert(rows, { onConflict: "user_id,platform" });
  return done(url.origin, error ? "error" : "connected", state.platform);
}
