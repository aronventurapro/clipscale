import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const analysisSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    verdict: { type: "string" },
    summary: { type: "string" },
    factors: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          detail: { type: "string" },
        },
        required: ["label", "score", "detail"],
        additionalProperties: false,
      },
    },
    improvements: { type: "array", minItems: 2, maxItems: 5, items: { type: "string" } },
    strengths: { type: "array", minItems: 2, maxItems: 4, items: { type: "string" } },
    retention: { type: "integer", minimum: 0, maximum: 100 },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
  },
  required: ["score", "verdict", "summary", "factors", "improvements", "strengths", "retention", "confidence"],
  additionalProperties: false,
} as const;

type AnalyzeBody = {
  platform?: string;
  hook?: string;
  frameDataUrl?: string;
  video?: { duration?: number; width?: number; height?: number; filename?: string };
};

const openAIModels = () => Array.from(new Set([
  process.env.OPENAI_ANALYSIS_MODEL?.trim(),
  "gpt-5-mini",
].filter(Boolean))) as string[];

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 1_600_000)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rateLimit = await consumeRateLimit(auth, "studio_analyze_requested", 10, 600);
  if (!rateLimit.allowed) return jsonError(rateLimit.unavailable ? "Contrôle de sécurité indisponible" : "Trop d’analyses demandées", rateLimit.unavailable ? 503 : 429, auth.requestId);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonError("Moteur OpenAI non configuré", 503, auth.requestId);

  let body: AnalyzeBody;
  try {
    body = await request.json() as AnalyzeBody;
  } catch {
    return jsonError("Requête invalide", 400, auth.requestId);
  }

  const platform = String(body.platform ?? "TikTok").slice(0, 50);
  const hook = String(body.hook ?? "").trim().slice(0, 300);
  const frameDataUrl = String(body.frameDataUrl ?? "");
  const duration = Math.max(0, Math.min(21_600, Number(body.video?.duration) || 0));
  const width = Math.max(0, Math.min(8_192, Number(body.video?.width) || 0));
  const height = Math.max(0, Math.min(8_192, Number(body.video?.height) || 0));

  if (frameDataUrl && !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(frameDataUrl)) {
    return jsonError("Image d’aperçu invalide", 400, auth.requestId);
  }
  if (frameDataUrl.length > 1_500_000) return jsonError("Image d’aperçu trop volumineuse", 413, auth.requestId);

  const prompt = [
    "Tu es directeur éditorial spécialisé dans les vidéos courtes verticales.",
    "Analyse uniquement les éléments réellement fournis. Ne prétends pas avoir vu toute la vidéo : l’image est une capture et les autres données sont des métadonnées.",
    `Plateforme cible : ${platform}.`,
    `Accroche déclarée : ${hook || "non renseignée"}.`,
    `Vidéo : ${duration}s, ${width}x${height}.`,
    "Évalue la clarté visuelle, l’accroche, l’adaptation mobile, la durée et le potentiel de rétention. Réponds en français avec des conseils concrets.",
  ].join("\n");

  const content: Array<Record<string, unknown>> = [{ type: "input_text", text: prompt }];
  if (frameDataUrl) content.push({ type: "input_image", image_url: frameDataUrl, detail: "low" });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    let response: Response | null = null;
    let payload: Record<string, unknown> = {};
    for (const model of openAIModels()) {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          input: [{ role: "user", content }],
          text: { format: { type: "json_schema", name: "clipscale_video_analysis", strict: true, schema: analysisSchema } },
        }),
        signal: controller.signal,
      });
      payload = await response.json() as Record<string, unknown>;
      if (response.ok || ![400, 404].includes(response.status)) break;
    }
    if (!response?.ok) {
      const status = response?.status ?? 502;
      const providerCode = typeof payload.error === "object" && payload.error ? String((payload.error as { code?: unknown }).code || "") : "";
      console.error("openai_analysis_failed", { status, providerCode, requestId: auth.requestId, providerRequestId: response?.headers.get("x-request-id") });
      const message = status === 401 ? "Clé OpenAI invalide" : status === 429 ? "Crédits ou limite OpenAI atteints" : "Analyse OpenAI indisponible";
      return jsonError(message, status === 401 ? 503 : 502, auth.requestId);
    }

    const output = Array.isArray(payload.output) ? payload.output : [];
    const text = output.flatMap((item) => {
      if (!item || typeof item !== "object" || !Array.isArray((item as { content?: unknown[] }).content)) return [];
      return (item as { content: Array<{ type?: string; text?: string }> }).content;
    }).find((item) => item?.type === "output_text")?.text;
    if (!text) return jsonError("Réponse OpenAI incomplète", 502, auth.requestId);

    return Response.json({ analysis: JSON.parse(text), provider: "openai", requestId: auth.requestId }, { headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } });
  } catch (error) {
    console.error("openai_analysis_error", { requestId: auth.requestId, type: error instanceof Error ? error.name : "unknown" });
    return jsonError(error instanceof Error && error.name === "AbortError" ? "Analyse OpenAI expirée" : "Analyse OpenAI indisponible", 502, auth.requestId);
  } finally {
    clearTimeout(timeout);
  }
}
