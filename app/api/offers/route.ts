import { chatGPTSignInPath, getChatGPTUser } from "../../chatgpt-auth";
import { cleanText, ensureMarketplaceSchema, marketplaceDb } from "../../../lib/marketplace-db";

export async function POST(request:Request){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Connexion requise",signIn:chatGPTSignInPath("/marketplace")},{status:401});
 const body=await request.json().catch(()=>({}));
 const title=cleanText(body.title,90),clientName=cleanText(body.clientName,70),description=cleanText(body.description,1200),platforms=cleanText(body.platforms,120);
 const budgetCents=Math.round(Number(body.budget)*100),cpmCents=Math.round(Number(body.cpm||0)*100);
 if(title.length<5||clientName.length<2||description.length<30||!platforms||!Number.isFinite(budgetCents)||budgetCents<1000)return Response.json({error:"Complétez correctement tous les champs."},{status:400});
 await ensureMarketplaceSchema();const id=crypto.randomUUID(),now=Date.now();
 await (await marketplaceDb()).prepare(`INSERT INTO offers (id,owner_email,title,client_name,description,platforms,budget_cents,cpm_cents,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id,user.email,title,clientName,description,platforms,budgetCents,Math.max(0,cpmCents),"open",now).run();
 return Response.json({ok:true,id},{status:201});
}
