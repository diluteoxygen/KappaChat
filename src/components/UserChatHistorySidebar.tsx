"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  X, 
  MessageSquare, 
  Clock, 
  ShieldAlert,
  Youtube,
  Twitch,
  UserCheck
} from "lucide-react";
import type { ChatMessage, BadgeType } from "@/types/youtube";
import { renderMessage } from "@/lib/message-renderer";
import { Badge } from "@/components/Badge";
import { TwitchBadgeImage } from "@/components/TwitchBadgeImage";
import { PlatformBadge } from "@/components/PlatformBadge";
import { springs } from "@/lib/motion";

interface UserChatHistorySidebarProps {
  selectedUser: {
    authorChannelId: string;
    authorName: string;
    authorAvatarUrl: string;
    badges: BadgeType[];
    source: "youtube" | "twitch" | "demo";
    authorColor?: string;
    twitchBadges?: Array<{ setId: string; version: string }>;
  } | null;
  messages: ChatMessage[];
  onClose: () => void;
  getBadgeUrl?: (setId: string, version: string) => string | null;
}

export function UserChatHistorySidebar({
  selectedUser,
  messages,
  onClose,
  getBadgeUrl,
}: UserChatHistorySidebarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Filter messages for this specific user
  const userMessages = useMemo(() => {
    if (!selectedUser) return [];
    return messages.filter(
      (msg) => msg.authorChannelId === selectedUser.authorChannelId
    );
  }, [messages, selectedUser]);

  // Calculate session metrics
  const metrics = useMemo(() => {
    if (userMessages.length === 0) return { firstSeen: null, lastSeen: null };
    const firstMsg = userMessages[0];
    const lastMsg = userMessages[userMessages.length - 1];
    
    const formatTime = (d: Date) => {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };

    return {
      firstSeen: formatTime(firstMsg.timestamp),
      lastSeen: formatTime(lastMsg.timestamp),
    };
  }, [userMessages]);

  // Auto scroll to bottom of history on mount or new message
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [userMessages.length]);

  if (!selectedUser) return null;

  const usernameColor = selectedUser.authorColor || "#ca0377";
  const totalMsgs = userMessages.length;

  return (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ x: "100%", opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.9 }}
      transition={springs.smooth}
      className="absolute top-0 right-0 h-full w-[310px] sm:w-[330px] bg-sidebar border-l border-border/40 z-50 flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl user-history-sidebar"
      style={{
        boxShadow: `-10px 0 30px -15px rgba(0, 0, 0, 0.5), inset 1px 0 0 0 rgba(255, 255, 255, 0.05)`,
      }}
    >
      {/* Background radial glow matching the user's name color */}
      <div 
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-[80px] opacity-20 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: usernameColor }}
      />

      {/* Header */}
      <div className="relative p-4 pb-2 border-b border-border/20 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-text-v4" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-v4">User History</h3>
        </div>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          className="p-1 rounded-lg bg-surface-muted hover:bg-surface-hover text-text-v4 hover:text-text-v1 transition-all duration-200"
          title="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </motion.button>
      </div>

      {/* User Information Profile Card */}
      <div className="relative p-4 py-3 bg-white/[0.01] border-b border-border/10 shrink-0 z-10 flex gap-3 items-center">
        {/* Large Avatar */}
        <div className="relative shrink-0">
          <div 
            className="absolute -inset-0.5 rounded-full blur-sm opacity-40"
            style={{ backgroundColor: usernameColor }}
          />
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[#0B0B0F] bg-surface-muted flex items-center justify-center">
            {selectedUser.authorAvatarUrl ? (
              <Image
                src={selectedUser.authorAvatarUrl}
                alt={selectedUser.authorName}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <span className="text-sm font-black text-white/60 uppercase">
                {selectedUser.authorName.charAt(0)}
              </span>
            )}
          </div>
        </div>

        {/* User Details */}
        <div className="min-w-0 flex-1 space-y-0.5">
          <h4 
            className="text-sm font-extrabold truncate flex items-center gap-1"
            style={{ color: usernameColor }}
          >
            <PlatformBadge source={selectedUser.source} size="0.9em" />
            <span className="hover:underline cursor-pointer">{selectedUser.authorName}</span>
          </h4>

          {/* Badges Display */}
          <div className="flex flex-wrap gap-1 items-center">
            {/* Custom Twitch Badges */}
            {selectedUser.twitchBadges && selectedUser.twitchBadges.length > 0 ? (
              selectedUser.twitchBadges.map(({ setId, version }) => {
                const imgUrl = getBadgeUrl?.(setId, version);
                return imgUrl ? (
                  <TwitchBadgeImage
                    key={`${setId}/${version}`}
                    imageUrl={imgUrl}
                    title={setId}
                    size={14}
                  />
                ) : null;
              })
            ) : (
              selectedUser.badges.map((badge) => (
                <Badge key={badge} type={badge} />
              ))
            )}

            {/* Platform indicator tag */}
            <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
              selectedUser.source === "twitch" 
                ? "bg-[#9146FF]/10 text-[#a970ff] border border-[#9146FF]/20" 
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {selectedUser.source === "twitch" ? <Twitch className="h-2 w-2" /> : <Youtube className="h-2 w-2" />}
              {selectedUser.source}
            </span>
          </div>
        </div>
      </div>

      {/* Session Metrics Row */}
      <div className="px-4 py-1.5 bg-black/15 border-b border-border/10 shrink-0 flex items-center justify-between text-[10px] text-text-v5/50 font-bold uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="text-text-v4 font-black">{totalMsgs}</span>
          <span className="text-[8px] text-text-v5/40 font-semibold tracking-normal lowercase">messages</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-2.5 w-2.5 text-text-v5/40" />
          <span className="text-[8px] text-text-v5/40 font-semibold tracking-normal lowercase">first seen:</span>
          <span className="text-text-v4 font-black">{metrics.firstSeen || "--:--"}</span>
        </div>
      </div>

      {/* Scrollable Message History Feed */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 custom-scrollbar"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {userMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-v5/40 p-4">
            <ShieldAlert className="h-8 w-8 mb-2 stroke-[1.5]" />
            <p className="text-xs">No chat records found for this user in this session.</p>
          </div>
        ) : (
          userMessages.map((msg, index) => {
            const formattedTime = msg.timestamp.toLocaleTimeString([], { 
              hour: "2-digit", 
              minute: "2-digit" 
            });

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
                className="relative group p-2 rounded-lg border border-border/5 bg-white/[0.005] hover:bg-white/[0.02] transition-all duration-200"
              >
                {/* Message Header (Time + Platform Badge if applicable) */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[8px] font-mono text-text-v5/30 tabular-nums">
                    {formattedTime}
                  </span>
                  
                  {/* Super Chat Indicator */}
                  {msg.isSuperChat && msg.superChatAmount && (
                    <span 
                      className="rounded-full px-1.5 py-0.2 text-[8px] font-black text-white shrink-0 shadow-sm uppercase scale-90 origin-right"
                      style={{ backgroundColor: msg.superChatColor }}
                    >
                      {msg.superChatAmount}
                    </span>
                  )}
                </div>

                {/* Message Text Body */}
                <p className="text-[11px] text-text-v2 leading-snug break-words font-medium">
                  {renderMessage(msg.message, msg.messageParts, msg.messageHtml)}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/10 shrink-0 text-center bg-black/15">
        <span className="text-[8px] text-text-v5/30 font-semibold tracking-widest uppercase flex items-center justify-center gap-1">
          <UserCheck className="h-2.5 w-2.5" />
          Session Tracker Active
        </span>
      </div>
    </motion.div>
  );
}
