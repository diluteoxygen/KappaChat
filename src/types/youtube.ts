/**
 * YouTube Live Chat API Types
 * Based on YouTube Data API v3 liveChatMessages resource
 */

/** Badge types for chat users */
export type BadgeType = "owner" | "moderator" | "member" | "verified" | "vip" | "subscriber" | "broadcaster" | "turbo" | "prime";

/** Author details for a chat message */
export interface AuthorDetails {
  channelId: string;
  channelUrl: string;
  displayName: string;
  profileImageUrl: string;
  isVerified: boolean;
  isChatOwner: boolean;
  isChatSponsor: boolean;
  isChatModerator: boolean;
}

/** Text message details */
export interface TextMessageDetails {
  messageText: string;
}

/** Super Chat details */
export interface SuperChatDetails {
  amountMicros: string;
  currency: string;
  amountDisplayString: string;
  userComment: string;
  tier: number;
}

/** Super Sticker details */
export interface SuperStickerDetails {
  superStickerMetadata: {
    stickerId: string;
    altText: string;
    language: string;
  };
  amountMicros: string;
  currency: string;
  amountDisplayString: string;
  tier: number;
}

/** Message types supported by YouTube Live Chat */
export type MessageType =
  | "textMessageEvent"
  | "superChatEvent"
  | "superStickerEvent"
  | "memberMilestoneChatEvent"
  | "newSponsorEvent"
  | "giftMembershipReceivedEvent"
  | "membershipGiftingEvent"
  | "twitchMessageEvent";

/** Snippet data for a live chat message */
export interface LiveChatMessageSnippet {
  type: MessageType;
  liveChatId: string;
  authorChannelId: string;
  publishedAt: string;
  hasDisplayContent: boolean;
  displayMessage?: string;
  textMessageDetails?: TextMessageDetails;
  superChatDetails?: SuperChatDetails;
  superStickerDetails?: SuperStickerDetails;
}

/** Individual live chat message */
export interface LiveChatMessage {
  kind: "youtube#liveChatMessage";
  etag: string;
  id: string;
  snippet: LiveChatMessageSnippet;
  authorDetails: AuthorDetails;
}

/** Page info for pagination */
export interface PageInfo {
  totalResults: number;
  resultsPerPage: number;
}

/** Response from liveChatMessages.list endpoint */
export interface LiveChatMessagesResponse {
  kind: "youtube#liveChatMessageListResponse";
  etag: string;
  nextPageToken?: string;
  pollingIntervalMillis: number;
  offlineAt?: string;
  pageInfo: PageInfo;
  items: LiveChatMessage[];
}

/** Response from videos.list endpoint (for getting liveChatId) */
export interface VideoDetailsResponse {
  kind: "youtube#videoListResponse";
  etag: string;
  items: Array<{
    id: string;
    liveStreamingDetails?: {
      activeLiveChatId?: string;
      actualStartTime?: string;
      scheduledStartTime?: string;
      concurrentViewers?: string;
    };
  }>;
}

/** Emoji data for rich content rendering */
export interface EmojiData {
  name: string;
  unicode?: string;
  imageUrl?: string;
}

/** Message part for rich content rendering */
export interface MessagePart {
  type: 'text' | 'emoji';
  value: string;
  emojiData?: EmojiData;
}

/** Processed message for UI rendering */
export interface ChatMessage {
  id: string;
  source?: "youtube" | "twitch" | "demo";
  authorName: string;
  authorAvatarUrl: string;
  authorChannelId: string;
  message: string;
  messageHtml?: string;
  messageParts?: MessagePart[];
  timestamp: Date;
  badges: BadgeType[];
  isSuperChat: boolean;
  superChatAmount?: string;
  superChatColor?: string;
  messageType: MessageType;
  /** Arrival timestamp (client-side) to ensure append-only rendering */
  receivedAt?: number;
  /** User's chosen chat color from Twitch IRC (e.g. '#FF4500') */
  authorColor?: string;
  /** Structured Twitch badge list parsed from IRC tags — each entry is {setId, version} */
  twitchBadges?: Array<{ setId: string; version: string }>;
}

/** Chat connection state */
export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error"
  | "offline";

/** Chat context for the application */
export interface ChatState {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  liveChatId: string | null;
  videoId: string | null;
  error: string | null;
  isAutoScrollEnabled: boolean;
}
