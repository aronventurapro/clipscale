import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { cleanText, ensureMarketplaceSchema, marketplaceDb, validUrl } from "../../../lib/marketplace-db";

export async function POST(request:Request){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Connexion requise",signIn:chatGPTSignInPath("/marketplace")},{status:401});
 const body=await request.json().catch(()=>({}));
 const offerId=cleanText(body.offerId,80),displayName=cleanText(body.displayName,70),bio=cleanText(body.bio,500),skills=cleanText(body.skills,200),message=cleanText(body.message,900),portfolioUrl=cleanText(body.portfolioUrl,400);
 if(!offerId||displayName.length<2||bio.length<20||skills.length<2||message.length<20||!validUrl(portfolioUrl))return Response.json({error:"Profil, message ou portfolio invalide."},{status:400});
 await ensureMarketplaceSchema();const db=await marketplaceDb();
 const offer=await db.prepare(`SELECT id,owner_email FROM offers WHERE id=? AND status='open'`).bind(offerId).first<{id:string;owner_email:string}>();
 if(!offer)return Response.json({error:"Cette offre n’est plus disponible."},{status:404});
 if(offer.owner_email===user.email)return Response.json({error:"Vous ne pouvez pas candidater à votre propre offre."},{status:400});
 const now=Date.now();
 try{await db.batch([
  db.prepare(`INSERT INTO profiles (id,email,display_name,bio,skills,portfolio_url,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET display_name=excluded.display_name,bio=excluded.bio,skills=excluded.skills,portfolio_url=excluded.portfolio_url,updated_at=excluded.updated_at`).bind(crypto.randomUUID(),user.email,displayName,bio,skills,portfolioUrl,now,now),
  db.prepare(`INSERT INTO applications (id,offer_id,clipper_email,message,portfolio_url,status,created_at) VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),offerId,user.email,message,portfolioUrl,"pending",now),
 ]);}catch{return Response.json({error:"Vous avez déjà candidaté à cette offre."},{status:409})}
 return Response.json({ok:true},{status:201});
}
