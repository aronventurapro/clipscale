import { createClient } from "@supabase/supabase-js";
import { FatalError, RetryableError, getStepMetadata, sleep } from "workflow";

type RenderInput = { jobId: string; userId: string; accessToken: string };
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rtnkxqoenakebgeuittq.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_se9rZq3CDLxGU1T8iAGwdA_HpL-7z6Q";

function userClient(accessToken: string) {
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } });
}

async function pollRender(input: RenderInput): Promise<{ state: "pending" | "done"; url?: string }> {
  "use step";
  const { attempt } = getStepMetadata();
  const supabase = userClient(input.accessToken);
  const { data: job, error } = await supabase.from("processing_jobs").select("id,clip_id,status,provider_job_id,cancel_requested_at").eq("id", input.jobId).eq("user_id", input.userId).single();
  if (error || !job) throw new FatalError("Rendu introuvable");
  if (job.cancel_requested_at || job.status === "cancelled") throw new FatalError("Rendu annulé");
  if (job.status === "completed") return { state: "done" };
  const key = process.env.SHOTSTACK_API_KEY;
  const stage = process.env.SHOTSTACK_STAGE === "stage" ? "stage" : null;
  if (!key || !stage || !job.provider_job_id) throw new FatalError("Shotstack sandbox non configuré");
  const response = await fetch(`https://api.shotstack.io/edit/${stage}/render/${job.provider_job_id}`, { headers: { "x-api-key": key }, cache: "no-store" });
  if (response.status === 429 || response.status >= 500) throw new RetryableError("Statut Shotstack temporairement indisponible", { retryAfter: `${Math.min(60, attempt * 10)}s` });
  const payload = (await response.json()) as { response?: { status?: string; url?: string; error?: string } };
  if (!response.ok || !payload.response?.status) throw new FatalError("Statut Shotstack invalide");
  const status = payload.response.status;
  if (status === "failed") throw new FatalError(payload.response.error || "Le rendu Shotstack a échoué");
  const progress = status === "done" ? 100 : status === "rendering" ? 70 : status === "fetching" ? 40 : 20;
  const now = new Date().toISOString();
  const output = status === "done" && payload.response.url ? { url: payload.response.url } : null;
  const update = await supabase.from("processing_jobs").update({ status: status === "done" ? "completed" : "processing", progress, output, error_message: null, completed_at: status === "done" ? now : null, last_heartbeat_at: now, lease_expires_at: status === "done" ? null : new Date(Date.now() + 120_000).toISOString(), updated_at: now }).eq("id", input.jobId).eq("user_id", input.userId);
  if (update.error) throw new Error("Progression du rendu non sauvegardée");
  if (status === "done" && job.clip_id && payload.response.url) {
    await supabase.from("studio_clips").update({ render_path: payload.response.url, error_message: null, updated_at: now }).eq("id", job.clip_id).eq("user_id", input.userId);
  }
  return status === "done" ? { state: "done", url: payload.response.url } : { state: "pending" };
}
pollRender.maxRetries = 3;

async function markRenderFailed(input: RenderInput, message: string) {
  "use step";
  const supabase = userClient(input.accessToken);
  const now = new Date().toISOString();
  const { data: job } = await supabase.from("processing_jobs").select("clip_id,status,attempts,max_attempts").eq("id", input.jobId).eq("user_id", input.userId).single();
  if (!job || job.status === "completed" || job.status === "cancelled") return;
  const safe = message.slice(0, 500);
  await Promise.all([
    supabase.from("processing_jobs").update({ status: "failed", progress: 100, attempts: Math.min(Number(job.max_attempts || 3), Number(job.attempts || 0) + 1), error_message: safe, failure_code: "render_workflow_failed", completed_at: now, lease_expires_at: null, next_attempt_at: new Date(Date.now() + 60_000).toISOString(), updated_at: now }).eq("id", input.jobId).eq("user_id", input.userId),
    job.clip_id ? supabase.from("studio_clips").update({ error_message: safe, updated_at: now }).eq("id", job.clip_id).eq("user_id", input.userId) : Promise.resolve(),
  ]);
}
markRenderFailed.maxRetries = 1;

export async function videoRenderWorkflow(input: RenderInput) {
  "use workflow";
  try {
    for (let poll = 0; poll < 120; poll += 1) {
      const state = await pollRender(input);
      if (state.state === "done") return state;
      await sleep("10s");
    }
    throw new Error("Délai de rendu dépassé");
  } catch (error) {
    await markRenderFailed(input, error instanceof Error ? error.message : "Échec du rendu");
    throw error;
  }
}
