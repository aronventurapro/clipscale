import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError, recordEvent } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 2_000)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rate = await consumeRateLimit(auth, "account_deletion_request", 2, 86_400);
  if (!rate.allowed) return jsonError(rate.unavailable ? "Demande temporairement indisponible" : "Une demande récente existe déjà", rate.unavailable ? 503 : 429, auth.requestId);

  const { error } = await auth.supabase.from("support_tickets").insert({
    user_id: auth.user.id,
    workspace_id: null,
    subject: "Suppression définitive du compte",
    message: `Demande RGPD créée depuis les réglages ClipScale le ${new Date().toISOString()}. Vérifier l’identité, supprimer les fichiers actifs, révoquer les sessions puis supprimer le compte et ses données associées.`,
    status: "open",
  });
  if (error) {
    console.error(JSON.stringify({ level: "error", message: "account_deletion_request_failed", code: error.code, requestId: auth.requestId }));
    return jsonError("Demande non enregistrée", 503, auth.requestId);
  }
  await recordEvent(auth, "account_deletion_requested", { channel: "settings" });
  return Response.json({ requested: true, message: "Demande enregistrée. Le support vérifiera l’identité avant suppression définitive.", requestId: auth.requestId }, { status: 202, headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } });
}
