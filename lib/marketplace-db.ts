type Row = Record<string, unknown>;

type Profile = {id:string;email:string;display_name:string;bio:string;skills:string;portfolio_url:string;created_at:number;updated_at:number};
type Offer = {id:string;owner_email:string;title:string;client_name:string;description:string;platforms:string;budget_cents:number;cpm_cents:number;status:string;created_at:number};
type Application = {id:string;offer_id:string;clipper_email:string;message:string;portfolio_url:string;status:string;created_at:number};
type DemoStore = {profiles:Profile[];offers:Offer[];applications:Application[]};

interface StatementLike {
 bind(...values:unknown[]):StatementLike;
 first<T=Row>():Promise<T|null>;
 all<T=Row>():Promise<{results:T[];success:boolean;meta:{changes:number}}>;
 run<T=Row>():Promise<{results:T[];success:boolean;meta:{changes:number}}>;
}

interface DatabaseLike {
 prepare(query:string):StatementLike;
 batch(statements:StatementLike[]):Promise<unknown[]>;
}

declare global {
 var __clipscaleDemoStore: DemoStore | undefined;
}

function demoStore():DemoStore{
 globalThis.__clipscaleDemoStore ??= {profiles:[],offers:[],applications:[]};
 return globalThis.__clipscaleDemoStore;
}

class DemoStatement implements StatementLike{
 private values:unknown[]=[];
 constructor(private query:string,private store:DemoStore){}
 bind(...values:unknown[]){this.values=values;return this}
 async first<T=Row>():Promise<T|null>{const rows=this.select();return (rows[0] as T|undefined)??null}
 async all<T=Row>(){const results=this.select() as T[];return {results,success:true,meta:{changes:0}}}
 async run<T=Row>(){
  const q=this.normalized();let changes=0;
  if(q.startsWith("insert into offers")){
   const [id,owner_email,title,client_name,description,platforms,budget_cents,cpm_cents,status,created_at]=this.values;
   this.store.offers.push({id:String(id),owner_email:String(owner_email),title:String(title),client_name:String(client_name),description:String(description),platforms:String(platforms),budget_cents:Number(budget_cents),cpm_cents:Number(cpm_cents),status:String(status),created_at:Number(created_at)});changes=1;
  }else if(q.startsWith("insert into profiles")){
   const [id,email,display_name,bio,skills,portfolio_url,created_at,updated_at]=this.values;const existing=this.store.profiles.find(x=>x.email===String(email));
   if(existing)Object.assign(existing,{display_name:String(display_name),bio:String(bio),skills:String(skills),portfolio_url:String(portfolio_url),updated_at:Number(updated_at)});
   else this.store.profiles.push({id:String(id),email:String(email),display_name:String(display_name),bio:String(bio),skills:String(skills),portfolio_url:String(portfolio_url),created_at:Number(created_at),updated_at:Number(updated_at)});changes=1;
  }else if(q.startsWith("insert into applications")){
   const [id,offer_id,clipper_email,message,portfolio_url,status,created_at]=this.values;
   if(this.store.applications.some(x=>x.offer_id===String(offer_id)&&x.clipper_email===String(clipper_email)))throw new Error("duplicate application");
   this.store.applications.push({id:String(id),offer_id:String(offer_id),clipper_email:String(clipper_email),message:String(message),portfolio_url:String(portfolio_url),status:String(status),created_at:Number(created_at)});changes=1;
  }else if(q.startsWith("update applications set status")){
   const [status,id,owner]=this.values;const app=this.store.applications.find(x=>x.id===String(id)&&this.store.offers.some(o=>o.id===x.offer_id&&o.owner_email===String(owner)));
   if(app){app.status=String(status);changes=1}
  }
  return {results:[] as T[],success:true,meta:{changes}};
 }
 private normalized(){return this.query.replace(/\s+/g," ").trim().toLowerCase()}
 private select():Row[]{
  const q=this.normalized();const v=this.values.map(String);
  if(q.startsWith("create "))return [];
  if(q.includes("from profiles where email=?"))return this.store.profiles.filter(x=>x.email===v[0]).map(x=>({displayName:x.display_name,bio:x.bio,skills:x.skills,portfolioUrl:x.portfolio_url}));
  if(q.includes("from offers where owner_email=?"))return this.store.offers.filter(x=>x.owner_email===v[0]).sort((a,b)=>b.created_at-a.created_at).map(x=>({id:x.id,title:x.title,status:x.status,createdAt:x.created_at}));
  if(q.includes("from applications a join offers o")&&q.includes("where a.clipper_email=?"))return this.store.applications.filter(x=>x.clipper_email===v[0]).map(x=>{const o=this.store.offers.find(y=>y.id===x.offer_id);return {id:x.id,status:x.status,createdAt:x.created_at,title:o?.title??"Mission",clientName:o?.client_name??""}}).sort((a,b)=>b.createdAt-a.createdAt);
  if(q.includes("from applications a join offers o")&&q.includes("where o.owner_email=?"))return this.store.applications.filter(x=>this.store.offers.some(o=>o.id===x.offer_id&&o.owner_email===v[0])).map(x=>{const o=this.store.offers.find(y=>y.id===x.offer_id);const p=this.store.profiles.find(y=>y.email===x.clipper_email);return {id:x.id,status:x.status,message:x.message,portfolioUrl:x.portfolio_url,displayName:p?.display_name??null,skills:p?.skills??null,title:o?.title??"Mission"}});
  if(q.includes("from offers o left join applications"))return this.store.offers.filter(x=>x.status==="open").sort((a,b)=>b.created_at-a.created_at).slice(0,100).map(x=>({id:x.id,title:x.title,clientName:x.client_name,description:x.description,platforms:x.platforms,budgetCents:x.budget_cents,cpmCents:x.cpm_cents,status:x.status,createdAt:x.created_at,applicationCount:this.store.applications.filter(a=>a.offer_id===x.id).length}));
  if(q.includes("select id,owner_email from offers"))return this.store.offers.filter(x=>x.id===v[0]&&x.status==="open").map(x=>({id:x.id,owner_email:x.owner_email}));
  return [];
 }
}

class DemoDatabase implements DatabaseLike{
 constructor(private store:DemoStore){}
 prepare(query:string){return new DemoStatement(query,this.store)}
 async batch(statements:StatementLike[]){return Promise.all(statements.map(statement=>statement.run()))}
}

let cloudflareDatabase:DatabaseLike|undefined;

export async function marketplaceDb():Promise<DatabaseLike>{
 if(process.env.VERCEL)return new DemoDatabase(demoStore());
 if(cloudflareDatabase)return cloudflareDatabase;
 try{
  const workers=await import("cloudflare:workers");
  if(workers.env.DB){cloudflareDatabase=workers.env.DB as unknown as DatabaseLike;return cloudflareDatabase}
 }catch{}
 return new DemoDatabase(demoStore());
}

export async function ensureMarketplaceSchema(){
 const db=await marketplaceDb();
 await db.batch([
  db.prepare(`CREATE TABLE IF NOT EXISTS profiles (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, bio TEXT NOT NULL DEFAULT '', skills TEXT NOT NULL DEFAULT '', portfolio_url TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY, owner_email TEXT NOT NULL, title TEXT NOT NULL, client_name TEXT NOT NULL, description TEXT NOT NULL, platforms TEXT NOT NULL, budget_cents INTEGER NOT NULL, cpm_cents INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL)`),
  db.prepare(`CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, offer_id TEXT NOT NULL, clipper_email TEXT NOT NULL, message TEXT NOT NULL, portfolio_url TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending', created_at INTEGER NOT NULL, UNIQUE(offer_id, clipper_email))`),
  db.prepare(`CREATE INDEX IF NOT EXISTS offers_status_created_idx ON offers(status, created_at)`),
  db.prepare(`CREATE INDEX IF NOT EXISTS applications_offer_idx ON applications(offer_id)`),
 ]);
}

export function cleanText(value:unknown,max=500){return String(value??"").trim().slice(0,max)}
export function validUrl(value:string){if(!value)return true;try{const u=new URL(value);return u.protocol==="https:"||u.protocol==="http:"}catch{return false}}
