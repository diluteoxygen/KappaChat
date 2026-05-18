import { parseMessageForEmojis, parseTwitchEmotes, injectTwitchCheerEmotes } from "@/lib/emoji-parser";
import type { BadgeType, ChatMessage } from "@/types/youtube";

/** Palette of vibrant colors for Twitch fallback avatars */
const TWITCH_AVATAR_COLORS = [
  "#9146FF", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#F7DC6F", "#BB8FCE", "#F39C12", "#2ECC71",
  "#E74C3C", "#3498DB", "#E91E63", "#00BCD4",
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
 * Parsed IRC message details
 */
export interface ParsedIrcMessage {
  tags: Record<string, string>;
  source: string | null;
  nick: string | null;
  command: string;
  params: string[];
  trailing: string | null;
}

/**
 * General RFC 1459-compliant IRC message parser.
 * Splits tags, source, nick, command, parameters, and trailing payload robustly.
 */
export function parseIrcMessage(rawLine: string): ParsedIrcMessage | null {
  let line = rawLine;
  const tags: Record<string, string> = {};
  let source: string | null = null;
  let nick: string | null = null;
  let trailing: string | null = null;

  // 1. Parse tags prefix
  if (line.startsWith("@")) {
    const spaceIdx = line.indexOf(" ");
    if (spaceIdx === -1) return null;
    const rawTags = line.slice(1, spaceIdx);
    line = line.slice(spaceIdx + 1);

    rawTags.split(";").forEach((entry) => {
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
  }

  // 2. Parse source / prefix
  if (line.startsWith(":")) {
    const spaceIdx = line.indexOf(" ");
    if (spaceIdx === -1) return null;
    source = line.slice(1, spaceIdx);
    line = line.slice(spaceIdx + 1);

    // Extract nick from source (e.g. nick!user@host)
    const bangIdx = source.indexOf("!");
    if (bangIdx !== -1) {
      nick = source.slice(0, bangIdx);
    } else {
      nick = source; // e.g. tmi.twitch.tv
    }
  }

  // 3. Separate middle parameters and trailing parameter
  const colonIdx = line.indexOf(" :");
  if (colonIdx !== -1) {
    trailing = line.slice(colonIdx + 2);
    line = line.slice(0, colonIdx);
  }

  // 4. Parse command and middle params
  const parts = line.split(" ").filter(Boolean);
  if (parts.length === 0) return null;

  const command = parts[0];
  const params = parts.slice(1);

  return {
    tags,
    source,
    nick,
    command,
    params,
    trailing,
  };
}

/**
 * Brand-aligned Twitch Subscription highlight colors
 */
export function getTwitchSubColor(plan: string | undefined): string {
  switch (plan) {
    case "Prime":
      return "#00D2FF"; // Prime Blue/Cyan
    case "2000":
      return "#E91E63"; // Tier 2 Magenta/Pink
    case "3000":
      return "#FF9900"; // Tier 3 Gold/Orange
    case "1000":
    default:
      return "#9146FF"; // Tier 1 / Default Purple
  }
}

/**
 * Brand-aligned Twitch Bits cheer colors
 */
export function getTwitchBitsColor(bits: number): string {
  if (bits >= 10000) return "#FF4B4B"; // Tier 5 Red
  if (bits >= 5000) return "#00C2FF";  // Tier 4 Blue
  if (bits >= 1000) return "#1CF2F2";  // Tier 3 Turquoise
  if (bits >= 100) return "#9146FF";   // Tier 2 Purple
  return "#979797";                    // Tier 1 Grey
}

/**
 * Parses any Twitch IRC message line (supporting PRIVMSG, Bits, and USERNOTICE events)
 * and maps them to the unified ChatMessage shape.
 */
export function parseTwitchMessage(line: string): ChatMessage | null {
  const parsedIrc = parseIrcMessage(line);
  if (!parsedIrc) return null;

  const { tags, nick, command, params, trailing } = parsedIrc;
  const sentAt = Number(tags["tmi-sent-ts"] || Date.now());
  const id = tags.id || `tw_${sentAt}_${nick || "system"}_${Math.random().toString(36).slice(2, 8)}`;
  const displayName = tags["display-name"] || nick || "TwitchUser";
  const userColor = tags.color || undefined;
  const rawBadges = tags.badges || "";

  if (command === "PRIVMSG") {
    const text = trailing || "";
    let messageParts = parseTwitchEmotes(text, tags.emotes || "");

    const hasBits = tags.bits !== undefined;
    const bitsAmount = hasBits ? Number(tags.bits) : 0;

    if (hasBits && bitsAmount > 0) {
      // Inject cheermotes into the message parts
      messageParts = injectTwitchCheerEmotes(messageParts);

      return {
        id: `tw_${id}`,
        source: "twitch",
        authorName: displayName,
        authorAvatarUrl: generateTwitchAvatar(displayName),
        authorChannelId: tags["user-id"] || nick || "",
        message: text,
        messageParts,
        timestamp: new Date(sentAt),
        receivedAt: Date.now(),
        badges: getBadgesFromTags(tags),
        isSuperChat: true,
        superChatAmount: `${bitsAmount} Bits`,
        superChatColor: getTwitchBitsColor(bitsAmount),
        messageType: "superChatEvent",
        authorColor: userColor,
        twitchBadges: parseTwitchBadges(rawBadges),
      };
    }

    return {
      id: `tw_${id}`,
      source: "twitch",
      authorName: displayName,
      authorAvatarUrl: generateTwitchAvatar(displayName),
      authorChannelId: tags["user-id"] || nick || "",
      message: text,
      messageParts,
      timestamp: new Date(sentAt),
      receivedAt: Date.now(),
      badges: getBadgesFromTags(tags),
      isSuperChat: false,
      messageType: "twitchMessageEvent",
      authorColor: userColor,
      twitchBadges: parseTwitchBadges(rawBadges),
    };
  }

  if (command === "USERNOTICE") {
    const msgId = tags["msg-id"];
    const systemMsg = tags["system-msg"] || "";
    const userMessageText = trailing || "";

    const subPlan = tags["msg-param-sub-plan"];
    const subPlanName = subPlan === "Prime" ? "Prime" : subPlan === "3000" ? "Tier 3" : subPlan === "2000" ? "Tier 2" : "Tier 1";

    const commonEventData = {
      id: `tw_${id}`,
      source: "twitch" as const,
      authorName: displayName,
      authorAvatarUrl: generateTwitchAvatar(displayName),
      authorChannelId: tags["user-id"] || nick || "",
      timestamp: new Date(sentAt),
      receivedAt: Date.now(),
      badges: getBadgesFromTags(tags),
      authorColor: userColor,
      twitchBadges: parseTwitchBadges(rawBadges),
    };

    if (msgId === "sub") {
      return {
        ...commonEventData,
        message: systemMsg || `${displayName} subscribed at ${subPlanName}!`,
        isSuperChat: true,
        superChatAmount: `${subPlanName} Sub`,
        superChatColor: getTwitchSubColor(subPlan),
        messageType: "newSponsorEvent",
      };
    }

    if (msgId === "resub") {
      const months = tags["msg-param-cumulative-months"] || "1";
      const messageParts = userMessageText ? parseTwitchEmotes(userMessageText, tags.emotes || "") : undefined;

      return {
        ...commonEventData,
        message: userMessageText || systemMsg || `${displayName} resubscribed for ${months} months!`,
        messageParts,
        isSuperChat: true,
        superChatAmount: `RESUB (${months}m)`,
        superChatColor: getTwitchSubColor(subPlan),
        messageType: "memberMilestoneChatEvent",
      };
    }

    if (msgId === "subgift") {
      const recipientDisplayName = tags["msg-param-recipient-display-name"] || tags["msg-param-recipient-user-name"] || "Someone";
      return {
        ...commonEventData,
        message: systemMsg || `${displayName} gifted a ${subPlanName} subscription to ${recipientDisplayName}!`,
        isSuperChat: true,
        superChatAmount: "GIFT SUB",
        superChatColor: "#E91E63", // Pink
        messageType: "giftMembershipReceivedEvent",
      };
    }

    if (msgId === "submysterygift") {
      const giftCount = Number(tags["msg-param-mass-gift-count"] || "1");
      return {
        ...commonEventData,
        message: systemMsg || `${displayName} gifted ${giftCount} ${subPlanName} subscriptions to the community!`,
        isSuperChat: true,
        superChatAmount: `GIFT ${giftCount} SUBS`,
        superChatColor: "#E91E63", // Pink
        messageType: "membershipGiftingEvent",
      };
    }

    if (msgId === "giftpaidupgrade" || msgId === "anongiftpaidupgrade") {
      return {
        ...commonEventData,
        message: systemMsg || `${displayName} continued their gifted subscription!`,
        isSuperChat: true,
        superChatAmount: "SUB UPGRADE",
        superChatColor: "#9146FF",
        messageType: "newSponsorEvent",
      };
    }

    if (msgId === "raid") {
      const raiderName = tags["msg-param-displayName"] || tags["msg-param-login"] || displayName;
      const viewerCount = tags["msg-param-viewerCount"] || "0";
      return {
        ...commonEventData,
        authorName: raiderName,
        message: systemMsg || `${raiderName} is raiding with ${viewerCount} viewers!`,
        isSuperChat: true,
        superChatAmount: `RAID (${viewerCount})`,
        superChatColor: "#10B981", // Emerald Green
        messageType: "newSponsorEvent",
      };
    }
  }

  return null;
}

/**
 * For backwards compatibility, wraps the new parseTwitchMessage function.
 */
export function parseTwitchPrivmsg(line: string): ChatMessage | null {
  return parseTwitchMessage(line);
}