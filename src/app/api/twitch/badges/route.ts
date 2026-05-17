/**
 * Twitch Badge Images API Route
 *
 * Fetches global badges + channel-specific badges from Twitch Helix API.
 * Returns a map of "setId/version" -> image_url_2x for direct use in UI.
 * Caches globally for 1 hour since badges rarely change.
 */

// Re-use the shared token logic from the users route module-level cache
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppAccessToken(): Promise<string | null> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  if (cachedToken && Date.now() < cachedToken.expiresAt - 300_000) {
    return cachedToken.token;
  }

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return cachedToken.token;
}

// Cache badge maps for 1 hour
const badgeCache = new Map<string, { map: Record<string, string>; fetchedAt: number }>();
const BADGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface TwitchBadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
}

interface TwitchBadgeSet {
  set_id: string;
  versions: TwitchBadgeVersion[];
}

interface TwitchBadgesResponse {
  data: TwitchBadgeSet[];
}

async function fetchBadgeSets(
  url: string,
  clientId: string,
  token: string,
): Promise<Record<string, string>> {
  const res = await fetch(url, {
    headers: {
      "Client-Id": clientId,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return {};

  const data: TwitchBadgesResponse = await res.json();
  const map: Record<string, string> = {};

  for (const set of data.data) {
    for (const version of set.versions) {
      // Key: "setId/versionId" e.g. "subscriber/6", "moderator/1"
      map[`${set.set_id}/${version.id}`] = version.image_url_2x;
    }
  }

  return map;
}

/**
 * POST /api/twitch/badges
 * Body: { broadcasterId?: string }
 * Returns: { badges: Record<"setId/version", imageUrl2x> }
 *
 * Channel badges override global ones with the same set_id/version.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const broadcasterId: string | undefined = body.broadcasterId;

    const cacheKey = broadcasterId ?? "global";
    const cached = badgeCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < BADGE_CACHE_TTL_MS) {
      return Response.json({ status: "success", badges: cached.map });
    }

    const token = await getAppAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    if (!token || !clientId) {
      return Response.json({ status: "success", badges: {} });
    }

    // Always fetch global badges
    const globalBadges = await fetchBadgeSets(
      "https://api.twitch.tv/helix/chat/badges/global",
      clientId,
      token,
    );

    // Fetch channel badges if broadcasterId provided
    let channelBadges: Record<string, string> = {};
    if (broadcasterId) {
      channelBadges = await fetchBadgeSets(
        `https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`,
        clientId,
        token,
      );
    }

    // Channel badges override globals (channel-specific sub tiers etc.)
    const merged = { ...globalBadges, ...channelBadges };

    badgeCache.set(cacheKey, { map: merged, fetchedAt: Date.now() });
    return Response.json({ status: "success", badges: merged });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Twitch Badges] Error:", message);
    return Response.json({ status: "success", badges: {} });
  }
}
