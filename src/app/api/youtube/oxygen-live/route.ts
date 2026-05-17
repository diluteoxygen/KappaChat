import type { NextRequest } from "next/server";
import { getCacheKey, getOrFetch } from "@/lib/cache";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const OXYGEN_CHANNEL_ID = "UCbRP3c757lWg9M-U7TyEkXA";

// Cache for 120 seconds to avoid burning quota (search API costs 100 units)
const LIVE_STATUS_CACHE_TTL_MS = 120 * 1000;

interface SearchResponse {
  items?: Array<{
    id?: {
      videoId?: string;
    };
  }>;
}

interface OxygenLiveData {
  isLive: boolean;
  videoId?: string;
}

/**
 * GET /api/youtube/oxygen-live
 * Checks if DiluteOxygen (@DiluteOxygen) is currently live streaming.
 * Returns the video ID if live, or indicates offline status.
 * Results are cached for 120 seconds to minimize API quota usage.
 */
export async function GET(request: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return Response.json(
      { status: "error", code: "MISSING_API_KEY", message: "YouTube API key not configured" },
      { status: 500 }
    );
  }

  try {
    const cacheKey = getCacheKey("connect", `oxygen-live:${OXYGEN_CHANNEL_ID}`, "server");

    const result = await getOrFetch<OxygenLiveData>(
      cacheKey,
      async () => {
        // Use search endpoint to check for live streams
        const params = new URLSearchParams({
          part: "snippet",
          channelId: OXYGEN_CHANNEL_ID,
          eventType: "live",
          type: "video",
          key: apiKey,
        });

        const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error?.message || "Failed to check live status");
        }

        const data: SearchResponse = await response.json();

        // If items array has entries, the channel is live
        const isLive = !!(data.items && data.items.length > 0);
        const videoId = isLive ? data.items![0].id?.videoId : undefined;

        return {
          data: {
            isLive,
            videoId,
          },
          ttlMs: LIVE_STATUS_CACHE_TTL_MS,
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
    
    return Response.json(
      { status: "error", code: "INTERNAL_ERROR", message },
      { status: 500 }
    );
  }
}
