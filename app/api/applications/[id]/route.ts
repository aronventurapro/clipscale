import { cleanText } from "@/lib/marketplace-db";
import { authenticate, bodyWithinLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403); if (!bodyWithinLimit(request, 2_048)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401); const { id } = await params; if (!/^[0-9a-f-]{36}$/i.test(id)) return jsonError("Identifiant invalide", 400, auth.requestId);
  const body = await request.json().catch(() => ({})); const status = cleanText(body.status, 20); if (!["accepted", "rejected", "pending"].includes(status)) return jsonError("Statut invalide", 400, auth.requestId);
  const { data, error } = await auth.supabase.from("marketplace_applications").update({ status, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle(); if (error || !data) return jsonError("Candidature introuvable", 404, auth.requestId); return Response.json({ ok: true });
}
