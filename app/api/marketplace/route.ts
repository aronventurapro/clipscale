import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://rtnkxqoenakebgeuittq.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_se9rZq3CDLxGU1T8iAGwdA_HpL-7z6Q";

export async function GET() {
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await db.from("marketplace_offers").select("id,title,client_name,description,platforms,budget_cents,cpm_cents,status,created_at,marketplace_applications(count)").eq("status", "open").order("created_at", { ascending: false }).limit(100);
  if (error) return Response.json({ error: "Marketplace indisponible" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const offers = (data ?? []).map((row) => ({ id: row.id, title: row.title, clientName: row.client_name, description: row.description, platforms: row.platforms, budgetCents: row.budget_cents, cpmCents: row.cpm_cents, status: row.status, createdAt: row.created_at, applicationCount: Array.isArray(row.marketplace_applications) ? Number(row.marketplace_applications[0]?.count || 0) : 0 }));
  return Response.json({ offers }, { headers: { "Cache-Control": "no-store" } });
}
