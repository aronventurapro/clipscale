import { ensureMarketplaceSchema, marketplaceDb } from "../../../lib/marketplace-db";

export const dynamic="force-dynamic";
export async function GET(){
 await ensureMarketplaceSchema();
 const result=await (await marketplaceDb()).prepare(`SELECT o.id,o.title,o.client_name as clientName,o.description,o.platforms,o.budget_cents as budgetCents,o.cpm_cents as cpmCents,o.status,o.created_at as createdAt,COUNT(a.id) as applicationCount FROM offers o LEFT JOIN applications a ON a.offer_id=o.id WHERE o.status='open' GROUP BY o.id ORDER BY o.created_at DESC LIMIT 100`).all();
 return Response.json({offers:result.results},{headers:{"Cache-Control":"no-store"}});
}
