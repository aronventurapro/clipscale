import { authenticate, bodyWithinLimit, consumeRateLimit, hasAllowedOrigin, jsonError, ownsRender, recordEvent } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[0-9a-f-]{20,80}$/i;

function shotstackConfig() {
  const key = process.env.SHOTSTACK_API_KEY;
  const configuredStage = process.env.SHOTSTACK_STAGE;
  // ClipScale deliberately refuses production rendering until paid usage is explicitly enabled.
  const stage = configuredStage === "stage" ? "stage" : null;
  return key && stage ? { key, stage } : null;
}

export async function POST(request: Request) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 2_048)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rateLimit = await consumeRateLimit(auth, "studio_render_requested", 5, 600);
  if (!rateLimit.allowed) return jsonError(rateLimit.unavailable ? "Contrôle de sécurité indisponible" : "Trop de rendus demandés", rateLimit.unavailable ? 503 : 429, auth.requestId);
  const config = shotstackConfig();
  if (!config) return jsonError("Rendu Shotstack sandbox non configuré", 503, auth.requestId);

  let clipId = "";
  try {
    const body = await request.json() as { clipId?: string };
    clipId = String(body.clipId ?? "");
  } catch {
    return jsonError("Requête invalide", 400, auth.requestId);
  }
  if (!idPattern.test(clipId)) return jsonError("Clip invalide", 400, auth.requestId);

  const { data: clip, error } = await auth.supabase
    .from("studio_clips")
    .select("id,title,start_seconds,end_seconds,video_id,aspect_ratio,caption_style,framing_x,framing_y,edit_style,zoom_enabled,silence_removal,studio_videos!inner(file_path,duration_seconds)")
    .eq("id", clipId)
    .eq("user_id", auth.user.id)
    .single();
  if (error || !clip) return jsonError("Clip introuvable", 404, auth.requestId);

  const source = Array.isArray(clip.studio_videos) ? clip.studio_videos[0] : clip.studio_videos;
  const start = Math.max(0, Number(clip.start_seconds) || 0);
  const sourceDuration = Math.max(0, Number(source?.duration_seconds) || 0);
  const end = Math.min(sourceDuration, Number(clip.end_seconds) || 0);
  const length = Number((end - start).toFixed(2));
  if (!source?.file_path || length < 1 || length > 180) return jsonError("Durée de clip invalide", 400, auth.requestId);

  const { data: signed, error: signedError } = await auth.supabase.storage
    .from("studio-videos")
    .createSignedUrl(source.file_path, 1_800);
  if (signedError || !signed?.signedUrl) return jsonError("Vidéo source inaccessible", 502, auth.requestId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const caption = clip.caption_style && typeof clip.caption_style === "object" ? clip.caption_style as Record<string, unknown> : {};
    const style = String(clip.edit_style || "dynamic");
    const effect = clip.zoom_enabled ? (style === "storytelling" ? "zoomOut" : style === "clean" ? undefined : "zoomIn") : undefined;
    const activeColor = /^#[0-9a-f]{6}$/i.test(String(caption.activeColor || "")) ? String(caption.activeColor) : "#8A6CFF";
    const fontColor = /^#[0-9a-f]{6}$/i.test(String(caption.color || "")) ? String(caption.color) : "#FFFFFF";
    const fontSize = Math.max(24, Math.min(96, Number(caption.fontSize) || (style === "podcast" ? 52 : 64)));
    const videoClip = {
      asset: { type: "video", src: signed.signedUrl, trim: start, volume: 1, transcode: true },
      start: 0, length, fit: "crop", alias: "SOURCE_VIDEO",
      offset: { x: Number(clip.framing_x) || 0, y: Number(clip.framing_y) || 0 },
      transition: style === "clean" ? undefined : { in: "fade", out: "fade" }, effect,
    };
    const captionClip = {
      asset: {
        type: "rich-caption", src: "alias://SOURCE_VIDEO",
        font: { family: "Montserrat", size: fontSize, weight: 800, color: fontColor, opacity: 1 },
        active: { font: { family: "Montserrat", size: fontSize, weight: 900, color: activeColor, opacity: 1 } },
        stroke: { width: 3, color: "#050816", opacity: 0.95 },
        shadow: { offsetX: 2, offsetY: 3, blur: 7, color: "#000000", opacity: 0.8 },
        background: { color: "#050816", opacity: style === "clean" ? 0.35 : 0.12, borderRadius: 14, wrap: true },
        align: { horizontal: "center", vertical: "middle" },
        ...(style === "clean" ? {} : { animation: { style: "highlight", direction: "up" } }),
      },
      start: 0, length, position: "bottom", offset: { x: 0, y: 0.12 },
    };
    const response = await fetch(`https://api.shotstack.io/edit/${config.stage}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": config.key },
      body: JSON.stringify({
        timeline: {
          background: "#050816",
          tracks: [{ clips: [captionClip] }, { clips: [videoClip] }],
        },
        output: { format: "mp4", aspectRatio: ["9:16", "1:1", "16:9", "4:5"].includes(String(clip.aspect_ratio)) ? clip.aspect_ratio : "9:16", resolution: "hd", fps: 30, poster: { capture: 1 }, thumbnail: { capture: 1, scale: 0.35 } },
      }),
      signal: controller.signal,
    });
    const payload = await response.json() as { response?: { id?: string; message?: string }; message?: string };
    if (!response.ok || !payload.response?.id) {
      console.error("shotstack_render_submission_failed", { status: response.status, requestId: auth.requestId });
      return jsonError("Shotstack n’a pas accepté le rendu sandbox", 502, auth.requestId);
    }
    const { data: job } = await auth.supabase.from("processing_jobs").insert({
      user_id: auth.user.id, video_id: clip.video_id, job_type: "render", status: "processing", progress: 10,
      attempts: 1, max_attempts: 3, provider: "shotstack", provider_job_id: payload.response.id,
      input: { clip_id: clipId, edit_style: style, aspect_ratio: clip.aspect_ratio }, started_at: new Date().toISOString(),
    }).select("id").single();
    await recordEvent(auth, "studio_render_created", { render_id: payload.response.id, clip_id: clipId });
    return Response.json({ renderId: payload.response.id, jobId: job?.id, status: "queued", mode: "sandbox", requestId: auth.requestId }, { status: 202, headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } });
  } catch (error) {
    console.error("shotstack_render_submission_error", { requestId: auth.requestId, type: error instanceof Error ? error.name : "unknown" });
    return jsonError(error instanceof Error && error.name === "AbortError" ? "Shotstack ne répond pas" : "Rendu indisponible", 502, auth.requestId);
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rateLimit = await consumeRateLimit(auth, "studio_render_status_requested", 120, 600);
  if (!rateLimit.allowed) return jsonError(rateLimit.unavailable ? "Contrôle de sécurité indisponible" : "Trop de vérifications demandées", rateLimit.unavailable ? 503 : 429, auth.requestId);
  const config = shotstackConfig();
  if (!config) return jsonError("Rendu Shotstack sandbox non configuré", 503, auth.requestId);
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!idPattern.test(id)) return jsonError("Identifiant de rendu invalide", 400, auth.requestId);
  if (!(await ownsRender(auth, id))) return jsonError("Rendu introuvable", 404, auth.requestId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`https://api.shotstack.io/edit/${config.stage}/render/${id}`, {
      headers: { "x-api-key": config.key }, signal: controller.signal, cache: "no-store",
    });
    const payload = await response.json() as { response?: { status?: string; url?: string; error?: string } };
    if (!response.ok || !payload.response?.status) return jsonError("Statut Shotstack indisponible", 502, auth.requestId);
    const status = payload.response.status;
    const progress = status === "done" ? 100 : status === "failed" ? 100 : status === "rendering" ? 65 : status === "fetching" ? 35 : 20;
    await auth.supabase.from("processing_jobs").update({
      status: status === "done" ? "completed" : status === "failed" ? "failed" : "processing", progress,
      output: status === "done" ? { url: payload.response.url } : null,
      error_message: status === "failed" ? "Le rendu Shotstack a échoué" : null,
      completed_at: status === "done" || status === "failed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("user_id", auth.user.id).eq("provider", "shotstack").eq("provider_job_id", id);
    return Response.json({ status, url: status === "done" ? payload.response.url : undefined, error: status === "failed" ? "Le rendu Shotstack a échoué" : undefined, mode: "sandbox", requestId: auth.requestId }, { headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } });
  } catch (error) {
    console.error("shotstack_render_status_error", { requestId: auth.requestId, type: error instanceof Error ? error.name : "unknown" });
    return jsonError("Statut du rendu indisponible", 502, auth.requestId);
  } finally {
    clearTimeout(timeout);
  }
}
