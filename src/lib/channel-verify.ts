/**
 * Channel verification for YouTube API access control
 * 
 * Since YouTube API doesn't expose verification badge status directly,
 * we use subscriber count as a proxy: channels with 100K+ subscribers
 * are eligible for YouTube's verification badge.
 * 
 * This allows any "verified-eligible" channel's streams to be viewed
 * without requiring users to bring their own API key.
 */

import { getOrFetch, getCacheKey } from "@/lib/cache";
import { consumeQuota } from "@/lib/rate-limit";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/** Minimum subscriber count to be considered "verified-eligible" */
const MIN_SUBSCRIBER_COUNT = 100_000;

/** Cache channel verification for 1 hour (channels don't lose verification quickly) */
const CHANNEL_VERIFY_TTL_MS = 60 * 60 * 1000;

interface ChannelStatistics {
  subscriberCount?: string;
  hiddenSubscriberCount?: boolean;
}

interface ChannelItem {
  id: string;
  statistics?: ChannelStatistics;
}

interface ChannelListResponse {
  items?: ChannelItem[];
}

interface ChannelVerifyResult {
  verified: boolean;
  subscriberCount: number;
  hiddenSubscriberCount: boolean;
}

/**
 * Check if a YouTube channel is "verified-eligible" (100K+ subscribers)
 * Results are cached for 1 hour to minimize API quota usage.
 * 
 * @returns verification result or null if quota exceeded
 */
export async function verifyChannel(
  channelId: string,
  apiKey: string
): Promise<ChannelVerifyResult | null> {
  const cacheKey = getCacheKey("connect", `verify:${channelId}`, "server");

  const result = await getOrFetch<ChannelVerifyResult>(
    cacheKey,
    async () => {
      // Check quota before making API call
      if (!(await consumeQuota("channels.list"))) {
        throw new Error("QUOTA_EXCEEDED");
      }

      const params = new URLSearchParams({
        part: "statistics",
        id: channelId,
        key: apiKey,
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/channels?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to fetch channel info");
      }

      const data: ChannelListResponse = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("CHANNEL_NOT_FOUND");
      }

      const channel = data.items[0];
      const stats = channel.statistics;
      const hiddenSubscriberCount = stats?.hiddenSubscriberCount ?? false;
      const subscriberCount = parseInt(stats?.subscriberCount || "0", 10);

      return {
        data: {
          verified: !hiddenSubscriberCount && subscriberCount >= MIN_SUBSCRIBER_COUNT,
          subscriberCount,
          hiddenSubscriberCount,
        },
        ttlMs: CHANNEL_VERIFY_TTL_MS,
      };
    },
    { staleWhileRevalidate: true }
  );

  return result.data;
}
