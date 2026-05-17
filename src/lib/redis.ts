/**
 * Shared Upstash Redis client
 * Used by cache.ts and rate-limit.ts
 */

import type { Redis as UpstashRedis } from "@upstash/redis";

let redis: UpstashRedis | null = null;
let redisInitialized = false;

/**
 * Lazily initialize and return the shared Redis client.
 * Returns null when Upstash credentials are not configured.
 */
export async function getRedis(): Promise<UpstashRedis | null> {
  if (redisInitialized) return redis;

  redisInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    console.warn("[Redis] Upstash Redis not configured - using in-memory fallback");
    return null;
  }

  try {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({ url, token });
    console.log("[Redis] Upstash Redis connected");
    return redis;
  } catch (e) {
    console.warn("[Redis] Failed to initialize:", e);
    return null;
  }
}
