import { cleanText, validUrl } from "@/lib/marketplace-db";
import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403); if (!bodyWithinLimit(request, 16_384)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const limited = await consumeRateLimit(auth, "marketplace_application_created", 25, 3600); if (!limited.allowed) return jsonError("Trop de candidatures envoyées", 429, auth.requestId);
  const body = await request.json().catch(() => ({})); const offerId = cleanText(body.offerId, 80), displayName = cleanText(body.displayName, 70), bio = cleanText(body.bio, 500), skills = cleanText(body.skills, 200), message = cleanText(body.message, 900), portfolioUrl = cleanText(body.portfolioUrl, 400);
  if (!/^[0-9a-f-]{36}$/i.test(offerId) || displayName.length < 2 || bio.length < 20 || skills.length < 2 || message.length < 20 || !validUrl(portfolioUrl)) return jsonError("Profil, message ou portfolio invalide", 400, auth.requestId);
  const { error: profileError } = await auth.supabase.from("marketplace_profiles").upsert({ user_id: auth.user.id, display_name: displayName, bio, skills, portfolio_url: portfolioUrl, updated_at: new Date().toISOString() }); if (profileError) return jsonError("Profil non enregistré", 503, auth.requestId);
  const { error } = await auth.supabase.from("marketplace_applications").insert({ offer_id: offerId, applicant_id: auth.user.id, message, portfolio_url: portfolioUrl }); if (error?.code === "23505") return jsonError("Vous avez déjà candidaté à cette offre", 409, auth.requestId); if (error) return jsonError("Candidature non enregistrée", 503, auth.requestId); return Response.json({ ok: true }, { status: 201 });
}
