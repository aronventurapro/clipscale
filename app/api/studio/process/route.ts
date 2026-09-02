import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";
import { videoProcessingWorkflow } from "@/workflows/video-processing";
import { start } from "workflow/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const uuid = /^[0-9a-f-]{36}$/i;

function providers() {
  const shotstack = process.env.SHOTSTACK_API_KEY;
  const openai = process.env.OPENAI_API_KEY;
  return shotstack && openai && process.env.SHOTSTACK_STAGE === "stage" ? { shotstack, stage: "stage" } : null;
}

async function startIngest(sourceUrl: string, key: string, stage: string) {
  const response = await fetch(`https://api.shotstack.io/ingest/${stage}/sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", "x-api-key": key },
    body: JSON.stringify({ url: sourceUrl, outputs: { transcription: { format: "vtt" } }, destinations: { provider: "shotstack", exclude: false } }),
  });
  const payload = (await response.json()) as { data?: { id?: string } };
  return response.ok && payload.data?.id ? payload.data.id : null;
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 4_096)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const config = providers();
  if (!config) return jsonError("Pipeline sandbox non configuré", 503, auth.requestId);
  const limited = await consumeRateLimit(auth, "studio_process_requested", 4, 600);
  if (!limited.allowed) return jsonError("Trop de traitements demandés", 429, auth.requestId);
  const body = (await request.json().catch(() => ({}))) as { videoId?: string; retryJobId?: string };

  let retryJob: { id: string; video_id: string; attempts: number; max_attempts: number } | null = null;
  if (body.retryJobId) {
    if (!uuid.test(body.retryJobId)) return jsonError("Traitement invalide", 400, auth.requestId);
    const { data } = await auth.supabase
      .from("processing_jobs")
      .select("id,video_id,attempts,max_attempts")
      .eq("id", body.retryJobId)
      .eq("user_id", auth.user.id)
      .eq("status", "failed")
      .single();
    if (!data || data.attempts >= data.max_attempts) return jsonError("Ce traitement ne peut plus être relancé", 409, auth.requestId);
    retryJob = data;
    body.videoId = data.video_id;
  }

  const videoId = String(body.videoId || "");
  if (!uuid.test(videoId)) return jsonError("Vidéo invalide", 400, auth.requestId);
  if (!retryJob) {
    const { data: active } = await auth.supabase
      .from("processing_jobs")
      .select("id,status,progress")
      .eq("video_id", videoId)
      .eq("user_id", auth.user.id)
      .in("job_type", ["transcribe", "analyse"])
      .in("status", ["queued", "processing"])
      .maybeSingle();
    if (active) return Response.json({ jobId: active.id, status: active.status, progress: active.progress, duplicate: true, requestId: auth.requestId }, { status: 202, headers: { "Cache-Control": "no-store" } });
  }

  const { data: video } = await auth.supabase
    .from("studio_videos")
    .select("id,file_path,duration_seconds,hook,platform")
    .eq("id", videoId)
    .eq("user_id", auth.user.id)
    .single();
  if (!video?.file_path) return jsonError("Vidéo introuvable", 404, auth.requestId);
  const reservedMinutes = Math.max(1, Math.ceil(Number(video.duration_seconds || 0) / 60));
  const { data: quota, error: quotaError } = await auth.supabase.rpc("reserve_video_minutes", { p_video_id: videoId, p_minutes: reservedMinutes }).maybeSingle();
  if (quotaError) {
    const quotaExceeded = quotaError.message.includes("quota_exceeded");
    const inactive = quotaError.message.includes("subscription_inactive");
    return jsonError(quotaExceeded ? "Quota mensuel atteint" : inactive ? "Accès au traitement suspendu" : "Contrôle des crédits indisponible", quotaExceeded ? 402 : 503, auth.requestId);
  }
  const { data: signed } = await auth.supabase.storage.from("studio-videos").createSignedUrl(video.file_path, 1_800);
  if (!signed?.signedUrl) {
    await auth.supabase.rpc("release_video_minutes", { p_video_id: videoId });
    return jsonError("Source inaccessible", 502, auth.requestId);
  }
  const sourceId = await startIngest(signed.signedUrl, config.shotstack, config.stage);
  if (!sourceId) {
    await auth.supabase.rpc("release_video_minutes", { p_video_id: videoId });
    return jsonError("Shotstack n’a pas accepté la transcription", 502, auth.requestId);
  }

  const now = new Date().toISOString();
  const values = {
    user_id: auth.user.id,
    video_id: videoId,
    job_type: "transcribe",
    status: "processing",
    progress: 5,
    attempts: retryJob ? retryJob.attempts + 1 : 1,
    max_attempts: 3,
    provider: "shotstack",
    provider_job_id: sourceId,
    input: { duration: video.duration_seconds, hook: video.hook, platform: video.platform },
    error_message: null,
    failure_code: null,
    completed_at: null,
    cancel_requested_at: null,
    started_at: now,
    last_heartbeat_at: now,
    lease_expires_at: new Date(Date.now() + 120_000).toISOString(),
    updated_at: now,
  };
  const operation = retryJob
    ? auth.supabase.from("processing_jobs").update(values).eq("id", retryJob.id).eq("user_id", auth.user.id).select("id").single()
    : auth.supabase.from("processing_jobs").insert(values).select("id").single();
  const { data: job, error } = await operation;
  if (error || !job) {
    await auth.supabase.rpc("release_video_minutes", { p_video_id: videoId });
    return jsonError(error?.code === "23505" ? "Un traitement est déjà actif pour cette vidéo" : "Traitement non enregistré", error?.code === "23505" ? 409 : 502, auth.requestId);
  }

  try {
    const run = await start(videoProcessingWorkflow, [{ jobId: job.id, userId: auth.user.id, accessToken }], { deploymentId: "latest" });
    await Promise.all([
      auth.supabase.from("processing_jobs").update({ workflow_run_id: run.runId, updated_at: new Date().toISOString() }).eq("id", job.id).eq("user_id", auth.user.id),
      auth.supabase.from("studio_videos").update({ progress: 5, error_message: null, updated_at: new Date().toISOString() }).eq("id", videoId).eq("user_id", auth.user.id),
    ]);
    return Response.json({ jobId: job.id, workflowRunId: run.runId, status: "processing", progress: 5, autonomous: true, quota, requestId: auth.requestId }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (workflowError) {
    console.error("video_workflow_start_failed", { requestId: auth.requestId, jobId: job.id, type: workflowError instanceof Error ? workflowError.name : "unknown" });
    await auth.supabase.from("processing_jobs").update({ status: "failed", progress: 100, error_message: "Orchestration indisponible", failure_code: "workflow_start_failed", completed_at: new Date().toISOString(), lease_expires_at: null }).eq("id", job.id).eq("user_id", auth.user.id);
    await auth.supabase.rpc("release_video_minutes", { p_video_id: videoId });
    return jsonError("Le traitement autonome n’a pas pu démarrer", 503, auth.requestId);
  }
}

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const jobId = new URL(request.url).searchParams.get("jobId") || "";
  if (!uuid.test(jobId)) return jsonError("Traitement invalide", 400, auth.requestId);
  const { data: job } = await auth.supabase
    .from("processing_jobs")
    .select("id,status,progress,output,error_message,attempts,max_attempts,workflow_run_id,last_heartbeat_at")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .single();
  if (!job) return jsonError("Traitement introuvable", 404, auth.requestId);
  return Response.json({ jobId, status: job.status, progress: job.progress, output: job.output, error: job.error_message, attempts: job.attempts, maxAttempts: job.max_attempts, workflowRunId: job.workflow_run_id, lastHeartbeatAt: job.last_heartbeat_at, autonomous: true }, { headers: { "Cache-Control": "no-store" } });
}
