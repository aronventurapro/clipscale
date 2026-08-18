import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { ensureMarketplaceSchema, marketplaceDb } from "../../../lib/marketplace-db";

export const dynamic="force-dynamic";
export async function GET(){
 const user=await getChatGPTUser();
 if(!user)return Response.json({authenticated:false,signIn:chatGPTSignInPath("/marketplace")},{status:401});
 await ensureMarketplaceSchema();const db=await marketplaceDb();
 const [profile,offers,applications,received]=await Promise.all([
  db.prepare(`SELECT display_name as displayName,bio,skills,portfolio_url as portfolioUrl FROM profiles WHERE email=?`).bind(user.email).first(),
  db.prepare(`SELECT id,title,status,created_at as createdAt FROM offers WHERE owner_email=? ORDER BY created_at DESC`).bind(user.email).all(),
  db.prepare(`SELECT a.id,a.status,a.created_at as createdAt,o.title,o.client_name as clientName FROM applications a JOIN offers o ON o.id=a.offer_id WHERE a.clipper_email=? ORDER BY a.created_at DESC`).bind(user.email).all(),
  db.prepare(`SELECT a.id,a.status,a.message,a.portfolio_url as portfolioUrl,p.display_name as displayName,p.skills,o.title FROM applications a JOIN offers o ON o.id=a.offer_id LEFT JOIN profiles p ON p.email=a.clipper_email WHERE o.owner_email=? ORDER BY a.created_at DESC`).bind(user.email).all(),
 ]);
 return Response.json({authenticated:true,user,profile,offers:offers.results,applications:applications.results,received:received.results},{headers:{"Cache-Control":"no-store"}});
}
