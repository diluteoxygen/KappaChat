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
 * Resolves a YouTube channel URL or /live URL to an active live stream video ID
 * Server-side only (due to CORS restrictions on browser fetches)
 */
export async function resolveLiveVideoId(urlOrChannel: string): Promise<string | null> {
  let url = urlOrChannel.trim();

  // If it's already just a video ID (11 characters)
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
    return url;
  }

  // Format shorthand channel handles like '@username' or 'username'
  if (!url.startsWith("http")) {
    const handle = url.startsWith("@") ? url : `@${url}`;
    url = `https://www.youtube.com/${handle}/live`;
  }

  // If it's a channel URL but doesn't end with /live or have a video ID
  if (url.includes("youtube.com") && !url.includes("watch?v=") && !url.includes("/live/") && !url.includes("/embed/")) {
    if (!url.endsWith("/live")) {
      url = url.replace(/\/$/, "") + "/live";
    }
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) return null;

    const html = await res.text();

    // 1. Try canonical link watch?v= or /live/
    const canonicalMatch = html.match(/<link rel="canonical"[^>]*href="[^"]*(?:watch\?v=|\/live\/)([a-zA-Z0-9_-]{11})"/);
    if (canonicalMatch) {
      return canonicalMatch[1];
    }

    // 2. Try matching any link to watch?v= or /live/ in the html
    const watchMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) {
      return watchMatch[1];
    }

    const livePathMatch = html.match(/\/live\/([a-zA-Z0-9_-]{11})/);
    if (livePathMatch) {
      return livePathMatch[1];
    }
  } catch (err) {
    console.error("Failed to resolve live video ID:", err);
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
