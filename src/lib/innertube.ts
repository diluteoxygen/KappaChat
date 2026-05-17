/**
 * InnerTube (YouTube.js) chat provider
 * Uses YouTube's internal API via youtubei.js - no API key, no quota limits
 * Server-side only
 */

import { Innertube, UniversalCache, YTNodes, Parser } from "youtubei.js";
import type { ChatMessage, BadgeType, MessageType } from "@/types/youtube";
import { extractMessageRuns } from "@/lib/emoji-parser";

/**
 * Suppress non-fatal parser type mismatches from YouTube API schema drift.
 * These occur when YouTube serves ListItemView in context menus instead of
 * expected MenuServiceItem | MenuServiceItemDownload. Safe to ignore.
 * 
 * Module-level setup: runs once per process, not per-request.
 */
Parser.setParserErrorHandler(({ error_type }) => {
  if (error_type === "typecheck") return; // Suppress non-fatal type mismatches
  // All other error types (parse, mutation_data_*, class_not_found, etc.) still log normally
});

/**
 * Create a fresh Innertube instance
 * Each SSE connection gets its own instance to avoid shared state issues
 */
export async function createInnerTube(): Promise<Innertube> {
  return Innertube.create({ cache: new UniversalCache(false) });
}

/**
 * Convert ARGB integer to hex color string
 */
function argbToHex(argb: number): string {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/**
 * Extract badges from InnerTube Author object
 */
function getInnerTubeBadges(author: {
  is_moderator?: boolean;
  is_verified?: boolean;
  badges: Iterable<{ is: (type: typeof YTNodes.LiveChatAuthorBadge) => boolean; as: (type: typeof YTNodes.LiveChatAuthorBadge) => { icon_type?: string; style?: string } }>;
}): BadgeType[] {
  const badges: BadgeType[] = [];

  if (author.is_moderator) badges.push("moderator");
  if (author.is_verified) badges.push("verified");

  for (const badge of author.badges) {
    if (badge.is(YTNodes.LiveChatAuthorBadge)) {
      const lcBadge = badge.as(YTNodes.LiveChatAuthorBadge);
      if (lcBadge.icon_type === "OWNER") badges.push("owner");
      if (lcBadge.style?.includes("MEMBER")) badges.push("member");
    }
  }

  return badges;
}

/**
 * Transform an InnerTube chat item (from AddChatItemAction) into our ChatMessage type
 * Returns null for unsupported message types
 */
export function transformInnerTubeItem(
  item: InstanceType<typeof YTNodes.AddChatItemAction>["item"],
): ChatMessage | null {
  if (!item) return null;

  // Normal text message
  if (item.is(YTNodes.LiveChatTextMessage)) {
    const msg = item.as(YTNodes.LiveChatTextMessage);
    const messageParts = extractMessageRuns(msg.message);
    const messageText = messageParts
      .map(part => part.value)
      .join("");
    const messageHtml = msg.message.toHTML();
    return {
      id: msg.id,
      authorName: msg.author.name.replace(/^@/, ''),
      authorAvatarUrl: msg.author.best_thumbnail?.url || "",
      authorChannelId: msg.author.id,
      message: messageText,
      messageHtml: messageHtml || undefined,
      messageParts: messageParts.length > 0 ? messageParts : undefined,
      timestamp: new Date(msg.timestamp),
      badges: getInnerTubeBadges(msg.author),
      isSuperChat: false,
      messageType: "textMessageEvent" as MessageType,
    };
  }

  // Super Chat
  if (item.is(YTNodes.LiveChatPaidMessage)) {
    const sc = item.as(YTNodes.LiveChatPaidMessage);
    const messageParts = extractMessageRuns(sc.message);
    const messageText = messageParts
      .map(part => part.value)
      .join("");
    const messageHtml = sc.message.toHTML();
    return {
      id: sc.id,
      authorName: sc.author.name.replace(/^@/, ''),
      authorAvatarUrl: sc.author.best_thumbnail?.url || "",
      authorChannelId: sc.author.id,
      message: messageText,
      messageHtml: messageHtml || undefined,
      messageParts: messageParts.length > 0 ? messageParts : undefined,
      timestamp: new Date(sc.timestamp),
      badges: getInnerTubeBadges(sc.author),
      isSuperChat: true,
      superChatAmount: sc.purchase_amount,
      superChatColor: argbToHex(sc.header_background_color),
      messageType: "superChatEvent" as MessageType,
    };
  }

  // Super Sticker
  if (item.is(YTNodes.LiveChatPaidSticker)) {
    const ps = item.as(YTNodes.LiveChatPaidSticker);
    return {
      id: ps.id,
      authorName: ps.author.name.replace(/^@/, ''),
      authorAvatarUrl: ps.author.best_thumbnail?.url || "",
      authorChannelId: ps.author.id,
      message: `[Super Sticker: ${ps.sticker_accessibility_label || "Sticker"}]`,
      timestamp: new Date(ps.timestamp),
      badges: getInnerTubeBadges(ps.author),
      isSuperChat: true,
      superChatAmount: ps.purchase_amount,
      superChatColor: argbToHex(ps.money_chip_background_color),
      messageType: "superStickerEvent" as MessageType,
    };
  }

  // Membership join/milestone
  if (item.is(YTNodes.LiveChatMembershipItem)) {
    const mem = item.as(YTNodes.LiveChatMembershipItem);
    const headerText = mem.header_primary_text?.toString() || "";
    const messageText = mem.message?.toString() || headerText;
    return {
      id: mem.id,
      authorName: mem.author.name.replace(/^@/, ''),
      authorAvatarUrl: mem.author.best_thumbnail?.url || "",
      authorChannelId: mem.author.id,
      message: messageText || `[New Member: ${mem.header_subtext?.toString() || ""}]`,
      timestamp: new Date(mem.timestamp),
      badges: getInnerTubeBadges(mem.author),
      isSuperChat: false,
      messageType: "newSponsorEvent" as MessageType,
    };
  }

  // Gift membership purchase
  if (item.is(YTNodes.LiveChatSponsorshipsGiftPurchaseAnnouncement)) {
    const gift = item.as(YTNodes.LiveChatSponsorshipsGiftPurchaseAnnouncement);
    const header = gift.header;
    if (!header) return null;

    return {
      id: gift.id,
      authorName: (header.author_name?.toString() || "Unknown").replace(/^@/, ''),
      authorAvatarUrl: header.author_photo?.[0]?.url || "",
      authorChannelId: gift.author_external_channel_id || "",
      message: header.primary_text?.toString() || "[Gifted Memberships]",
      timestamp: new Date(),
      badges: [],
      isSuperChat: false,
      messageType: "membershipGiftingEvent" as MessageType,
    };
  }

  return null;
}
