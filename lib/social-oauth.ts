import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type SocialPlatformId = "youtube" | "instagram" | "facebook" | "tiktok" | "linkedin";

type OAuthConfig = {
  authorizeUrl: string;
  tokenUrl: string;
  clientId?: string;
  clientSecret?: string;
  scopes: string[];
  clientIdField?: string;
};

export function socialConfig(platform: SocialPlatformId): OAuthConfig {
  if (platform === "youtube") return {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: process.env.YOUTUBE_CLIENT_ID,
    clientSecret: process.env.YOUTUBE_CLIENT_SECRET,
    scopes: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
  };
  if (platform === "tiktok") return {
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
    clientId: process.env.TIKTOK_CLIENT_KEY,
    clientSecret: process.env.TIKTOK_CLIENT_SECRET,
    clientIdField: "client_key",
    scopes: ["user.info.basic", "video.upload", "video.publish"],
  };
  if (platform === "linkedin") return {
    authorizeUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    clientId: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    scopes: ["openid", "profile", "w_member_social"],
  };
  return {
    authorizeUrl: "https://www.facebook.com/v22.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v22.0/oauth/access_token",
    clientId: process.env.META_CLIENT_ID,
    clientSecret: process.env.META_CLIENT_SECRET,
    scopes: ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "instagram_basic", "instagram_content_publish"],
  };
}

export function isSocialPlatform(value: unknown): value is SocialPlatformId {
  return ["youtube", "instagram", "facebook", "tiktok", "linkedin"].includes(String(value));
}

function stateSecret() {
  return process.env.SOCIAL_OAUTH_STATE_SECRET || "";
}

export function createOAuthState(userId: string, platform: SocialPlatformId) {
  const payload = Buffer.from(JSON.stringify({ userId, platform, nonce: randomBytes(18).toString("hex"), expires: Date.now() + 10 * 60_000 })).toString("base64url");
  const signature = createHmac("sha256", stateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyOAuthState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature || !stateSecret()) return null;
  const expected = createHmac("sha256", stateSecret()).update(payload).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId?: string; platform?: unknown; nonce?: string; expires?: number };
    return /^[0-9a-f-]{36}$/i.test(value.userId || "") && isSocialPlatform(value.platform) && value.expires && value.expires > Date.now() ? value as { userId: string; platform: SocialPlatformId; nonce: string; expires: number } : null;
  } catch { return null; }
}

function encryptionKey() {
  const encoded = process.env.SOCIAL_TOKEN_ENCRYPTION_KEY || "";
  const key = Buffer.from(encoded, "base64");
  return key.length === 32 ? key : null;
}

export function encryptSocialToken(value: string) {
  const key = encryptionKey();
  if (!key) throw new Error("social-token-encryption-unavailable");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptSocialToken(value: string) {
  const key = encryptionKey();
  if (!key) throw new Error("social-token-encryption-unavailable");
  const [iv, tag, encrypted] = value.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function socialOAuthReady(platform: SocialPlatformId) {
  const config = socialConfig(platform);
  return Boolean(config.clientId && config.clientSecret && stateSecret() && encryptionKey());
}
