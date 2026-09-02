import { authenticate, bodyWithinLimit, hasAllowedOrigin, jsonError } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const idPattern = /^[0-9a-f-]{36}$/i;
const styles = new Set(["clean", "podcast", "storytelling", "dynamic", "premium"]);
const ratios = new Set(["9:16", "1:1", "16:9", "4:5"]);

type EditBody = {
  version?: number;
  title?: string;
  start?: number;
  end?: number;
  framingX?: number;
  framingY?: number;
  style?: string;
  aspectRatio?: string;
  zoomEnabled?: boolean;
  silenceRemoval?: boolean;
  captionStyle?: Record<string, unknown>;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  if (!bodyWithinLimit(request, 16_384)) return jsonError("Requête trop volumineuse", 413);
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const { id } = await params;
  if (!idPattern.test(id)) return jsonError("Clip invalide", 400, auth.requestId);

  let body: EditBody;
  try { body = await request.json() as EditBody; } catch { return jsonError("Requête invalide", 400, auth.requestId); }
  const { data: current, error } = await auth.supabase.from("studio_clips")
    .select("id,title,start_seconds,end_seconds,edit_version,framing_x,framing_y,edit_style,aspect_ratio,zoom_enabled,silence_removal,caption_style,edit_history,studio_videos!inner(duration_seconds)")
    .eq("id", id).eq("user_id", auth.user.id).single();
  if (error || !current) return jsonError("Clip introuvable", 404, auth.requestId);
  if (Number(body.version) !== Number(current.edit_version)) return jsonError("Le clip a été modifié ailleurs. Rechargez-le.", 409, auth.requestId);

  const source = Array.isArray(current.studio_videos) ? current.studio_videos[0] : current.studio_videos;
  const duration = Math.max(1, Number(source?.duration_seconds) || 1);
  const start = Math.max(0, Math.min(duration - 1, Number(body.start ?? current.start_seconds)));
  const end = Math.max(start + 1, Math.min(duration, Number(body.end ?? current.end_seconds)));
  if (end - start > 180) return jsonError("Un clip ne peut pas dépasser 180 secondes", 400, auth.requestId);
  const style = String(body.style ?? current.edit_style);
  const aspectRatio = String(body.aspectRatio ?? current.aspect_ratio);
  if (!styles.has(style) || !ratios.has(aspectRatio)) return jsonError("Style ou format invalide", 400, auth.requestId);
  const framingX = Math.max(-1, Math.min(1, Number(body.framingX ?? current.framing_x) || 0));
  const framingY = Math.max(-1, Math.min(1, Number(body.framingY ?? current.framing_y) || 0));
  const title = String(body.title ?? current.title).trim().slice(0, 120);
  if (!title) return jsonError("Le titre est obligatoire", 400, auth.requestId);
  const captionStyle = body.captionStyle && JSON.stringify(body.captionStyle).length <= 4_000 ? body.captionStyle : current.caption_style;
  const history = Array.isArray(current.edit_history) ? current.edit_history : [];
  const snapshot = { version: current.edit_version, title: current.title, start: current.start_seconds, end: current.end_seconds, framingX: current.framing_x, framingY: current.framing_y, style: current.edit_style, aspectRatio: current.aspect_ratio, zoomEnabled: current.zoom_enabled, silenceRemoval: current.silence_removal, captionStyle: current.caption_style, savedAt: new Date().toISOString() };
  const nextVersion = Number(current.edit_version) + 1;
  const { data: updated, error: updateError } = await auth.supabase.from("studio_clips").update({
    title, start_seconds: start, end_seconds: end, framing_x: framingX, framing_y: framingY,
    edit_style: style, aspect_ratio: aspectRatio, zoom_enabled: body.zoomEnabled ?? current.zoom_enabled,
    silence_removal: body.silenceRemoval ?? current.silence_removal, caption_style: captionStyle,
    edit_history: [...history, snapshot].slice(-20), edit_version: nextVersion, updated_at: new Date().toISOString(),
  }).eq("id", id).eq("user_id", auth.user.id).eq("edit_version", current.edit_version).select("*").single();
  if (updateError || !updated) return jsonError("Conflit de sauvegarde. Rechargez le clip.", 409, auth.requestId);
  return Response.json({ clip: updated, requestId: auth.requestId }, { headers: { "Cache-Control": "no-store", "X-Request-Id": auth.requestId } });
}
