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
