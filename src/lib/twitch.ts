import { parseMessageForEmojis, parseTwitchEmotes } from "@/lib/emoji-parser";
import type { BadgeType, ChatMessage } from "@/types/youtube";

/** Palette of vibrant colors for Twitch fallback avatars */
const TWITCH_AVATAR_COLORS = [
  "#9146FF", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#F7DC6F", "#BB8FCE", "#F39C12", "#2ECC71",
  "#E74C3C", "#3498DB", "#E91E8C", "#00BCD4",
];

/**
 * Generate a deterministic colored SVG avatar for a Twitch user.
 * Used as fallback when real avatars aren't available.
 */
export function generateTwitchAvatar(displayName: string): string {
  const initial = (displayName.charAt(0) || "?").toUpperCase();

  let hash = 0;
  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = TWITCH_AVATAR_COLORS[Math.abs(hash) % TWITCH_AVATAR_COLORS.length];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="${color}"/><text x="20" y="26" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="white" text-anchor="middle">${initial}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const RESERVED_PATH_SEGMENTS = new Set([
  "directory",
  "downloads",
  "jobs",
  "login",
  "p",
  "products",
  "settings",
  "store",
  "subscriptions",
  "videos",
]);

function normalizeChannelName(raw: string): string {
  return raw.trim().replace(/^@/, "").replace(/^#/, "").toLowerCase();
}

/**
 * Extract Twitch channel name from URL or plain channel input.
 */
export function extractTwitchChannel(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_]{3,25}$/.test(trimmed)) {
    return normalizeChannelName(trimmed);
  }

  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes("twitch.tv")) return null;

    const segments = url.pathname
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean);

    if (segments.length === 0) return null;
    const candidate = normalizeChannelName(segments[0]);

    if (!candidate || RESERVED_PATH_SEGMENTS.has(candidate)) {
      return null;
    }

    return /^[a-zA-Z0-9_]{3,25}$/.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

function parseIrcTags(raw: string): Record<string, string> {
  const tags: Record<string, string> = {};

  raw.split(";").forEach((entry) => {
    const eqIdx = entry.indexOf("=");
    if (eqIdx === -1) {
      tags[entry] = "";
      return;
    }
    const key = entry.slice(0, eqIdx);
    const value = entry.slice(eqIdx + 1);
    tags[key] = value
      .replace(/\\s/g, " ")
      .replace(/\\:/g, ";")
      .replace(/\\\\/g, "\\")
      .replace(/\\r/g, "\r")
      .replace(/\\n/g, "\n");
  });

  return tags;
}

/**
 * Extract badges from IRC tags into our BadgeType array.
 * Covers broadcaster, moderator, VIP, subscriber, turbo, and premium.
 */
function getBadgesFromTags(tags: Record<string, string>): BadgeType[] {
  const badgeSet = new Set<BadgeType>();
  const rawBadges = tags.badges || "";

  rawBadges.split(",").forEach((badge) => {
    const name = badge.split("/")[0];
    switch (name) {
      case "broadcaster":
        badgeSet.add("owner");
        badgeSet.add("broadcaster");
        break;
      case "moderator":
        badgeSet.add("moderator");
        break;
      case "vip":
        badgeSet.add("vip");
        break;
      case "subscriber":
      case "founder":
        badgeSet.add("subscriber");
        badgeSet.add("member");
        break;
      case "turbo":
        badgeSet.add("turbo");
        break;
      case "premium":
        badgeSet.add("prime");
        break;
      default:
        break;
    }
  });

  return Array.from(badgeSet);
}

/**
 * Parse raw IRC badge tag into structured array.
 * e.g. "broadcaster/1,subscriber/6,vip/1" → [{setId:"broadcaster",version:"1"},...]
 */
function parseTwitchBadges(raw: string): Array<{ setId: string; version: string }> {
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => {
      const slashIdx = entry.indexOf("/");
      if (slashIdx === -1) return null;
      return { setId: entry.slice(0, slashIdx), version: entry.slice(slashIdx + 1) };
    })
    .filter((b): b is { setId: string; version: string } => b !== null);
}

/**
 * Parse a Twitch IRC PRIVMSG line into the app ChatMessage shape.
 */
export function parseTwitchPrivmsg(line: string): ChatMessage | null {
  if (!line.includes(" PRIVMSG ")) return null;

  let tags: Record<string, string> = {};
  let payload = line;

  if (payload.startsWith("@")) {
    const splitIndex = payload.indexOf(" :");
    if (splitIndex > 1) {
      tags = parseIrcTags(payload.slice(1, splitIndex));
      payload = payload.slice(splitIndex + 1);
    }
  }

  const messageMatch = payload.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.*)$/);
  if (!messageMatch) return null;

  const nick = messageMatch[1];
  const text = messageMatch[2] || "";
  const sentAt = Number(tags["tmi-sent-ts"] || Date.now());
  const id = tags.id || `tw_${sentAt}_${nick}_${Math.random().toString(36).slice(2, 8)}`;
  const displayName = tags["display-name"] || nick;
  const userColor = tags.color || undefined;
  const rawBadges = tags.badges || "";

  return {
    id: `tw_${id}`,
    source: "twitch",
    authorName: displayName,
    authorAvatarUrl: generateTwitchAvatar(displayName),
    authorChannelId: tags["user-id"] || nick,
    message: text,
    messageParts: parseTwitchEmotes(text, tags.emotes || ""),
    timestamp: new Date(sentAt),
    receivedAt: Date.now(),
    badges: getBadgesFromTags(tags),
    isSuperChat: false,
    messageType: "twitchMessageEvent",
    authorColor: userColor,
    twitchBadges: parseTwitchBadges(rawBadges),
  };
}