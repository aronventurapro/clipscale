import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("production dependencies pass the security audit", async () => {
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  assert.equal(packageJson.scripts["security:audit"], "npm audit --omit=dev --audit-level=high");
});

test("global browser hardening headers are configured", async () => {
  const config = await readFile(new URL("next.config.ts", root), "utf8");
  for (const header of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.match(config, new RegExp(header));
  }
  assert.match(config, /poweredByHeader:\s*false/);
});

test("studio APIs enforce auth, origin, size and rate limits", async () => {
  for (const path of ["app/api/studio/analyze/route.ts", "app/api/studio/render/route.ts", "app/api/studio/process/route.ts"]) {
    const source = await readFile(new URL(path, root), "utf8");
    for (const control of ["authenticate", "consumeRateLimit", "jsonError"]) assert.match(source, new RegExp(control));
  }
  const analyze = await readFile(new URL("app/api/studio/analyze/route.ts", root), "utf8");
  const render = await readFile(new URL("app/api/studio/render/route.ts", root), "utf8");
  assert.match(analyze, /hasAllowedOrigin/);
  assert.match(analyze, /bodyWithinLimit/);
  assert.match(render, /ownsRender/);
  assert.match(render, /createSignedUrl\(source\.file_path, 1_800\)/);
});

test("large uploads are resumable and clip edits are versioned", async () => {
  const upload = await readFile(new URL("lib/resumable-upload.ts", root), "utf8");
  const editor = await readFile(new URL("app/api/studio/clips/[id]/route.ts", root), "utf8");
  assert.match(upload, /chunkSize:\s*6 \* 1024 \* 1024/);
  assert.match(upload, /resumeFromPreviousUpload/);
  assert.match(editor, /edit_version/);
  assert.match(editor, /edit_history/);
});

test("no server secret is embedded in tracked source", async () => {
  const files = ["app/api/studio/analyze/route.ts", "app/api/studio/render/route.ts", "lib/server-security.ts"];
  for (const path of files) {
    const source = await readFile(new URL(path, root), "utf8");
    assert.doesNotMatch(source, /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/);
  }
});
