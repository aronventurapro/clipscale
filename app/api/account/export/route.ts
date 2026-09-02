import { authenticate, consumeRateLimit, jsonError, recordEvent } from "@/lib/server-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportQuery = { name: string; table: string; ownerColumn: string };

const queries: ExportQuery[] = [
  { name: "profile", table: "marketplace_profiles", ownerColumn: "user_id" },
  { name: "offers", table: "marketplace_offers", ownerColumn: "owner_id" },
  { name: "applications", table: "marketplace_applications", ownerColumn: "applicant_id" },
  { name: "missions", table: "missions", ownerColumn: "user_id" },
  { name: "workspace", table: "workspace_settings", ownerColumn: "user_id" },
  { name: "videos", table: "studio_videos", ownerColumn: "user_id" },
  { name: "clips", table: "studio_clips", ownerColumn: "user_id" },
  { name: "jobs", table: "processing_jobs", ownerColumn: "user_id" },
  { name: "subscription", table: "user_subscriptions", ownerColumn: "user_id" },
  { name: "support", table: "support_tickets", ownerColumn: "user_id" },
];

export async function GET(request: Request) {
  const auth = await authenticate(request);
  if (!auth) return jsonError("Authentification requise", 401);
  const rate = await consumeRateLimit(auth, "account_export", 3, 3600);
  if (!rate.allowed) return jsonError(rate.unavailable ? "Export temporairement indisponible" : "Limite d’exports atteinte", rate.unavailable ? 503 : 429, auth.requestId);

  const sections = await Promise.all(queries.map(async ({ name, table, ownerColumn }) => {
    const { data, error } = await auth.supabase.from(table).select("*").eq(ownerColumn, auth.user.id);
    if (error) {
      console.error(JSON.stringify({ level: "error", message: "account_export_section_failed", section: name, code: error.code, requestId: auth.requestId }));
      return [name, { unavailable: true }] as const;
    }
    return [name, data ?? []] as const;
  }));
  await recordEvent(auth, "account_export_completed", { sections: sections.length });
  return new Response(JSON.stringify({
    exportedAt: new Date().toISOString(),
    account: { id: auth.user.id, email: auth.user.email, createdAt: auth.user.created_at, lastSignInAt: auth.user.last_sign_in_at },
    data: Object.fromEntries(sections),
  }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="clipscale-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": auth.requestId,
    },
  });
}
