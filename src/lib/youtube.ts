import type {
  LiveChatMessage,
  LiveChatMessagesResponse,
  VideoDetailsResponse,
  ChatMessage,
  BadgeType,
} from "@/types/youtube";
import { parseMessageForEmojis } from "@/lib/emoji-parser";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Extract video ID from various YouTube URL formats
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/live/
 */
export function extractVideoId(input: string): string | null {
  // If it's already just a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) {
    return input.trim();
  }

  try {
    const url = new URL(input);

    // Handle youtu.be short links
    if (url.hostname === "youtu.be") {
      return url.pathname.slice(1) || null;
    }

    // Handle youtube.com URLs
    if (url.hostname.includes("youtube.com")) {
      // /watch?v=VIDEO_ID
      const vParam = url.searchParams.get("v");
      if (vParam) return vParam;

      // /live/VIDEO_ID
      const liveMatch = url.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) return liveMatch[1];

      // /embed/VIDEO_ID
      const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) return embedMatch[1];
    }
  } catch {
    // Not a valid URL, return null
    return null;
  }

  return null;
}

/**
 * Extracts a handle, channel ID, or custom name from direct input or YouTube URLs
 */
export function extractChannelIdentifier(input: string): { handle?: string; channelId?: string; name?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // If it's a handle directly
  if (trimmed.startsWith("@")) {
    return { handle: trimmed };
  }

  // If it's a channel ID directly (starts with UC and is 24 chars)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { channelId: trimmed };
  }

  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes("youtube.com")) {
      // Handles: youtube.com/@username
      const handleMatch = url.pathname.match(/^\/(@[a-zA-Z0-9_.-]+)/);
      if (handleMatch) return { handle: handleMatch[1] };

      // Channel IDs: youtube.com/channel/UC...
      const idMatch = url.pathname.match(/^\/channel\/(UC[a-zA-Z0-9_-]{22})/);
      if (idMatch) return { channelId: idMatch[1] };

      // Custom/legacy URLs: youtube.com/c/name or youtube.com/user/name
      const customMatch = url.pathname.match(/^\/(?:c|user)\/([a-zA-Z0-9_.-]+)/);
      if (customMatch) return { name: customMatch[1] };
    }
  } catch {
    // Ignore URL parse error, treat as name
  }

  // Treat as plain name/handle
  return { name: trimmed };
}

/**
 * Resolves a YouTube channel URL or /live URL to an active live stream video ID
 * Server-side only (due to CORS restrictions on browser fetches)
 */
export async function resolveLiveVideoId(urlOrChannel: string, apiKey?: string): Promise<string | null> {
  const trimmed = urlOrChannel.trim();

  // 1. Check if it's already a video ID or video URL
  const videoId = extractVideoId(trimmed);
  if (videoId) {
    return videoId;
  }

  const channelInfo = extractChannelIdentifier(trimmed);
  if (!channelInfo) {
    return null;
  }

  // 2. Try YouTube Data API v3 (Official API, most stable when API Key is available)
  const activeApiKey = apiKey || process.env.YOUTUBE_API_KEY;
  if (activeApiKey) {
    try {
      let resolvedChannelId = channelInfo.channelId;

      // Resolve handle or name to channelId
      if (!resolvedChannelId && (channelInfo.handle || channelInfo.name)) {
        const rawHandle = channelInfo.handle || channelInfo.name || "";
        const cleanHandle = rawHandle.startsWith("@") ? rawHandle : "@" + rawHandle;
        
        const resolveUrl = `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${encodeURIComponent(cleanHandle)}&key=${activeApiKey}`;
        const resolveResponse = await fetch(resolveUrl);
        if (resolveResponse.ok) {
          const resolveData = await resolveResponse.json();
          if (resolveData.items && resolveData.items.length > 0) {
            resolvedChannelId = resolveData.items[0].id;
          }
        }
      }

      // If channel ID resolved, check for active live broadcast
      if (resolvedChannelId) {
        const searchUrl = `${YOUTUBE_API_BASE}/search?part=id&channelId=${encodeURIComponent(resolvedChannelId)}&eventType=live&type=video&key=${activeApiKey}`;
        const searchResponse = await fetch(searchUrl);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.items && searchData.items.length > 0) {
            return searchData.items[0].id.videoId;
          }
        }
      }
    } catch (err) {
      console.warn("YouTube Data API v3 live resolution failed, falling back to InnerTube:", err);
    }
  }

  // 3. Try InnerTube Search (Fast, robust, immune to direct HTML scrape blocks)
  try {
    const { createInnerTube } = await import("@/lib/innertube");
    const yt = await createInnerTube();
    
    // Search query can be the handle, channel ID, or name
    const searchQuery = channelInfo.handle || channelInfo.channelId || channelInfo.name || trimmed;
    const results = await yt.search(searchQuery);
    
    if (results.results) {
      // First, let's extract the target channel ID if we find a Channel node in results
      let targetChannelId = channelInfo.channelId;
      if (!targetChannelId) {
        const channelNode = results.results.find(item => item.type === "Channel") as any;
        if (channelNode) {
          targetChannelId = channelNode.id;
        }
      }

      // Look for any live video in results
      for (const item of results.results) {
        if (item.type === "Video") {
          const video = item as any;
          if (video.is_live) {
            const authorId = video.author?.id;
            if (!targetChannelId || authorId === targetChannelId) {
              return video.id;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("InnerTube search resolution failed, falling back to HTML fetch:", err);
  }

  // 3. Fallback: Raw HTML Scraping of /live page
  let scrapeUrl = trimmed;
  if (!scrapeUrl.startsWith("http")) {
    const handle = scrapeUrl.startsWith("@") ? scrapeUrl : `@${scrapeUrl}`;
    scrapeUrl = `https://www.youtube.com/${handle}/live`;
  }

  if (scrapeUrl.includes("youtube.com") && !scrapeUrl.includes("watch?v=") && !scrapeUrl.includes("/live/") && !scrapeUrl.includes("/embed/")) {
    if (!scrapeUrl.endsWith("/live")) {
      scrapeUrl = scrapeUrl.replace(/\/$/, "") + "/live";
    }
  }

  try {
    const res = await fetch(scrapeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return null;
    const html = await res.text();

    // 1. Try canonical link watch?v= or /live/
    const canonicalMatch = html.match(/<link rel="canonical"[^>]*href="[^"]*(?:watch\?v=|\/live\/)([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) {
      const matchedId = canonicalMatch[1];
      // Verify that it is actually a live video and not a channel redirection past upload link
      if (html.includes(`"videoId":"${matchedId}"`) && (html.includes(`"isLive":true`) || html.includes(`"isLiveStream":true`) || html.includes(`"liveStreamability"`))) {
        return matchedId;
      }
    }

    // 2. Try videoId JSON match
    const videoIdMatch = html.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    if (videoIdMatch) {
      const matchedId = videoIdMatch[1];
      if (html.includes(`"isLive":true`) || html.includes(`"isLiveStream":true`) || html.includes(`"liveStreamability"`)) {
        return matchedId;
      }
    }
  } catch (err) {
    console.error("HTML scrape fallback failed:", err);
  }

  return null;
}

/**
 * Get the live chat ID for a video
 */
export async function getLiveChatId(
  videoId: string,
  apiKey: string
): Promise<string | null> {
  const params = new URLSearchParams({
    part: "liveStreamingDetails",
    id: videoId,
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch video details");
  }

  const data: VideoDetailsResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }

  const liveChatId = data.items[0]?.liveStreamingDetails?.activeLiveChatId;

  if (!liveChatId) {
    throw new Error("This video does not have an active live chat");
  }

  return liveChatId;
}

/**
 * Fetch live chat messages
 */
export async function fetchChatMessages(
  liveChatId: string,
  apiKey: string,
  pageToken?: string
): Promise<LiveChatMessagesResponse> {
  const params = new URLSearchParams({
    part: "snippet,authorDetails",
    liveChatId,
    maxResults: "200",
    key: apiKey,
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/liveChat/messages?${params}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to fetch chat messages");
  }

  return response.json();
}

/**
 * Get SuperChat tier color based on amount
 */
function getSuperChatColor(tier: number): string {
  const colors: Record<number, string> = {
    1: "#1565c0", // Blue
    2: "#00bfa5", // Teal
    3: "#ffca28", // Yellow
    4: "#f57c00", // Orange
    5: "#e91e63", // Pink
    6: "#e62117", // Red
    7: "#e62117", // Red (highest)
  };
  return colors[tier] || colors[1];
}

/**
 * Get badges for a user based on their author details
 */
function getBadges(author: LiveChatMessage["authorDetails"]): BadgeType[] {
  const badges: BadgeType[] = [];

  if (author.isChatOwner) badges.push("owner");
  if (author.isChatModerator) badges.push("moderator");
  if (author.isChatSponsor) badges.push("member");
  if (author.isVerified) badges.push("verified");

  return badges;
}

/**
 * Transform YouTube API message to our ChatMessage format
 */
export function transformMessage(msg: LiveChatMessage): ChatMessage {
  const { snippet, authorDetails } = msg;

  // Get display message from various message types
  let message = "";
  let isSuperChat = false;
  let superChatAmount: string | undefined;
  let superChatColor: string | undefined;

  switch (snippet.type) {
    case "textMessageEvent":
      message = snippet.textMessageDetails?.messageText || "";
      break;
    case "superChatEvent":
      message = snippet.superChatDetails?.userComment || "";
      isSuperChat = true;
      superChatAmount = snippet.superChatDetails?.amountDisplayString;
      superChatColor = getSuperChatColor(snippet.superChatDetails?.tier || 1);
      break;
    case "superStickerEvent":
      message = `[Super Sticker: ${snippet.superStickerDetails?.superStickerMetadata?.altText || "Sticker"}]`;
      isSuperChat = true;
      superChatAmount = snippet.superStickerDetails?.amountDisplayString;
      superChatColor = getSuperChatColor(snippet.superStickerDetails?.tier || 1);
      break;
    default:
      message = snippet.displayMessage || "";
  }

  // Parse message for emojis to populate messageParts
  const messageParts = parseMessageForEmojis(message);

  return {
    id: msg.id,
    authorName: authorDetails.displayName,
    authorAvatarUrl: authorDetails.profileImageUrl,
    authorChannelId: authorDetails.channelId,
    message,
    messageParts,
    timestamp: new Date(snippet.publishedAt),
    badges: getBadges(authorDetails),
    isSuperChat,
    superChatAmount,
    superChatColor,
    messageType: snippet.type,
  };
}
