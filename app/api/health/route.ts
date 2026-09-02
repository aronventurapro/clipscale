export const dynamic = "force-dynamic";

export async function GET() {
  const services = {
    database: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    analysis: Boolean(process.env.OPENAI_API_KEY),
    rendering: Boolean(process.env.SHOTSTACK_API_KEY && process.env.SHOTSTACK_STAGE),
    payments: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  };
  const coreReady = services.database;
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
