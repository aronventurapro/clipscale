import { getChatGPTUser } from "../../../chatgpt-auth";
import { cleanText, ensureMarketplaceSchema, marketplaceDb } from "../../../../lib/marketplace-db";
import { bodyWithinLimit, jsonError } from "../../../../lib/server-security";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!bodyWithinLimit(request,2_048))return jsonError("Requête trop volumineuse",413);
 const user=await getChatGPTUser();if(!user)return Response.json({error:"Connexion requise"},{status:401});
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return jsonError("Identifiant invalide",400);
 const body=await request.json().catch(()=>({}));const status=cleanText(body.status,20);
 if(!["accepted","rejected","pending"].includes(status))return Response.json({error:"Statut invalide."},{status:400});
 await ensureMarketplaceSchema();
 const result=await (await marketplaceDb()).prepare(`UPDATE applications SET status=? WHERE id=? AND offer_id IN (SELECT id FROM offers WHERE owner_email=?)`).bind(status,id,user.email).run();
 if(!result.meta.changes)return Response.json({error:"Candidature introuvable."},{status:404});
 return Response.json({ok:true});
}
