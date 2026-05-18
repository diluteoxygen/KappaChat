"use client";

import { useState, memo, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/types/youtube";
import { springs } from "@/lib/motion";
import { useCustomization } from "@/lib/hooks/useCustomization";
import { renderMessage } from "@/lib/message-renderer";
import { Badge } from "@/components/Badge";
import { TwitchBadgeImage } from "@/components/TwitchBadgeImage";
import { PlatformBadge } from "@/components/PlatformBadge";

interface StreamChatMessageProps {
  message: ChatMessageType;
  getBadgeUrl?: (setId: string, version: string) => string | null;
}

/** Username color palette */
const STREAM_USERNAME_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F8B500", "#FF8C94"
] as const;

/** Color cache for stream messages */
const streamColorCache = new Map<string, string>();

/**
 * Get username color - YouTube style with vibrant palette (memoized)
 */
function getUsernameColor(channelId: string, badges: ChatMessageType["badges"]): string {
  if (badges.includes("owner")) return "#FFD700";
  if (badges.includes("moderator")) return "#5E84F1";
  if (badges.includes("member")) return "#2BA640";

  // Check cache first
  if (streamColorCache.has(channelId)) {
    return streamColorCache.get(channelId)!;
  }

  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const color = STREAM_USERNAME_COLORS[Math.abs(hash) % STREAM_USERNAME_COLORS.length];
  streamColorCache.set(channelId, color);
  return color;
}

/** Border radius mapping */
const RADIUS_MAP: Record<string, string> = {
  none: '0px',
  small: '8px',
  medium: '12px',
  large: '20px',
  full: '9999px',
};

/**
 * Premium Stream Chat Message
 * Ultra-smooth animations with spring physics
 * 
 * Memoized to prevent unnecessary re-renders during rapid chat updates
 */
export const StreamChatMessage = memo(function StreamChatMessage({ message, getBadgeUrl }: StreamChatMessageProps) {
  const [imgError, setImgError] = useState(false);
  const { chatStyle, showAvatars, showTimestamps, showBadges, messageAnimations, fontSize, borderRadius } = useCustomization();
  
  // Memoize derived values — Twitch messages use their chosen authorColor
  const usernameColor = useMemo(
    () => message.authorColor || getUsernameColor(message.authorChannelId, message.badges),
    [message.authorChannelId, message.badges, message.authorColor]
  );
  
  const { isSpecial, isSuperChat, displayBadges } = useMemo(() => {
    const owner = message.badges.includes("owner") || message.badges.includes("broadcaster");
    const mod = message.badges.includes("moderator");
    const member = message.badges.includes("member") || message.badges.includes("subscriber");
    const vip = message.badges.includes("vip");

    // Deduplicate badges for display
    const priorityOrder: ChatMessageType["badges"][number][] = [
      "owner", "broadcaster", "moderator", "vip", "subscriber", "member", "turbo", "prime", "verified",
    ];
    const seen = new Set<string>();
    const badges: ChatMessageType["badges"] = [];
    for (const b of priorityOrder) {
      if (!message.badges.includes(b)) continue;
      if (b === "broadcaster" && seen.has("owner")) continue;
      if (b === "owner" && seen.has("broadcaster")) continue;
      if (b === "member" && seen.has("subscriber")) continue;
      seen.add(b);
      badges.push(b);
    }

    return {
      isSpecial: owner || mod || member || vip,
      isSuperChat: message.isSuperChat,
      displayBadges: badges,
    };
  }, [message.badges, message.isSuperChat]);

  const messageStyle = useMemo<React.CSSProperties>(() => ({
    fontSize: `${fontSize}px`,
  }), [fontSize]);

  const isCompact = chatStyle === "compact";
  const itemRadius = RADIUS_MAP[borderRadius] || '12px';

  const formattedTime = useMemo(() => {
    return message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [message.timestamp]);

  const animationProps = messageAnimations ? {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, transition: { duration: 0.1 } },
    transition: springs.smooth
  } : {
    initial: false,
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0 },
    transition: { duration: 0 }
  };

  if (isCompact) {
    return (
      <motion.article
        layout
        {...animationProps}
        className={`group flex items-center gap-1.5 px-4 py-1 min-h-[24px] bg-white/[0.02] hover:bg-white/[0.05] transition-colors ${
          isSuperChat ? "bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent" : ""
        }`}
        style={{
          borderLeft: isSuperChat ? `3px solid ${message.superChatColor}` : "3px solid transparent",
          borderRadius: itemRadius,
        }}
      >
        {showTimestamps && (
          <span className="text-[10px] font-mono text-text-v5/50 tabular-nums shrink-0">
            {formattedTime}
          </span>
        )}

        {showAvatars && (
          <div className={`relative h-4 w-4 shrink-0 overflow-hidden rounded-full flex items-center justify-center bg-surface-muted border border-border ${isSpecial ? "border-[#0f0f0f]" : ""}`}>
            {imgError ? (
              <span className="text-[8px] font-black text-text-v4 uppercase">
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

        {showBadges && ((displayBadges.length > 0) || (message.twitchBadges && message.twitchBadges.length > 0)) ? (
          <div className="flex gap-0.5 shrink-0 scale-75 origin-left">
            {message.twitchBadges && message.twitchBadges.length > 0 ? (
              message.twitchBadges.map(({ setId, version }) => {
                const imgUrl = getBadgeUrl?.(setId, version);
                return imgUrl ? (
                  <TwitchBadgeImage key={`${setId}/${version}`} imageUrl={imgUrl} title={setId} size="1em" />
                ) : null;
              })
            ) : (
              displayBadges.map((badge) => <Badge key={badge} type={badge} />)
            )}
          </div>
        ) : null}

        {isSuperChat && message.superChatAmount && (
          <span className="rounded-full px-1.5 py-0 text-[9px] font-black uppercase text-white shrink-0 shadow-sm" style={{ backgroundColor: message.superChatColor }}>
            {message.superChatAmount}
          </span>
        )}

        <span className={`font-bold text-[12px] shrink-0 ${usernameColor || ''} inline-flex items-center gap-1`} style={{ color: usernameColor }}>
          <PlatformBadge source={message.source} size="1.05em" />
          <span>{message.authorName}:</span>
        </span>
        
        <span className="text-text-v1 truncate font-medium" style={messageStyle}>
          {renderMessage(message.message, message.messageParts, message.messageHtml)}
        </span>
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      {...animationProps}
      className={`group flex items-start gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.05] transition-colors ${
        isSuperChat 
          ? "bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent" 
          : ""
      }`}
      style={{
        borderLeft: isSuperChat ? `3px solid ${message.superChatColor}` : undefined,
        borderRadius: itemRadius,
      }}
    >
      {/* Avatar */}
      {showAvatars && (
        <div className={`relative shrink-0 ${isSpecial ? "p-0.5" : ""}`}>
          {isSpecial && (
            <div 
              className="absolute inset-0 rounded-full"
              style={{ background: `linear-gradient(135deg, ${usernameColor}, ${usernameColor}80)` }}
            />
          )}
          <div 
            className={`relative h-8 w-8 overflow-hidden rounded-full flex items-center justify-center bg-surface-muted ${isSpecial ? "border-2 border-[#0f0f0f]" : ""}`}
            style={imgError ? { backgroundColor: usernameColor } : undefined}
          >
            {imgError ? (
              <span className="text-text-v4 font-black text-xs uppercase">
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

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Badges */}
          {showBadges && ((displayBadges.length > 0) || (message.twitchBadges && message.twitchBadges.length > 0)) && (
            <div className="flex items-center gap-1 shrink-0">
              {message.twitchBadges && message.twitchBadges.length > 0 ? (
                message.twitchBadges.map(({ setId, version }) => {
                  const imgUrl = getBadgeUrl?.(setId, version);
                  return imgUrl ? (
                    <TwitchBadgeImage
                      key={`${setId}/${version}`}
                      imageUrl={imgUrl}
                      title={setId}
                      size="1em"
                    />
                  ) : null;
                })
              ) : (
                displayBadges.map((badge) => (
                  <Badge key={badge} type={badge} />
                ))
              )}
            </div>
          )}

          {/* Super Chat Amount */}
          {isSuperChat && message.superChatAmount && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black text-white"
              style={{ 
                background: message.superChatColor,
                boxShadow: `0 2px 8px ${message.superChatColor}40`
              }}
            >
              {message.superChatAmount}
            </span>
          )}

          {/* Username */}
          <span className="font-bold text-sm inline-flex items-center gap-1" style={{ color: usernameColor }}>
            <PlatformBadge source={message.source} size="1.05em" />
            <span>{message.authorName}</span>
          </span>

          {/* Timestamp */}
          {showTimestamps && (
            <span className="text-[10px] font-bold text-text-v5/40 uppercase shrink-0 ml-1">
              {formattedTime}
            </span>
          )}
        </div>

        {/* Message text */}
        <p className="text-text-v1 leading-snug mt-1 font-medium break-words" style={messageStyle}>
          {renderMessage(message.message, message.messageParts, message.messageHtml)}
        </p>
      </div>
    </motion.article>
  );
});

// Display name for debugging
StreamChatMessage.displayName = 'StreamChatMessage';
