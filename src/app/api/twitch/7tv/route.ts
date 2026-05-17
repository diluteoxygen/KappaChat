/**
 * 7TV Emotes API Route
 *
 * Fetches global 7TV emotes and channel-specific 7TV emotes.
 * Returns a map of `EmoteName -> ImageUrl`.
 */

export const dynamic = "force-dynamic";

// Global cache for emotes
const emoteCache = new Map<string, { map: Record<string, string>; fetchedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface SevenTVEmote {
  name: string;
  data: {
    host: {
      url: string;
    };
  };
}

interface SevenTVGlobalResponse {
  emotes: SevenTVEmote[];
}

interface SevenTVUserResponse {
  emote_set?: {
    emotes: SevenTVEmote[];
  };
}

/**
 * Fetch emotes and map to Name -> URL
 */
function extractEmotes(emotes: SevenTVEmote[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const emote of emotes) {
    if (!emote.data?.host?.url) continue;
    // 7TV host URLs are usually like "//cdn.7tv.app/emote/..."
    // We prefix with "https:" and append the 2x or 3x webp file
    // 2x is a good balance of size and quality
    const baseUrl = emote.data.host.url.startsWith("//")
      ? `https:${emote.data.host.url}`
      : emote.data.host.url;
    map[emote.name] = `${baseUrl}/2x.webp`;
  }
  return map;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const broadcasterId: string | undefined = body.broadcasterId;

    const cacheKey = broadcasterId ?? "global";
    const cached = emoteCache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return Response.json({ status: "success", emotes: cached.map });
    }

    let globalEmotesMap: Record<string, string> = {};
    let channelEmotesMap: Record<string, string> = {};

    // 1. Fetch Global Emotes (Only if not cached globally)
    const globalCached = emoteCache.get("global");
    if (globalCached && Date.now() - globalCached.fetchedAt < CACHE_TTL_MS) {
      globalEmotesMap = globalCached.map;
    } else {
      try {
        const globalRes = await fetch("https://7tv.io/v3/emote-sets/global", {
          // 7TV sometimes requires a brief timeout/abort signal if it hangs
          signal: AbortSignal.timeout(5000),
        });
        if (globalRes.ok) {
          const globalData: SevenTVGlobalResponse = await globalRes.json();
          if (globalData.emotes) {
            globalEmotesMap = extractEmotes(globalData.emotes);
            emoteCache.set("global", { map: globalEmotesMap, fetchedAt: Date.now() });
          }
        }
      } catch (err) {
        console.error("[7TV API] Failed to fetch global emotes:", err);
      }
    }

    // 2. Fetch Channel Emotes
    if (broadcasterId) {
      try {
        const channelRes = await fetch(`https://7tv.io/v3/users/twitch/${broadcasterId}`, {
          signal: AbortSignal.timeout(5000),
        });
        if (channelRes.ok) {
          const channelData: SevenTVUserResponse = await channelRes.json();
          if (channelData.emote_set?.emotes) {
            channelEmotesMap = extractEmotes(channelData.emote_set.emotes);
          }
        }
      } catch (err) {
        console.error(`[7TV API] Failed to fetch channel emotes for ${broadcasterId}:`, err);
      }
    }

    // Channel emotes override global emotes if names collide
    const mergedMap = { ...globalEmotesMap, ...channelEmotesMap };

    // Cache the merged result for this channel
    emoteCache.set(cacheKey, { map: mergedMap, fetchedAt: Date.now() });

    return Response.json({ status: "success", emotes: mergedMap });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[7TV API] Error:", message);
    return Response.json({ status: "error", message });
  }
}
