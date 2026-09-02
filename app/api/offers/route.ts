import { cleanText } from "@/lib/marketplace-db";
import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403); if (!bodyWithinLimit(request, 16_384)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const limited = await consumeRateLimit(auth, "marketplace_offer_created", 12, 3600); if (!limited.allowed) return jsonError("Trop de missions créées", 429, auth.requestId);
  const body = await request.json().catch(() => ({})); const title = cleanText(body.title, 90), clientName = cleanText(body.clientName, 70), description = cleanText(body.description, 1200), platforms = cleanText(body.platforms, 120); const budgetCents = Math.round(Number(body.budget) * 100), cpmCents = Math.round(Number(body.cpm || 0) * 100);
  if (title.length < 5 || clientName.length < 2 || description.length < 30 || !platforms || !Number.isFinite(budgetCents) || budgetCents < 1000) return jsonError("Complétez correctement tous les champs", 400, auth.requestId);
  const { data, error } = await auth.supabase.from("marketplace_offers").insert({ owner_id: auth.user.id, title, client_name: clientName, description, platforms, budget_cents: budgetCents, cpm_cents: Math.max(0, cpmCents) }).select("id").single();
  if (error || !data) return jsonError("Mission non enregistrée", 503, auth.requestId); return Response.json({ ok: true, id: data.id }, { status: 201 });
}
