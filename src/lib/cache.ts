/**
 * Server-side caching layer for YouTube API responses
 * Uses Upstash Redis when available, falls back to in-memory cache
 * 
 * Features:
 * - TTL-based caching (respects YouTube's pollingIntervalMillis)
 * - Request coalescing (one API call per liveChatId per polling window)
 * - L1 in-memory cache for warm serverless instances
 * - Graceful degradation when Redis is unavailable
 */

import { getRedis } from "@/lib/redis";

/**
 * L1 in-memory cache for warm serverless instances
 * Reduces Redis calls within the same instance
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_MEMORY_CACHE_SIZE = 100;

function cleanupMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
  // Evict oldest entries if over size limit
  if (memoryCache.size > MAX_MEMORY_CACHE_SIZE) {
    const entries = Array.from(memoryCache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toDelete = entries.slice(0, memoryCache.size - MAX_MEMORY_CACHE_SIZE);
    toDelete.forEach(([key]) => memoryCache.delete(key));
  }
}

/**
 * In-flight request tracking for request coalescing
 * Multiple concurrent requests for the same key will share one fetch
 */
const inFlightRequests = new Map<string, Promise<unknown>>();

/**
 * Generate a short hash for API key identification
 * Never store full API keys
 */
export function hashApiKey(apiKey: string | undefined): string {
  if (!apiKey) return "server";
  
  let hash = 0;
  for (let i = 0; i < apiKey.length; i++) {
    const char = apiKey.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `byok-${Math.abs(hash).toString(36).slice(0, 8)}`;
}

/**
 * Generate cache key for YouTube API responses
 */
export function getCacheKey(type: "connect" | "messages", id: string, apiKeyId: string): string {
  return `yt:${type}:${apiKeyId}:${id}`;
}

/**
 * Generate lock key for distributed locking
 */
export function getLockKey(cacheKey: string): string {
  return `${cacheKey}:lock`;
}

/**
 * Cached payload with metadata
 */
export interface CachedPayload<T> {
  data: T;
  fetchedAt: number;
  expiresAt: number;
  pageToken?: string; // Server-owned pageToken for messages
}

/**
 * Get cached value (L1 memory -> L2 Redis)
 */
export async function getCached<T>(key: string): Promise<CachedPayload<T> | null> {
  // Check L1 memory cache first
  const memEntry = memoryCache.get(key) as CacheEntry<CachedPayload<T>> | undefined;
  if (memEntry && memEntry.expiresAt > Date.now()) {
    return memEntry.value;
  }
  
  // Check L2 Redis
  const client = await getRedis();
  if (!client) return null;
  
  try {
    const cached = await client.get<CachedPayload<T>>(key);
    if (cached && cached.expiresAt > Date.now()) {
      // Populate L1 cache
      memoryCache.set(key, {
        value: cached,
        expiresAt: cached.expiresAt,
      });
      return cached;
    }
    return null;
  } catch (e) {
    console.error("[Cache] Redis get error:", e);
    return null;
  }
}

/**
 * Set cached value (both L1 and L2)
 */
export async function setCached<T>(
  key: string, 
  data: T, 
  ttlMs: number,
  pageToken?: string
): Promise<void> {
  const now = Date.now();
  const expiresAt = now + ttlMs;
  const payload: CachedPayload<T> = {
    data,
    fetchedAt: now,
    expiresAt,
    pageToken,
  };
  
  // Set L1 memory cache
  memoryCache.set(key, { value: payload, expiresAt });
  cleanupMemoryCache();
  
  // Set L2 Redis
  const client = await getRedis();
  if (!client) return;
  
  try {
    const ttlSeconds = Math.ceil(ttlMs / 1000) + 5; // Add buffer
    await client.setex(key, ttlSeconds, payload);
  } catch (e) {
    console.error("[Cache] Redis set error:", e);
  }
}

/**
 * Try to acquire a distributed lock
 * Returns true if lock acquired, false if already held
 */
export async function acquireLock(key: string, ttlSeconds = 15): Promise<boolean> {
  const client = await getRedis();
  if (!client) {
    // Without Redis, we can't do distributed locking
    // Fall back to in-memory tracking
    if (inFlightRequests.has(key)) return false;
    return true;
  }
  
  try {
    const lockKey = getLockKey(key);
    const result = await client.setnx(lockKey, Date.now().toString());
    if (result === 1) {
      await client.expire(lockKey, ttlSeconds);
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Cache] Redis lock error:", e);
    return true; // On error, allow the request to proceed
  }
}

/**
 * Release a distributed lock
 */
export async function releaseLock(key: string): Promise<void> {
  const client = await getRedis();
  if (!client) return;
  
  try {
    await client.del(getLockKey(key));
  } catch (e) {
    console.error("[Cache] Redis unlock error:", e);
  }
}

/**
 * Request coalescing wrapper
 * Multiple concurrent requests for the same key will share one fetch
 */
export async function withCoalescing<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already an in-flight request
  const existing = inFlightRequests.get(key) as Promise<T> | undefined;
  if (existing) {
    return existing;
  }
  
  // Create new request
  const request = fetcher().finally(() => {
    inFlightRequests.delete(key);
  });
  
  inFlightRequests.set(key, request);
  return request;
}

/**
 * Cache-aside pattern with coalescing and locking
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<{ data: T; ttlMs: number; pageToken?: string }>,
  options: { staleWhileRevalidate?: boolean } = {}
): Promise<{ data: T; fromCache: boolean; fetchedAt: number }> {
  // Check cache first
  const cached = await getCached<T>(key);
  
  if (cached && cached.expiresAt > Date.now()) {
    return {
      data: cached.data,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
    };
  }
  
  // Try to acquire lock for refresh
  const lockAcquired = await acquireLock(key);
  
  if (!lockAcquired) {
    // Another instance is refreshing - return stale data if available
    if (cached && options.staleWhileRevalidate) {
      return {
        data: cached.data,
        fromCache: true,
        fetchedAt: cached.fetchedAt,
      };
    }
    // Wait briefly and try cache again
    await new Promise((r) => setTimeout(r, 200));
    const refreshed = await getCached<T>(key);
    if (refreshed) {
      return {
        data: refreshed.data,
        fromCache: true,
        fetchedAt: refreshed.fetchedAt,
      };
    }
  }
  
  // Fetch fresh data with coalescing
  try {
    const result = await withCoalescing(key, fetcher);
    await setCached(key, result.data, result.ttlMs, result.pageToken);
    return {
      data: result.data,
      fromCache: false,
      fetchedAt: Date.now(),
    };
  } finally {
    if (lockAcquired) {
      await releaseLock(key);
    }
  }
}

/**
 * Get server-stored page token for a liveChatId
 */
export async function getStoredPageToken(key: string): Promise<string | undefined> {
  const cached = await getCached<unknown>(key);
  return cached?.pageToken;
}
