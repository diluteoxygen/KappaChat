/**
 * 7TV Emotes API Route (Extended with BetterTTV & FrankerFaceZ Integration)
 *
 * Fetches global 7TV, BTTV, and FFZ emotes, and channel-specific emotes.
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
 * Fetch 7TV emotes and map to Name -> URL
 */
function extract7TVEmotes(emotes: SevenTVEmote[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(emotes)) return map;
  for (const emote of emotes) {
    if (!emote.data?.host?.url) continue;
    // 7TV host URLs are usually like "//cdn.7tv.app/emote/..."
    const baseUrl = emote.data.host.url.startsWith("//")
      ? `https:${emote.data.host.url}`
      : emote.data.host.url;
    map[emote.name] = `${baseUrl}/2x.webp`;
  }
  return map;
}

/**
 * Parse BetterTTV (BTTV) emotes
 */
function extractBTTVEmotes(emotes: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(emotes)) return map;
  for (const emote of emotes) {
    if (!emote.id || !emote.code) continue;
    map[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/2x`;
  }
  return map;
}

function extractBTTVChannelEmotes(data: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!data) return map;
  if (Array.isArray(data.channelEmotes)) {
    Object.assign(map, extractBTTVEmotes(data.channelEmotes));
  }
  if (Array.isArray(data.sharedEmotes)) {
    Object.assign(map, extractBTTVEmotes(data.sharedEmotes));
  }
  return map;
}

/**
 * Parse FrankerFaceZ (FFZ) emotes
 */
function extractFFZEmotes(emoticons: any[]): Record<string, string> {
  const map: Record<string, string> = {};
  if (!Array.isArray(emoticons)) return map;
  for (const emote of emoticons) {
    if (!emote.name || !emote.urls) continue;
    // Use 2x URL if present, fallback to 1x URL
    const relativeUrl = emote.urls["2"] || emote.urls["1"];
    if (!relativeUrl) continue;
    const url = relativeUrl.startsWith("//") ? `https:${relativeUrl}` : relativeUrl;
    map[emote.name] = url;
  }
  return map;
}

function extractFFZGlobalEmotes(data: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!data || !data.sets) return map;
  for (const set of Object.values(data.sets) as any[]) {
    if (Array.isArray(set.emoticons)) {
      Object.assign(map, extractFFZEmotes(set.emoticons));
    }
  }
  return map;
}

function extractFFZChannelEmotes(data: any): Record<string, string> {
  const map: Record<string, string> = {};
  if (!data || !data.room || !data.sets) return map;
  const setKey = String(data.room.set);
  const set = data.sets[setKey];
  if (set && Array.isArray(set.emoticons)) {
    Object.assign(map, extractFFZEmotes(set.emoticons));
  }
  return map;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const broadcasterId: string | undefined = body.broadcasterId;

    // Validate broadcasterId to prevent SSRF vulnerabilities
    if (broadcasterId && !/^[a-zA-Z0-9_-]+$/.test(broadcasterId)) {
      return Response.json({ status: "error", message: "Invalid broadcaster ID format" });
    }

    const cacheKey = broadcasterId ?? "global";
    const cached = emoteCache.get(cacheKey);

    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return Response.json({ status: "success", emotes: cached.map });
    }

    let globalEmotesMap: Record<string, string> = {};

    // 1. Fetch Global Emotes (Only if not cached globally)
    const globalCached = emoteCache.get("global");
    if (globalCached && Date.now() - globalCached.fetchedAt < CACHE_TTL_MS) {
      globalEmotesMap = globalCached.map;
    } else {
      try {
        const results = await Promise.allSettled([
          // 7TV Global Emotes
          fetch("https://7tv.io/v3/emote-sets/global", { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
          // BetterTTV Global Emotes
          fetch("https://api.betterttv.net/3/cached/emotes/global", { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
          // FrankerFaceZ Global Emotes
          fetch("https://api.frankerfacez.com/v1/set/global", { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
        ]);

        const map7tv = results[0].status === "fulfilled" && results[0].value ? extract7TVEmotes(results[0].value.emotes) : {};
        const mapBttv = results[1].status === "fulfilled" && results[1].value ? extractBTTVEmotes(results[1].value) : {};
        const mapFfz = results[2].status === "fulfilled" && results[2].value ? extractFFZGlobalEmotes(results[2].value) : {};

        // Merge global emotes (7TV has highest priority, then BTTV, then FFZ)
        globalEmotesMap = { ...mapFfz, ...mapBttv, ...map7tv };

        // Only cache global emotes if we successfully fetched at least some global emotes
        if (Object.keys(globalEmotesMap).length > 0) {
          emoteCache.set("global", { map: globalEmotesMap, fetchedAt: Date.now() });
        }
      } catch (err) {
        console.error("[Emote API] Failed to fetch global emotes:", err);
      }
    }

    let channelEmotesMap: Record<string, string> = {};

    // 2. Fetch Channel Emotes
    if (broadcasterId) {
      try {
        const results = await Promise.allSettled([
          // 7TV Channel Emotes
          fetch(`https://7tv.io/v3/users/twitch/${broadcasterId}`, { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
          // BetterTTV Channel Emotes
          fetch(`https://api.betterttv.net/3/cached/users/twitch/${broadcasterId}`, { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
          // FrankerFaceZ Channel Emotes
          fetch(`https://api.frankerfacez.com/v1/room/id/${broadcasterId}`, { signal: AbortSignal.timeout(5000) })
            .then(r => r.ok ? r.json() : null),
        ]);

        const map7tv = results[0].status === "fulfilled" && results[0].value?.emote_set?.emotes
          ? extract7TVEmotes(results[0].value.emote_set.emotes)
          : {};
        const mapBttv = results[1].status === "fulfilled" && results[1].value ? extractBTTVChannelEmotes(results[1].value) : {};
        const mapFfz = results[2].status === "fulfilled" && results[2].value ? extractFFZChannelEmotes(results[2].value) : {};

        // Merge channel emotes (7TV overrides BTTV, which overrides FFZ)
        channelEmotesMap = { ...mapFfz, ...mapBttv, ...map7tv };
      } catch (err) {
        console.error(`[Emote API] Failed to fetch channel emotes for ${broadcasterId}:`, err);
      }
    }

    // Merge: Channel emotes override global emotes if names collide
    const mergedMap = { ...globalEmotesMap, ...channelEmotesMap };

    // Cache the merged result for this channel/key
    if (Object.keys(mergedMap).length > 0) {
      emoteCache.set(cacheKey, { map: mergedMap, fetchedAt: Date.now() });
    }

    return Response.json({ status: "success", emotes: mergedMap });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Emote API] Error:", message);
    return Response.json({ status: "error", message });
  }
}
