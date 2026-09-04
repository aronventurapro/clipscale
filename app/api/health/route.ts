export const dynamic = "force-dynamic";

export async function GET() {
  const services = {
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    analysis: Boolean(process.env.OPENAI_API_KEY),
    rendering: Boolean(process.env.SHOTSTACK_API_KEY && process.env.SHOTSTACK_STAGE === "stage"),
    payments: Boolean(process.env.BILLING_ENABLED === "true" && process.env.STRIPE_WEBHOOK_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY),
    socialConnections: Boolean(process.env.SOCIAL_OAUTH_STATE_SECRET && process.env.SOCIAL_TOKEN_ENCRYPTION_KEY),
  };
  const coreReady = Object.values(services).every(Boolean);
  return Response.json(
    {
      status: coreReady ? "operational" : "degraded",
      services,
      checkedAt: new Date().toISOString(),
    },
    {
      status: coreReady ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    },
  );
}
