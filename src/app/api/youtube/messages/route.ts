import type { NextRequest } from "next/server";
import { 
  getCacheKey, 
  hashApiKey, 
  getOrFetch,
  getStoredPageToken 
} from "@/lib/cache";
import { checkRateLimit, consumeQuota, getClientIp } from "@/lib/rate-limit";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Default polling interval (YouTube typically returns 3-5 seconds)
const DEFAULT_POLLING_INTERVAL_MS = 4000;
// Minimum cache TTL to prevent excessive API calls
const MIN_CACHE_TTL_MS = 2000;
// Maximum cache TTL cap
const MAX_CACHE_TTL_MS = 10000;

interface LiveChatMessage {
  id: string;
  snippet: {
    type: string;
    publishedAt: string;
    displayMessage?: string;
    textMessageDetails?: { messageText: string };
    superChatDetails?: {
      userComment?: string;
      amountDisplayString?: string;
      tier?: number;
    };
    superStickerDetails?: {
      amountDisplayString?: string;
      tier?: number;
      superStickerMetadata?: { altText?: string };
    };
  };
  authorDetails: {
    channelId: string;
    displayName: string;
    profileImageUrl: string;
    isChatOwner: boolean;
    isChatModerator: boolean;
    isChatSponsor: boolean;
    isVerified: boolean;
  };
}

interface LiveChatResponse {
  nextPageToken?: string;
  pollingIntervalMillis: number;
  offlineAt?: string;
  items: LiveChatMessage[];
}

interface MessagesData {
  items: LiveChatMessage[];
  nextPageToken?: string;
  pollingIntervalMillis: number;
  offlineAt?: string;
}

/**
 * POST /api/youtube/messages
 * Fetches chat messages for a live chat ID
 * 
 * Server-side caching with request coalescing:
 * - Cache key = liveChatId + apiKeyId
 * - TTL = pollingIntervalMillis (YouTube's recommended interval)
 * - Multiple concurrent requests = single YouTube API call
 * - Server owns pageToken for optimal coalescing
 */
export async function POST(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return Response.json(
      { status: "error", code: "MISSING_API_KEY", message: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  // Rate limit by IP
  const clientIp = getClientIp(request);
  const rateCheck = await checkRateLimit(clientIp, "messages");
  if (!rateCheck.allowed) {
    return Response.json(
      { 
        status: "error", 
        code: "RATE_LIMITED", 
        message: "Too many requests. Please try again shortly.",
        retryAfterMs: rateCheck.retryAfterMs,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { liveChatId, apiKey: clientApiKey } = body;
    // Note: We ignore client's pageToken for caching - server owns it

    const activeApiKey = clientApiKey || apiKey;
    const apiKeyId = hashApiKey(clientApiKey);

    if (!liveChatId || typeof liveChatId !== "string") {
      return Response.json(
        { status: "error", code: "INVALID_CHAT_ID", message: "Live chat ID is required" },
        { status: 400 }
      );
    }

    // Generate cache key
    const cacheKey = getCacheKey("messages", liveChatId, apiKeyId);

    // Try to get from cache or fetch fresh
    const result = await getOrFetch<MessagesData>(
      cacheKey,
      async () => {
        // Check global quota before making API call (skip for BYOK)
        if (!clientApiKey && !(await consumeQuota("liveChatMessages.list"))) {
          throw new Error("QUOTA_EXCEEDED");
        }

        // Get server-stored pageToken for this liveChatId
        const storedPageToken = await getStoredPageToken(cacheKey);

        const params = new URLSearchParams({
          part: "snippet,authorDetails",
          liveChatId,
          maxResults: "200",
          key: activeApiKey,
        });

        if (storedPageToken) {
          params.set("pageToken", storedPageToken);
        }

        const response = await fetch(`${YOUTUBE_API_BASE}/liveChat/messages?${params}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to fetch messages");
        }

        const data: LiveChatResponse = await response.json();

        // Determine TTL based on YouTube's polling interval
        const pollingInterval = Math.max(
          MIN_CACHE_TTL_MS,
          Math.min(data.pollingIntervalMillis || DEFAULT_POLLING_INTERVAL_MS, MAX_CACHE_TTL_MS)
        );

        return {
          data: {
            items: data.items,
            nextPageToken: data.nextPageToken,
            pollingIntervalMillis: data.pollingIntervalMillis,
            offlineAt: data.offlineAt,
          },
          ttlMs: pollingInterval,
          pageToken: data.nextPageToken, // Store for next fetch
        };
      },
      { staleWhileRevalidate: true }
    );

    return Response.json({
      status: "success",
      data: result.data,
      meta: {
        fromCache: result.fromCache,
        fetchedAt: result.fetchedAt,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    // Check for quota exceeded
    if (message.includes("quota") || message.includes("Quota")) {
      return Response.json(
        { 
          status: "error", 
          code: "QUOTA_EXCEEDED", 
          message: "API quota exceeded. Try using your own API key (BYOK) or wait until midnight Pacific time." 
        },
        { status: 429 }
      );
    }

    // Check for rate limiting
    if (message.includes("rateLimitExceeded")) {
      return Response.json(
        { 
          status: "error", 
          code: "RATE_LIMITED", 
          message: "Rate limit exceeded. Please slow down requests." 
        },
        { status: 429 }
      );
    }

    // Check for invalid/expired live chat
    if (message.includes("liveChatEnded") || message.includes("liveChatNotFound")) {
      return Response.json(
        { 
          status: "error", 
          code: "CHAT_ENDED", 
          message: "This live chat has ended or is no longer available." 
        },
        { status: 410 }
      );
    }

    return Response.json(
      { status: "error", code: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
