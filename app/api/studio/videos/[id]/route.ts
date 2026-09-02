import { authenticate, hasAllowedOrigin, jsonError, recordEvent } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const uuid = /^[0-9a-f-]{36}$/i;

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasAllowedOrigin(request)) return jsonError("Origine non autorisée", 403);
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const { id } = await params; if (!uuid.test(id)) return jsonError("Vidéo invalide", 400, auth.requestId);
  const { data: video, error } = await auth.supabase.from("studio_videos").select("id,file_path").eq("id", id).eq("user_id", auth.user.id).single();
  if (error || !video) return jsonError("Vidéo introuvable", 404, auth.requestId);
  const { data: jobs } = await auth.supabase.from("processing_jobs").select("id").eq("video_id", id).in("status", ["queued", "processing"]).limit(1);
  if (jobs?.length) return jsonError("Attendez la fin du traitement avant de supprimer la vidéo", 409, auth.requestId);
  const { error: storageError } = await auth.supabase.storage.from("studio-videos").remove([video.file_path]);
  if (storageError) return jsonError("Fichier vidéo non supprimé", 502, auth.requestId);
  const { error: deleteError } = await auth.supabase.from("studio_videos").delete().eq("id", id).eq("user_id", auth.user.id);
  if (deleteError) return jsonError("Fiche vidéo non supprimée", 502, auth.requestId);
  await recordEvent(auth, "studio_video_deleted", { video_id: id });
  return Response.json({ deleted: true, requestId: auth.requestId }, { headers: { "Cache-Control": "no-store" } });
}
