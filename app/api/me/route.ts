import { authenticate, jsonError } from "@/lib/server-security";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await authenticate(request); if (!auth) return jsonError("Authentification requise", 401);
  const [profileResult, offersResult, applicationsResult, ownedOffersResult] = await Promise.all([
    auth.supabase.from("marketplace_profiles").select("display_name,bio,skills,portfolio_url").eq("user_id", auth.user.id).maybeSingle(),
    auth.supabase.from("marketplace_offers").select("id,title,status,created_at").eq("owner_id", auth.user.id).order("created_at", { ascending: false }),
    auth.supabase.from("marketplace_applications").select("id,status,created_at,marketplace_offers(title,client_name)").eq("applicant_id", auth.user.id).order("created_at", { ascending: false }),
    auth.supabase.from("marketplace_offers").select("id").eq("owner_id", auth.user.id),
  ]);
  const offerIds = (ownedOffersResult.data ?? []).map((item) => item.id);
  const receivedResult = offerIds.length ? await auth.supabase.from("marketplace_applications").select("id,applicant_id,status,message,portfolio_url,marketplace_offers(title)").in("offer_id", offerIds).order("created_at", { ascending: false }) : { data: [], error: null };
  const applicantIds = [...new Set((receivedResult.data ?? []).map((item) => item.applicant_id))];
  const profilesResult = applicantIds.length ? await auth.supabase.from("marketplace_profiles").select("user_id,display_name,skills").in("user_id", applicantIds) : { data: [], error: null };
  const profileById = new Map((profilesResult.data ?? []).map((item) => [item.user_id, item]));
  return Response.json({ authenticated: true, user: { email: auth.user.email, displayName: auth.user.user_metadata?.full_name || auth.user.email }, profile: profileResult.data ? { displayName: profileResult.data.display_name, bio: profileResult.data.bio, skills: profileResult.data.skills, portfolioUrl: profileResult.data.portfolio_url } : null, offers: (offersResult.data ?? []).map((item) => ({ id: item.id, title: item.title, status: item.status, createdAt: item.created_at })), applications: (applicationsResult.data ?? []).map((item) => { const offer = Array.isArray(item.marketplace_offers) ? item.marketplace_offers[0] : item.marketplace_offers; return { id: item.id, status: item.status, createdAt: item.created_at, title: offer?.title, clientName: offer?.client_name }; }), received: (receivedResult.data ?? []).map((item) => { const offer = Array.isArray(item.marketplace_offers) ? item.marketplace_offers[0] : item.marketplace_offers; const profile = profileById.get(item.applicant_id); return { id: item.id, status: item.status, message: item.message, portfolioUrl: item.portfolio_url, displayName: profile?.display_name, skills: profile?.skills, title: offer?.title }; }) }, { headers: { "Cache-Control": "no-store" } });
}
