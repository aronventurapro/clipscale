import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f-]{36}$/i;
const clipPlanSchema = {
  type: "object",
  properties: { clips: { type: "array", minItems: 1, maxItems: 5, items: { type: "object", properties: {
    title: { type: "string" }, start: { type: "number" }, end: { type: "number" }, score: { type: "integer", minimum: 0, maximum: 100 }, retention: { type: "integer", minimum: 0, maximum: 100 }, reason: { type: "string" },
  }, required: ["title", "start", "end", "score", "retention", "reason"], additionalProperties: false } } },
  required: ["clips"], additionalProperties: false,
} as const;

function providers() {
  const shotstack = process.env.SHOTSTACK_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  return shotstack && openai && process.env.SHOTSTACK_STAGE === "stage" ? { shotstack, openai, stage: "stage" } : null;
}

async function startIngest(sourceUrl: string, key: string, stage: string) {
  const response = await fetch(`https://api.shotstack.io/ingest/${stage}/sources`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": key }, body: JSON.stringify({ url: sourceUrl, outputs: { transcription: { format: "vtt" } }, destinations: { provider: "shotstack", exclude: false } }) });
  const payload = await response.json() as { data?: { id?: string }; message?: string };
  return response.ok && payload.data?.id ? payload.data.id : null;
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 4_096)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const config = providers(); if (!config) return jsonError("Pipeline sandbox non configuré", 503, auth.requestId);
  const limited = await consumeRateLimit(auth, "studio_process_requested", 4, 600); if (!limited.allowed) return jsonError("Trop de traitements demandés", 429, auth.requestId);
  const body = await request.json().catch(() => ({})) as { videoId?: string; retryJobId?: string };

  if (body.retryJobId) {
    if (!uuid.test(body.retryJobId)) return jsonError("Traitement invalide", 400, auth.requestId);
    const { data: failed } = await auth.supabase.from("processing_jobs").select("id,video_id,attempts,max_attempts").eq("id", body.retryJobId).eq("user_id", auth.user.id).eq("status", "failed").single();
    if (!failed || failed.attempts >= failed.max_attempts) return jsonError("Ce traitement ne peut plus être relancé", 409, auth.requestId);
    body.videoId = failed.video_id;
  }
  const videoId = String(body.videoId || ""); if (!uuid.test(videoId)) return jsonError("Vidéo invalide", 400, auth.requestId);
  const { data: video } = await auth.supabase.from("studio_videos").select("id,file_path,duration_seconds,hook,platform").eq("id", videoId).eq("user_id", auth.user.id).single();
  if (!video?.file_path) return jsonError("Vidéo introuvable", 404, auth.requestId);
  const { data: signed } = await auth.supabase.storage.from("studio-videos").createSignedUrl(video.file_path, 1_800);
  if (!signed?.signedUrl) return jsonError("Source inaccessible", 502, auth.requestId);
  const sourceId = await startIngest(signed.signedUrl, config.shotstack, config.stage);
  if (!sourceId) return jsonError("Shotstack n’a pas accepté la transcription", 502, auth.requestId);
  const { data: job, error } = await auth.supabase.from("processing_jobs").insert({ user_id: auth.user.id, video_id: videoId, job_type: "transcribe", status: "processing", progress: 5, attempts: 1, max_attempts: 3, provider: "shotstack", provider_job_id: sourceId, input: { duration: video.duration_seconds, hook: video.hook, platform: video.platform }, started_at: new Date().toISOString() }).select("id").single();
  if (error || !job) return jsonError("Traitement non enregistré", 502, auth.requestId);
  await auth.supabase.from("studio_videos").update({ progress: 5, error_message: null, updated_at: new Date().toISOString() }).eq("id", videoId).eq("user_id", auth.user.id);
  return Response.json({ jobId: job.id, status: "processing", progress: 5, requestId: auth.requestId }, { status: 202, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const config = providers(); if (!config) return jsonError("Pipeline sandbox non configuré", 503, auth.requestId);
  const jobId = new URL(request.url).searchParams.get("jobId") || ""; if (!uuid.test(jobId)) return jsonError("Traitement invalide", 400, auth.requestId);
  const { data: job } = await auth.supabase.from("processing_jobs").select("*").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (!job) return jsonError("Traitement introuvable", 404, auth.requestId);
  if (job.status === "completed" || job.status === "failed") return Response.json({ jobId, status: job.status, progress: job.progress, output: job.output, error: job.error_message }, { headers: { "Cache-Control": "no-store" } });

  const response = await fetch(`https://api.shotstack.io/ingest/${config.stage}/sources/${job.provider_job_id}`, { headers: { Accept: "application/json", "x-api-key": config.shotstack }, cache: "no-store" });
  const payload = await response.json() as { data?: { attributes?: { status?: string; outputs?: { transcription?: { status?: string; url?: string } | Array<{ status?: string; url?: string }> } } } };
  const attributes = payload.data?.attributes;
  const rawTranscription = attributes?.outputs?.transcription;
  const transcription = Array.isArray(rawTranscription) ? rawTranscription[0] : rawTranscription;
  const providerStatus = transcription?.status || attributes?.status || "processing";
  if (!response.ok || providerStatus === "failed") {
    await auth.supabase.from("processing_jobs").update({ status: "failed", progress: 100, error_message: "La transcription a échoué", next_attempt_at: new Date(Date.now() + 30_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", auth.user.id);
    return jsonError("La transcription a échoué. Vous pouvez la relancer.", 502, auth.requestId);
  }
  if (!transcription?.url || providerStatus !== "ready") {
    const progress = attributes?.status === "ready" ? 65 : 35;
    await auth.supabase.from("processing_jobs").update({ progress, updated_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", auth.user.id);
    return Response.json({ jobId, status: "processing", progress }, { headers: { "Cache-Control": "no-store" } });
  }

  const transcriptResponse = await fetch(transcription.url, { cache: "no-store" });
  const transcript = (await transcriptResponse.text()).slice(0, 180_000);
  if (!transcriptResponse.ok || transcript.length < 20) return jsonError("Transcription incomplète", 502, auth.requestId);
  await auth.supabase.from("processing_jobs").update({ progress: 72, job_type: "analyse", updated_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", auth.user.id);
  const duration = Math.max(1, Math.min(21_600, Number(job.input?.duration) || 1));
  const ai = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${config.openai}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_ANALYSIS_MODEL?.trim() || "gpt-5-mini", input: `À partir de cette transcription WebVTT, choisis jusqu’à 5 passages autonomes de 12 à 60 secondes susceptibles de retenir une audience sur ${job.input?.platform || "les réseaux sociaux"}. Respecte les timecodes réels, évite les chevauchements, reste entre 0 et ${duration} secondes. Accroche souhaitée : ${job.input?.hook || "aucune"}.\n\n${transcript}`, text: { format: { type: "json_schema", name: "clipscale_clip_plan", strict: true, schema: clipPlanSchema } } }) });
  const aiPayload = await ai.json() as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = aiPayload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!ai.ok || !text) {
    const message = ai.status === 401 ? "Clé OpenAI invalide" : ai.status === 429 ? "Crédits ou limite OpenAI atteints" : "Sélection IA indisponible";
    await auth.supabase.from("processing_jobs").update({ status: "failed", progress: 100, error_message: message, next_attempt_at: new Date(Date.now() + 60_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", auth.user.id);
    return jsonError(message, 502, auth.requestId);
  }
  const parsed = JSON.parse(text) as { clips: Array<{ title: string; start: number; end: number; score: number; retention: number; reason: string }> };
  const clips = parsed.clips.filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.start >= 0 && item.end <= duration && item.end - item.start >= 1 && item.end - item.start <= 180).slice(0, 5);
  if (!clips.length) return jsonError("Aucun passage exploitable détecté", 422, auth.requestId);
  const rows = clips.map((item) => ({ user_id: auth.user.id, video_id: job.video_id, title: item.title.slice(0, 120), description: item.reason.slice(0, 500), start_seconds: item.start, end_seconds: item.end, status: "Montage", score: item.score, retention: item.retention, transcript: { source: transcription.url }, caption_style: { color: "#FFFFFF", activeColor: "#8A6CFF", fontSize: 64 }, edit_style: "dynamic", aspect_ratio: "9:16" }));
  const { data: created, error: insertError } = await auth.supabase.from("studio_clips").insert(rows).select("id");
  if (insertError) return jsonError("Création des clips impossible", 502, auth.requestId);
  const output = { clipIds: created?.map((item) => item.id) || [], count: created?.length || 0 };
  await Promise.all([
    auth.supabase.from("processing_jobs").update({ status: "completed", progress: 100, output, completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId).eq("user_id", auth.user.id),
    auth.supabase.from("studio_videos").update({ transcript: { format: "vtt", url: transcription.url }, progress: 100, status: "analyzed", updated_at: new Date().toISOString() }).eq("id", job.video_id).eq("user_id", auth.user.id),
  ]);
  return Response.json({ jobId, status: "completed", progress: 100, output }, { headers: { "Cache-Control": "no-store" } });
}
