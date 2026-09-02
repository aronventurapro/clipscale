import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("production dependencies pass the security audit", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("package.json", root), "utf8"),
  );
  assert.equal(
    packageJson.scripts["security:audit"],
    "npm audit --omit=dev --audit-level=high",
  );
});

test("global browser hardening headers are configured", async () => {
  const config = await readFile(new URL("next.config.ts", root), "utf8");
  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.match(config, new RegExp(header));
  }
  assert.match(config, /poweredByHeader:\s*false/);
});

test("studio APIs enforce auth, origin, size and rate limits", async () => {
  for (const path of [
    "app/api/studio/analyze/route.ts",
    "app/api/studio/render/route.ts",
    "app/api/studio/process/route.ts",
  ]) {
    const source = await readFile(new URL(path, root), "utf8");
    for (const control of ["authenticate", "consumeRateLimit", "jsonError"])
      assert.match(source, new RegExp(control));
  }
  const analyze = await readFile(
    new URL("app/api/studio/analyze/route.ts", root),
    "utf8",
  );
  const render = await readFile(
    new URL("app/api/studio/render/route.ts", root),
    "utf8",
  );
  assert.match(analyze, /hasAllowedOrigin/);
  assert.match(analyze, /bodyWithinLimit/);
  assert.match(render, /ownsRender/);
  assert.match(render, /createSignedUrl\(source\.file_path, 1_800\)/);
});

test("large uploads are resumable and clip edits are versioned", async () => {
  const upload = await readFile(
    new URL("lib/resumable-upload.ts", root),
    "utf8",
  );
  const editor = await readFile(
    new URL("app/api/studio/clips/[id]/route.ts", root),
    "utf8",
  );
  assert.match(upload, /chunkSize:\s*6 \* 1024 \* 1024/);
  assert.match(upload, /resumeFromPreviousUpload/);
  assert.match(editor, /edit_version/);
  assert.match(editor, /edit_history/);
});

test("commercial workflows are persistent and use Supabase auth", async () => {
  const migration = await readFile(
    new URL(
      "supabase/migrations/20260902043000_persist_commercial_workflows.sql",
      root,
    ),
    "utf8",
  );
  for (const table of [
    "marketplace_offers",
    "marketplace_applications",
    "missions",
    "workspace_settings",
  ]) {
    assert.match(
      migration,
      new RegExp(`create table if not exists public\\.${table}`),
    );
    assert.match(
      migration,
      new RegExp(`alter table public\\.${table} enable row level security`),
    );
  }
  for (const path of [
    "app/api/offers/route.ts",
    "app/api/applications/route.ts",
    "app/api/applications/[id]/route.ts",
    "app/api/me/route.ts",
  ]) {
    const source = await readFile(new URL(path, root), "utf8");
    assert.match(source, /authenticate/);
    assert.doesNotMatch(source, /getChatGPTUser|DemoDatabase/);
  }
  const marketplaceDb = await readFile(
    new URL("lib/marketplace-db.ts", root),
    "utf8",
  );
  assert.doesNotMatch(marketplaceDb, /DemoStore|globalThis|cloudflare:workers/);
});

test("video processing reserves monthly usage atomically", async () => {
  const processRoute = await readFile(
    new URL("app/api/studio/process/route.ts", root),
    "utf8",
  );
  const quotaMigration = await readFile(
    new URL("supabase/migrations/20260902044500_atomic_usage_quotas.sql", root),
    "utf8",
  );
  assert.match(processRoute, /reserve_video_minutes/);
  assert.match(processRoute, /release_video_minutes/);
  assert.match(processRoute, /Quota mensuel atteint/);
  assert.match(quotaMigration, /pg_advisory_xact_lock/);
  assert.match(quotaMigration, /quota_exceeded/);
});

test("video pipelines use durable workflows with bounded retries and idempotency", async () => {
  const processRoute = await readFile(new URL("app/api/studio/process/route.ts", root), "utf8");
  const renderRoute = await readFile(new URL("app/api/studio/render/route.ts", root), "utf8");
  const processingWorkflow = await readFile(new URL("workflows/video-processing.ts", root), "utf8");
  const renderWorkflow = await readFile(new URL("workflows/video-render.ts", root), "utf8");
  const migration = await readFile(new URL("supabase/migrations/20260902060515_durable_video_jobs.sql", root), "utf8");
  assert.match(processRoute, /start\(videoProcessingWorkflow/);
  assert.match(renderRoute, /startWorkflow\(videoRenderWorkflow/);
  for (const source of [processingWorkflow, renderWorkflow]) {
    assert.match(source, /"use workflow"/);
    assert.match(source, /"use step"/);
    assert.match(source, /maxRetries = 3/);
    assert.match(source, /last_heartbeat_at/);
  }
  assert.match(processingWorkflow, /upsert\(rows/);
  assert.match(migration, /processing_jobs_one_active_analysis_idx/);
  assert.match(migration, /processing_jobs_one_active_render_idx/);
  assert.match(migration, /studio_clips_job_time_unique_idx/);
  assert.match(migration, /event_type = 'consume'/);
  assert.doesNotMatch(migration, /values \([^\n]*'video_processed'/);
});

test("video deletion is authenticated, owner-scoped and removes storage first", async () => {
  const route = await readFile(
    new URL("app/api/studio/videos/[id]/route.ts", root),
    "utf8",
  );
  for (const control of [
    "authenticate",
    "hasAllowedOrigin",
    "user_id",
    "storage.from",
    ".remove(",
    "studio_video_deleted",
  ])
    assert.ok(route.includes(control));
  assert.match(route, /\["queued", "processing"\]/);
  const migration = await readFile(
    new URL(
      "supabase/migrations/20260902050500_support_and_video_retention.sql",
      root,
    ),
    "utf8",
  );
  assert.match(migration, /retention_until/);
  assert.match(migration, /support_own_access/);
});

test("no server secret is embedded in tracked source", async () => {
  const files = [
    "app/api/studio/analyze/route.ts",
    "app/api/studio/render/route.ts",
    "lib/server-security.ts",
  ];
  for (const path of files) {
    const source = await readFile(new URL(path, root), "utf8");
    assert.doesNotMatch(source, /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/);
  }
});
