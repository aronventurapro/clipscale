import { authenticate, hasAllowedOrigin, jsonError } from "@/lib/server-security";
import { isSocialPlatform, socialOAuthReady } from "@/lib/social-oauth";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const admin = supabaseAdmin();
  if (!admin) return jsonError("Service indisponible", 503, auth.requestId);
  const { data, error } = await admin.from("social_connections").select("platform,status,provider_account_name,expires_at,updated_at").eq("user_id", auth.user.id);
  if (error) return jsonError("Connexions indisponibles", 503, auth.requestId);
  const platforms = ["youtube", "instagram", "facebook", "tiktok", "linkedin"] as const;
  return Response.json({ connections: platforms.map((platform) => {
    const connection = data?.find((row) => row.platform === platform);
    return {
      platform,
      configured: socialOAuthReady(platform),
      status: connection?.status || "disconnected",
      provider_account_name: connection?.provider_account_name || null,
      expires_at: connection?.expires_at || null,
      updated_at: connection?.updated_at || null,
    };
  }) }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const platform = new URL(request.url).searchParams.get("platform");
  if (!isSocialPlatform(platform)) return jsonError("Réseau invalide", 400, auth.requestId);
  const admin = supabaseAdmin();
  if (!admin) return jsonError("Service indisponible", 503, auth.requestId);
  const { error } = await admin.from("social_connections").delete().eq("user_id", auth.user.id).eq("platform", platform);
  if (error) return jsonError("Déconnexion impossible", 503, auth.requestId);
  return Response.json({ disconnected: true, platform }, { headers: { "Cache-Control": "no-store" } });
}
