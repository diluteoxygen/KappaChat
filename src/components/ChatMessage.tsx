"use client";

import { useState, memo, useMemo } from "react";
import Image from "next/image";
import { Badge } from "./Badge";
import { TwitchBadgeImage } from "./TwitchBadgeImage";
import { PlatformBadge } from "./PlatformBadge";
import type { ChatMessage as ChatMessageType } from "@/types/youtube";
import { useCustomization } from "@/lib/hooks/useCustomization";
import { renderMessage } from "@/lib/message-renderer";

interface ChatMessageProps {
  message: ChatMessageType;
  getBadgeUrl?: (setId: string, version: string) => string | null;
}

/** Username color palette */
const USERNAME_COLORS = [
  "text-blue-400",
  "text-rose-400",
  "text-violet-400",
  "text-sky-400",
  "text-indigo-400",
  "text-cyan-400",
  "text-fuchsia-400",
  "text-pink-400",
] as const;

/** Memoized color cache to avoid recalculating */
const colorCache = new Map<string, string>();

/**
 * Get username color based on author info (memoized)
 */
function getUsernameColor(channelId: string, badges: ChatMessageType["badges"]): string {
  if (badges.includes("owner")) return "text-amber-400";
  if (badges.includes("moderator")) return "text-emerald-400";
  if (badges.includes("member")) return "text-accent";

  // Check cache first
  const cacheKey = channelId;
  if (colorCache.has(cacheKey)) {
    return colorCache.get(cacheKey)!;
  }

  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
  colorCache.set(cacheKey, color);
  return color;
}

/** Border radius mapping */
const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  small: '4px',
  medium: '8px',
  large: '12px',
  full: '16px',
};

/**
 * Chat Message - Supports "Comfy" and "Compact" modes
 * Compact: Single line with inline username and message
 * Comfy: Full layout with stacked username and message
 * 
 * Memoized to prevent unnecessary re-renders when parent updates
 */
export const ChatMessage = memo(function ChatMessage({ message, getBadgeUrl }: ChatMessageProps) {
  const [imgError, setImgError] = useState(false);
  const { chatStyle, showAvatars, showTimestamps, showBadges, messageAnimations, fontSize, borderRadius } = useCustomization();
  
  // Memoize derived values
  // For Twitch messages, use their chosen authorColor directly
  const usernameColor = useMemo(
    () => message.authorColor ? null : getUsernameColor(message.authorChannelId, message.badges),
    [message.authorChannelId, message.badges, message.authorColor]
  );
  const isCompact = chatStyle === "compact";
  const itemRadius = RADIUS_MAP[borderRadius] || '8px';

  // Deduplicate badges for display (e.g. don't show both 'subscriber' and 'member')
  const displayBadges = useMemo(() => {
    const priorityOrder: ChatMessageType["badges"][number][] = [
      "owner", "broadcaster", "moderator", "vip", "subscriber", "member", "turbo", "prime", "verified",
    ];
    const seen = new Set<string>();
    const result: ChatMessageType["badges"] = [];
    for (const b of priorityOrder) {
      if (!message.badges.includes(b)) continue;
      if (b === "broadcaster" && seen.has("owner")) continue;
      if (b === "owner" && seen.has("broadcaster")) continue;
      if (b === "member" && seen.has("subscriber")) continue;
      seen.add(b);
      result.push(b);
    }
    return result;
  }, [message.badges]);

  // Memoize style object to prevent recreation
  const messageStyle = useMemo<React.CSSProperties>(() => ({
    fontSize: `${fontSize}px`,
    lineHeight: `${fontSize * 1.5}px`,
    wordBreak: 'break-word',        // NEW: Aggressive word breaking
    overflowWrap: 'break-word',     // NEW: Standard overflow wrapping
    display: '-webkit-box',         // NEW: Enable line clamping
    WebkitLineClamp: 5,             // NEW: Max 5 lines
    WebkitBoxOrient: 'vertical',    // NEW: Required for line-clamp
  }), [fontSize]);

  // Format timestamp from message
  const formattedTime = useMemo(() => {
    return message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  // Compact mode: Single line inline layout
  if (isCompact) {
    return (
      <article
        className={`group flex items-center gap-1.5 px-3 py-0 min-h-[20px] transition-colors hover:bg-surface-muted border-l-2 border-transparent hover:border-accent/40 ${messageAnimations ? "animate-fade-in" : ""}`}
        style={{
          borderRadius: itemRadius,
          ...(message.isSuperChat && message.superChatColor
            ? { 
                backgroundColor: `${message.superChatColor}10`,
                borderColor: message.superChatColor
              }
            : {})
        }}
      >
        {/* Timestamp - always visible in compact */}
        {showTimestamps && (
          <span className="text-[9px] font-mono text-text-v5/50 tabular-nums shrink-0">
            {formattedTime}
          </span>
        )}

        {/* Avatar (tiny) */}
        {showAvatars && (
          <div className="relative h-4 w-4 shrink-0 overflow-hidden rounded-full border border-white/10 flex items-center justify-center bg-white/5">
            {imgError ? (
              <span className="text-[8px] font-black text-white/50 uppercase">
                {message.authorName.charAt(0)}
              </span>
            ) : (
              <Image
                src={message.authorAvatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                onError={() => setImgError(true)}
              />
            )}
          </div>
        )}

        {/* Badges (compact) */}
        {showBadges && ((displayBadges.length > 0) || (message.twitchBadges && message.twitchBadges.length > 0)) ? (
          <div className="flex gap-0.5 shrink-0 scale-75 origin-left">
            {message.twitchBadges && message.twitchBadges.length > 0 ? (
              message.twitchBadges.map(({ setId, version }) => {
                const imgUrl = getBadgeUrl?.(setId, version);
                return imgUrl ? (
                  <TwitchBadgeImage
                    key={`${setId}/${version}`}
                    imageUrl={imgUrl}
                    title={setId}
                    size={16}
                  />
                ) : null;
              })
            ) : (
              displayBadges.map((badge) => (
                <Badge key={badge} type={badge} />
              ))
            )}
          </div>
        ) : null}

        {/* Super Chat Amount */}
        {message.isSuperChat && message.superChatAmount && (
          <span
            className="rounded-full px-1.5 py-0 text-[8px] font-black uppercase text-white shrink-0"
            style={{ backgroundColor: message.superChatColor }}
          >
            {message.superChatAmount}
          </span>
        )}

        {/* Username */}
        <span
          className={`font-bold text-[11px] shrink-0 ${usernameColor || ''} inline-flex items-center gap-1`}
          style={message.authorColor ? { color: message.authorColor } : undefined}
        >
          <PlatformBadge source={message.source} size="1.1025em" />
          <span>{message.authorName}:</span>
        </span>
        
        {/* Message (inline, truncated) */}
        <span className="text-text-v2 truncate" style={messageStyle}>
          {renderMessage(message.message, message.messageParts, message.messageHtml)}
        </span>
      </article>
    );
  }

  // Comfy mode: Full stacked layout
  return (
    <article
      className={`group relative flex gap-3 px-4 sm:px-6 py-2 transition-all hover:bg-surface-muted border-l-2 border-transparent hover:border-accent/40 ${messageAnimations ? "animate-fade-in" : ""} ${message.isSuperChat ? "my-1.5" : ""}`}
      style={{
        borderRadius: itemRadius,
        ...(message.isSuperChat && message.superChatColor
          ? { 
              backgroundColor: `${message.superChatColor}10`,
              borderColor: message.superChatColor
            }
          : {})
      }}
    >
      {/* Avatar */}
      {showAvatars && (
        <div className="flex-shrink-0">
          <div className="relative h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-full border border-border group-hover:border-accent/30 transition-colors shadow-lg shadow-black/20 flex items-center justify-center bg-white/5">
            {imgError ? (
              <span className="text-xs sm:text-sm font-black text-text-v4 uppercase">
                {message.authorName.charAt(0)}
              </span>
            ) : (
              <Image
                src={message.authorAvatarUrl}
                alt=""
                fill
                className="object-cover"
                unoptimized
                onError={() => setImgError(true)}
              />
            )}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-h-[20px]">
          {/* Super Chat - Show first for visibility */}
          {message.isSuperChat && message.superChatAmount && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-white shadow-sm shrink-0"
              style={{ backgroundColor: message.superChatColor }}
            >
              {message.superChatAmount}
            </span>
          )}

          {/* Badges */}
          {showBadges && ((displayBadges.length > 0) || (message.twitchBadges && message.twitchBadges.length > 0)) ? (
            <div className="flex gap-0.5 sm:gap-1 shrink-0">
              {message.twitchBadges && message.twitchBadges.length > 0 ? (
                message.twitchBadges.map(({ setId, version }) => {
                  const imgUrl = getBadgeUrl?.(setId, version);
                  return imgUrl ? (
                    <TwitchBadgeImage
                      key={`${setId}/${version}`}
                      imageUrl={imgUrl}
                      title={setId}
                      size={18}
                    />
                  ) : null;
                })
              ) : (
                displayBadges.map((badge) => (
                  <Badge key={badge} type={badge} />
                ))
              )}
            </div>
          ) : null}

          {/* Username */}
          <span
            className={`font-bold tracking-tight text-xs sm:text-sm ${usernameColor || ''} break-all inline-flex items-center gap-1`}
            style={message.authorColor ? { color: message.authorColor } : undefined}
          >
            <PlatformBadge source={message.source} size="1.1025em" />
            <span>{message.authorName}</span>
          </span>
          
          {/* Timestamp */}
          {showTimestamps && (
            <span className="text-[9px] sm:text-[10px] uppercase font-bold text-text-v5/40 shrink-0">
              {formattedTime}
            </span>
          )}
        </div>

        {/* Message Body */}
        <p className="text-text-v2 font-medium break-words min-h-[18px] overflow-hidden" style={messageStyle}>
          {renderMessage(message.message, message.messageParts, message.messageHtml)}
        </p>
      </div>

      {message.isSuperChat && (
        <div 
          className="absolute right-0 top-0 h-full w-1 opacity-20"
          style={{ backgroundColor: message.superChatColor }}
        />
      )}
    </article>
  );
});

// Display name for debugging
ChatMessage.displayName = 'ChatMessage';
