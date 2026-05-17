/**
 * Rate limiting and quota tracking for YouTube API protection
 *
 * - Per-IP rate limiting (Redis-backed with in-memory fallback)
 * - Global quota tracking (Redis-backed with in-memory fallback)
 * - Redis ensures consistency across serverless instances on Vercel
 * - In-memory fallback used when Redis is not configured
 */

import { getRedis } from "@/lib/redis";

/** YouTube API quota costs */
const QUOTA_COSTS = {
  "videos.list": 1,
  "liveChatMessages.list": 5,
  "channels.list": 1,
} as const;

type QuotaOperation = keyof typeof QUOTA_COSTS;

/** Daily quota limit - leave buffer for safety (10,000 total, use 8,000) */
const DAILY_QUOTA_LIMIT = 8_000;

/** Per-IP limits */
const IP_CONNECT_LIMIT = 10; // connect requests per window
const IP_CONNECT_WINDOW_MS = 60 * 1000; // 1 minute
const IP_MESSAGES_LIMIT = 60; // message requests per window
const IP_MESSAGES_WINDOW_MS = 60 * 1000; // 1 minute

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/** In-memory fallback store (best-effort when Redis is unavailable) */
const rateLimitStore = new Map<string, RateLimitEntry>();
let quotaUsed = 0;
let quotaResetAt = getNextMidnightPacific();

function getNextMidnightPacific(): number {
  const now = new Date();
  const pacific = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const midnight = new Date(pacific);
  midnight.setHours(24, 0, 0, 0);
  const diff = pacific.getTime() - now.getTime();
  return midnight.getTime() - diff;
}

/** Today's date in Pacific time as YYYY-MM-DD (used as Redis key suffix) */
function getPacificDateKey(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
}

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------

/**
 * Redis-backed rate limit check using INCR + EXPIRE.
 * Returns null when Redis is unavailable so the caller can fall back.
 */
async function checkRateLimitRedis(
  ip: string,
  action: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number } | null> {
  const client = await getRedis();
  if (!client) return null;

  const windowSeconds = Math.ceil(windowMs / 1000);
  const key = `rl:${ip}:${action}`;

  try {
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, windowSeconds);
    }

    if (count > limit) {
      const ttl = await client.ttl(key);
      return { allowed: false, retryAfterMs: Math.max(ttl * 1000, 1000) };
    }

    return { allowed: true };
  } catch {
    return null;
  }
}

/** In-memory rate limit check (fallback) */
function checkRateLimitMemory(
  ip: string,
  action: string,
  limit: number,
  windowMs: number,
): { allowed: true } | { allowed: false; retryAfterMs: number } {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Check and consume rate limit for an IP + action.
 * Uses Redis when available, falls back to in-memory.
 */
export async function checkRateLimit(
  ip: string,
  action: "connect" | "messages",
): Promise<{ allowed: true } | { allowed: false; retryAfterMs: number }> {
  const limit = action === "connect" ? IP_CONNECT_LIMIT : IP_MESSAGES_LIMIT;
  const windowMs = action === "connect" ? IP_CONNECT_WINDOW_MS : IP_MESSAGES_WINDOW_MS;

  const redisResult = await checkRateLimitRedis(ip, action, limit, windowMs);
  if (redisResult) return redisResult;

  return checkRateLimitMemory(ip, action, limit, windowMs);
}

// ---------------------------------------------------------------------------
// Quota Tracking
// ---------------------------------------------------------------------------

/**
 * Redis-backed quota consumption.
 * Returns null when Redis is unavailable so the caller can fall back.
 */
async function consumeQuotaRedis(operation: QuotaOperation): Promise<boolean | null> {
  const client = await getRedis();
  if (!client) return null;

  const dateKey = getPacificDateKey();
  const key = `quota:daily:${dateKey}`;
  const cost = QUOTA_COSTS[operation];

  try {
    const current = await client.incrby(key, cost);
    if (current === cost) {
      // First increment today - expire after ~25 hours as safety margin
      await client.expire(key, 25 * 60 * 60);
    }

    if (current > DAILY_QUOTA_LIMIT) {
      // Over budget - undo the increment
      await client.decrby(key, cost);
      return false;
    }

    return true;
  } catch {
    return null;
  }
}

/** In-memory quota consumption (fallback) */
function consumeQuotaMemory(operation: QuotaOperation): boolean {
  const now = Date.now();
  if (now >= quotaResetAt) {
    quotaUsed = 0;
    quotaResetAt = getNextMidnightPacific();
  }

  const cost = QUOTA_COSTS[operation];
  if (quotaUsed + cost > DAILY_QUOTA_LIMIT) {
    return false;
  }

  quotaUsed += cost;
  return true;
}

/**
 * Check and consume global quota units.
 * Uses Redis when available, falls back to in-memory.
 */
export async function consumeQuota(operation: QuotaOperation): Promise<boolean> {
  const redisResult = await consumeQuotaRedis(operation);
  if (redisResult !== null) return redisResult;

  return consumeQuotaMemory(operation);
}

/**
 * Get current quota usage info
 */
export async function getQuotaInfo(): Promise<{ used: number; limit: number; resetsAt: number }> {
  const client = await getRedis();
  if (client) {
    try {
      const dateKey = getPacificDateKey();
      const used = await client.get<number>(`quota:daily:${dateKey}`);
      return { used: used ?? 0, limit: DAILY_QUOTA_LIMIT, resetsAt: getNextMidnightPacific() };
    } catch {
      // fall through to in-memory
    }
  }

  const now = Date.now();
  if (now >= quotaResetAt) {
    quotaUsed = 0;
    quotaResetAt = getNextMidnightPacific();
  }
  return { used: quotaUsed, limit: DAILY_QUOTA_LIMIT, resetsAt: quotaResetAt };
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown"
  );
}
