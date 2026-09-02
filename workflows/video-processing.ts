import { createClient } from "@supabase/supabase-js";
import { FatalError, RetryableError, getStepMetadata, sleep } from "workflow";

type WorkflowInput = { jobId: string; userId: string; accessToken: string };
type ProviderState = { state: "pending" | "ready"; transcriptionUrl?: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rtnkxqoenakebgeuittq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_se9rZq3CDLxGU1T8iAGwdA_HpL-7z6Q";

const clipPlanSchema = {
  type: "object",
  properties: {
    clips: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          start: { type: "number" },
          end: { type: "number" },
          score: { type: "integer", minimum: 0, maximum: 100 },
          retention: { type: "integer", minimum: 0, maximum: 100 },
          reason: { type: "string" },
        },
        required: ["title", "start", "end", "score", "retention", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["clips"],
  additionalProperties: false,
} as const;

function userClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function pollTranscription(input: WorkflowInput): Promise<ProviderState> {
  "use step";
  const { attempt } = getStepMetadata();
  const supabase = userClient(input.accessToken);
  const { data: job, error } = await supabase
    .from("processing_jobs")
    .select("id,video_id,status,provider_job_id,attempts,max_attempts,cancel_requested_at")
    .eq("id", input.jobId)
    .eq("user_id", input.userId)
    .single();
  if (error || !job) throw new FatalError("Traitement introuvable");
  if (job.cancel_requested_at || job.status === "cancelled") throw new FatalError("Traitement annulé");
  if (job.status === "completed") return { state: "ready" };
  const key = process.env.SHOTSTACK_API_KEY;
  const stage = process.env.SHOTSTACK_STAGE === "stage" ? "stage" : null;
  if (!key || !stage || !job.provider_job_id) throw new FatalError("Shotstack sandbox non configuré");

  const response = await fetch(`https://api.shotstack.io/ingest/${stage}/sources/${job.provider_job_id}`, {
    headers: { Accept: "application/json", "x-api-key": key },
    cache: "no-store",
  });
  if (response.status === 429 || response.status >= 500) {
    throw new RetryableError("Shotstack temporairement indisponible", { retryAfter: `${Math.min(60, attempt * 10)}s` });
  }
  const payload = (await response.json()) as {
    data?: { attributes?: { status?: string; outputs?: { transcription?: { status?: string; url?: string } | Array<{ status?: string; url?: string }> } } };
  };
  if (!response.ok) throw new FatalError("Réponse Shotstack invalide");
  const attributes = payload.data?.attributes;
  const raw = attributes?.outputs?.transcription;
  const transcription = Array.isArray(raw) ? raw[0] : raw;
  const status = transcription?.status || attributes?.status || "processing";
  if (status === "failed") throw new FatalError("La transcription Shotstack a échoué");
  const progress = transcription?.url && status === "ready" ? 70 : attributes?.status === "ready" ? 60 : 30;
  await Promise.all([
    supabase.from("processing_jobs").update({ status: "processing", progress, last_heartbeat_at: new Date().toISOString(), lease_expires_at: new Date(Date.now() + 120_000).toISOString(), updated_at: new Date().toISOString() }).eq("id", input.jobId).eq("user_id", input.userId),
    supabase.from("studio_videos").update({ progress, error_message: null, updated_at: new Date().toISOString() }).eq("id", job.video_id).eq("user_id", input.userId),
  ]);
  return transcription?.url && status === "ready" ? { state: "ready", transcriptionUrl: transcription.url } : { state: "pending" };
}
pollTranscription.maxRetries = 3;

async function createClips(input: WorkflowInput, transcriptionUrl: string) {
  "use step";
  const { attempt } = getStepMetadata();
  const supabase = userClient(input.accessToken);
  const { data: job, error } = await supabase
    .from("processing_jobs")
    .select("id,video_id,input,status,output")
    .eq("id", input.jobId)
    .eq("user_id", input.userId)
    .single();
  if (error || !job) throw new FatalError("Traitement introuvable");
  if (job.status === "completed" && job.output) return job.output;
  await supabase.from("processing_jobs").update({ job_type: "analyse", progress: 74, attempts: attempt, last_heartbeat_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", input.jobId).eq("user_id", input.userId);

  const transcriptResponse = await fetch(transcriptionUrl, { cache: "no-store" });
  if (!transcriptResponse.ok) throw new RetryableError("Transcription temporairement inaccessible", { retryAfter: "20s" });
  const transcript = (await transcriptResponse.text()).slice(0, 180_000);
  if (transcript.length < 20) throw new FatalError("Transcription incomplète");
  const openai = process.env.OPENAI_API_KEY;
  if (!openai) throw new FatalError("OpenAI non configuré");
  const duration = Math.max(1, Math.min(21_600, Number(job.input?.duration) || 1));
  const ai = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${openai}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_ANALYSIS_MODEL?.trim() || "gpt-5-mini",
      input: `À partir de cette transcription WebVTT, choisis jusqu’à 5 passages autonomes de 12 à 60 secondes susceptibles de retenir une audience sur ${job.input?.platform || "les réseaux sociaux"}. Respecte les timecodes réels, évite les chevauchements, reste entre 0 et ${duration} secondes. Accroche souhaitée : ${job.input?.hook || "aucune"}.\n\n${transcript}`,
      text: { format: { type: "json_schema", name: "clipscale_clip_plan", strict: true, schema: clipPlanSchema } },
    }),
  });
  if (ai.status === 429 || ai.status >= 500) throw new RetryableError("OpenAI temporairement indisponible", { retryAfter: `${Math.min(90, attempt * 20)}s` });
  const aiPayload = (await ai.json()) as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  const text = aiPayload.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text")?.text;
  if (!ai.ok || !text) throw new FatalError(ai.status === 401 ? "Clé OpenAI invalide" : "Sélection IA indisponible");
  const parsed = JSON.parse(text) as { clips: Array<{ title: string; start: number; end: number; score: number; retention: number; reason: string }> };
  const clips = parsed.clips.filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.start >= 0 && item.end <= duration && item.end - item.start >= 1 && item.end - item.start <= 180).slice(0, 5);
  if (!clips.length) throw new FatalError("Aucun passage exploitable détecté");
  const rows = clips.map((item) => ({ user_id: input.userId, video_id: job.video_id, source_job_id: input.jobId, title: item.title.slice(0, 120), description: item.reason.slice(0, 500), start_seconds: item.start, end_seconds: item.end, status: "Montage", score: item.score, retention: item.retention, transcript: { source: transcriptionUrl }, caption_style: { color: "#FFFFFF", activeColor: "#8A6CFF", fontSize: 64 }, edit_style: "dynamic", aspect_ratio: "9:16" }));
  const { data: created, error: insertError } = await supabase.from("studio_clips").upsert(rows, { onConflict: "source_job_id,start_seconds,end_seconds" }).select("id");
  if (insertError) throw new Error("Création des clips impossible");
  const output = { clipIds: created?.map((item) => item.id) || [], count: created?.length || 0 };
  const now = new Date().toISOString();
  const [jobUpdate, videoUpdate] = await Promise.all([
    supabase.from("processing_jobs").update({ status: "completed", progress: 100, output, error_message: null, failure_code: null, completed_at: now, last_heartbeat_at: now, lease_expires_at: null, updated_at: now }).eq("id", input.jobId).eq("user_id", input.userId),
    supabase.from("studio_videos").update({ transcript: { format: "vtt", url: transcriptionUrl }, progress: 100, status: "analyzed", error_message: null, updated_at: now }).eq("id", job.video_id).eq("user_id", input.userId),
  ]);
  if (jobUpdate.error || videoUpdate.error) throw new Error("Finalisation persistante impossible");
  return output;
}
createClips.maxRetries = 3;

async function markFailed(input: WorkflowInput, message: string) {
  "use step";
  const supabase = userClient(input.accessToken);
  const safeMessage = message.slice(0, 500);
  const now = new Date().toISOString();
  const { data: job } = await supabase.from("processing_jobs").select("video_id,attempts,max_attempts,status").eq("id", input.jobId).eq("user_id", input.userId).single();
  if (!job || job.status === "completed" || job.status === "cancelled") return;
  const attempts = Math.min(Number(job.max_attempts || 3), Number(job.attempts || 0) + 1);
  await supabase.from("processing_jobs").update({ status: "failed", progress: 100, attempts, error_message: safeMessage, failure_code: "workflow_failed", next_attempt_at: new Date(Date.now() + 60_000).toISOString(), lease_expires_at: null, completed_at: now, updated_at: now }).eq("id", input.jobId).eq("user_id", input.userId);
  await Promise.all([
    supabase.from("studio_videos").update({ progress: 100, error_message: safeMessage, updated_at: now }).eq("id", job.video_id).eq("user_id", input.userId),
    supabase.rpc("release_video_minutes", { p_video_id: job.video_id }),
  ]);
}
markFailed.maxRetries = 1;

export async function videoProcessingWorkflow(input: WorkflowInput) {
  "use workflow";
  try {
    let transcriptionUrl = "";
    for (let poll = 0; poll < 120; poll += 1) {
      const state = await pollTranscription(input);
      if (state.state === "ready") {
        transcriptionUrl = state.transcriptionUrl || "";
        break;
      }
      await sleep("10s");
    }
    if (!transcriptionUrl) throw new Error("Délai de transcription dépassé");
    return await createClips(input, transcriptionUrl);
  } catch (error) {
    await markFailed(input, error instanceof Error ? error.message : "Échec du traitement vidéo");
    throw error;
  }
}
