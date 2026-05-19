"use client";

import { useRef, useEffect, useCallback, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowDown,
  Trash2,
  Settings,
  Play,
  Youtube,
  Loader2,
  Key,
  LogOut,
  Zap,
  ArrowLeftRight,
  Twitch
} from "lucide-react";
import { useUnifiedChat } from "@/lib/hooks/useUnifiedChat";
import { UserChatHistorySidebar } from "@/components/UserChatHistorySidebar";
import { useDemoChat } from "@/lib/hooks/useDemoChat";
import { useCustomization } from "@/lib/hooks/useCustomization";
import { DemoControls } from "@/components/DemoControls";
import { Badge } from "@/components/Badge";
import { TwitchBadgeImage } from "@/components/TwitchBadgeImage";
import { springs } from "@/lib/motion";
import { renderMessage } from "@/lib/message-renderer";
import type { ChatMessage as ChatMessageType } from "@/types/youtube";

interface TwitchChatPageProps {
  onSwitchUI: () => void;
}

/** Twitch default username color palette — used when the user hasn't chosen a color */
const DEFAULT_TWITCH_COLORS = [
  "#FF4A4A", "#FFB12A", "#FF75E6", "#00D6D6",
  "#00FF00", "#9D4CFF", "#FF6B35", "#5D3FD3",
];

function getTwitchColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEFAULT_TWITCH_COLORS[Math.abs(hash) % DEFAULT_TWITCH_COLORS.length];
}

/** Deduplicate badges — e.g. don't show both 'owner' and 'broadcaster' */
const DISPLAY_BADGE_PRIORITY: ChatMessageType["badges"][number][] = [
  "owner", "broadcaster", "moderator", "vip", "subscriber", "member", "turbo", "prime", "verified",
];

function getDisplayBadges(badges: ChatMessageType["badges"]): ChatMessageType["badges"] {
  const seen = new Set<string>();
  const result: ChatMessageType["badges"] = [];
  for (const b of DISPLAY_BADGE_PRIORITY) {
    if (!badges.includes(b)) continue;
    // 'broadcaster' and 'owner' are the same role — show only one
    if (b === "broadcaster" && seen.has("owner")) continue;
    if (b === "owner" && seen.has("broadcaster")) continue;
    // 'subscriber' and 'member' overlap — show subscriber for Twitch
    if (b === "member" && seen.has("subscriber")) continue;
    seen.add(b);
    result.push(b);
  }
  return result;
}

/**
 * Twitch-style Chat Message
 * Uses ChatMessage directly — no more flat-boolean mapping.
 * Renders real Twitch badge images from CDN, falls back to lucide icons.
 */
const TwitchMessage = memo(function TwitchMessage({
  message,
  getBadgeUrl,
  onUsernameClick,
}: {
  message: ChatMessageType;
  getBadgeUrl: (setId: string, version: string) => string | null;
  onUsernameClick?: (user: {
    authorChannelId: string;
    authorName: string;
    authorAvatarUrl: string;
    badges: ChatMessageType["badges"];
    source: "youtube" | "twitch" | "demo";
    authorColor?: string;
    twitchBadges?: Array<{ setId: string; version: string }>;
  }) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const usernameColor = message.authorColor || getTwitchColor(message.authorName);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="px-3 py-1 hover:bg-[#1F1F23] transition-colors"
    >
      <div className="flex items-start gap-2 text-[13px] leading-[1.4]">
        {/* Avatar */}
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full mt-0.5 flex items-center justify-center bg-[#2D2D35]">
          {imgError ? (
            <span className="text-[10px] font-black text-white/60 uppercase">
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

        <div className="flex flex-wrap items-baseline gap-x-1.5 min-w-0 flex-1">
          {/* Timestamp */}
          <span className="text-[#ADADB8] text-xs shrink-0">
            {formatTime(message.timestamp)}
          </span>

          {/* Badges — real Twitch CDN images, lucide icon fallback */}
          {message.twitchBadges && message.twitchBadges.length > 0 && (
            <span className="inline-flex items-center gap-0.5 shrink-0">
              {message.twitchBadges.map(({ setId, version }) => {
                const imgUrl = getBadgeUrl(setId, version);
                return imgUrl ? (
                  <TwitchBadgeImage
                    key={`${setId}/${version}`}
                    imageUrl={imgUrl}
                    title={setId}
                    size={18}
                  />
                ) : null;
              })}
            </span>
          )}

          {/* Username */}
          <span
            onClick={() => onUsernameClick?.({
              authorChannelId: message.authorChannelId,
              authorName: message.authorName,
              authorAvatarUrl: message.authorAvatarUrl,
              badges: message.badges,
              source: message.source || "twitch",
              authorColor: usernameColor,
              twitchBadges: message.twitchBadges
            })}
            className="font-bold cursor-pointer hover:underline shrink-0"
            style={{ color: usernameColor }}
          >
            {message.authorName}
          </span>

          <span className="text-[#EFEFF1]/70">:</span>

          {/* Message text */}
          <span className="text-[#EFEFF1] break-words">
            {renderMessage(message.message, message.messageParts, message.messageHtml)}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

TwitchMessage.displayName = 'TwitchMessage';

/**
 * Twitch-style Chat Interface
 * Classic 1:1 Twitch chat clone for YouTube Live
 */
export function TwitchChatPage({ onSwitchUI }: TwitchChatPageProps) {
  const [ytUrl, setYtUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    authorChannelId: string;
    authorName: string;
    authorAvatarUrl: string;
    badges: any[];
    source: "youtube" | "twitch" | "demo";
    authorColor?: string;
    twitchBadges?: Array<{ setId: string; version: string }>;
  } | null>(null);

  const handleUsernameClick = useCallback((user: any) => {
    setSelectedUser(user);
    setShowSettings(false);
  }, []);

  const handleChatAreaClick = useCallback(() => {
    if (selectedUser) {
      setSelectedUser(null);
      scrollRef.current?.focus();
    }
  }, [selectedUser]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const {
    apiKey,
    updateField,
    fontSize,
    maxLoadedMessages
  } = useCustomization();

  const liveChat = useUnifiedChat({
    maxMessages: maxLoadedMessages,
    apiKey: apiKey,
  });

  const demoChat = useDemoChat({
    maxMessages: maxLoadedMessages,
  });

  const chat = isDemo ? demoChat : liveChat;
  const { messages, connectionState, streamInfo, clearMessages } = chat;

  const isYoutubeConnected = !isDemo && liveChat.unified.youtube.isConnected;
  const isYoutubeConnecting = !isDemo && liveChat.unified.youtube.isConnecting;
  const isTwitchConnected = !isDemo && liveChat.unified.twitch.isConnected;
  const isTwitchConnecting = !isDemo && liveChat.unified.twitch.isConnecting;

  // Extract demo-specific controls
  const demoControls = isDemo ? {
    speed: demoChat.speed,
    setSpeed: demoChat.setSpeed,
    isPaused: demoChat.isPaused,
    pause: demoChat.pause,
    resume: demoChat.resume,
    progress: demoChat.progress,
    loopCount: demoChat.loopCount,
  } : null;

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  const handleStartDemo = async () => {
    liveChat.disconnectYoutube();
    liveChat.disconnectTwitch();
    setIsDemo(true);
    setYtUrl("");
    setTwitchUrl("");
    await demoChat.connect();
  };

  const handleConnectYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ytUrl.trim()) {
      setIsDemo(false);
      demoChat.disconnect();
      await liveChat.connectYoutube(ytUrl.trim());
    }
  };

  const handleConnectTwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twitchUrl.trim()) {
      setIsDemo(false);
      demoChat.disconnect();
      await liveChat.connectTwitch(twitchUrl.trim());
    }
  };

  const handleDisconnect = () => {
    liveChat.disconnectYoutube();
    liveChat.disconnectTwitch();
    demoChat.disconnect();
    setIsDemo(false);
  };

  // Smooth auto-scroll
  useEffect(() => {
    if (isAutoScrollEnabled && scrollRef.current) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isAutoScrollEnabled]);

  // Handle scroll detection for auto-scroll button
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
      setIsAutoScrollEnabled(isNearBottom);
    }
  }, []);

  const scrollToBottom = () => {
    setIsAutoScrollEnabled(true);
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  };

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden"
      style={{
        backgroundColor: "#0E0E10",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif"
      }}
    >
      {/* Twitch-style Header - Centered */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#18181B] border-b border-[#303032] shrink-0">
        <div className="flex items-center gap-3 flex-1">
          {isDemo && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#9146FF]/20 text-[#9146FF] text-[10px] font-bold">
              <Zap className="h-3 w-3" />
              DEMO
            </span>
          )}
        </div>

        {/* Center - Stream Chat title */}
        <div className="flex items-center justify-center gap-2">
          <span className="font-semibold text-[#EFEFF1] text-sm">Stream Chat</span>
        </div>

        <div className="flex items-center justify-end gap-2 flex-1">
          {/* Actions */}
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setSelectedUser(null);
            }}
            className="p-1.5 rounded hover:bg-white/10 text-[#ADADB8] hover:text-[#EFEFF1] transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={clearMessages}
            className="p-1.5 rounded hover:bg-white/10 text-[#ADADB8] hover:text-red-400 transition-colors"
            title="Clear chat"
            disabled={messages.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            onClick={onSwitchUI}
            className="p-1.5 rounded hover:bg-white/10 text-[#ADADB8] hover:text-[#EFEFF1] transition-colors"
            title="Switch UI Mode"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.snappy}
            className="bg-[#1F1F23] border-b border-[#303032] overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* API Key Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#ADADB8] uppercase tracking-wider">
                  <Key className="h-3.5 w-3.5" />
                  YouTube API Key (Optional)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => updateField("apiKey", e.target.value)}
                  placeholder="Enter your YouTube Data API v3 key"
                  className="w-full px-3 py-2 bg-[#0E0E10] border border-[#303032] rounded text-sm text-[#EFEFF1] placeholder-[#6B6B6F] focus:outline-none focus:border-[#9146FF] transition-colors"
                />
                <p className="text-[10px] text-[#6B6B6F]">
                  Optional for enhanced features. Get one at{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9146FF] hover:underline"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#ADADB8] uppercase tracking-wider">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => updateField("fontSize", parseInt(e.target.value))}
                  className="w-full accent-[#9146FF]"
                />
              </div>

              {/* Max Messages */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#ADADB8] uppercase tracking-wider">
                  Max Messages: {maxLoadedMessages}
                </label>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={maxLoadedMessages}
                  onChange={(e) => updateField("maxLoadedMessages", parseInt(e.target.value))}
                  className="w-full accent-[#9146FF]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Input */}
      <div className="px-4 py-3 bg-[#18181B] border-b border-[#303032] shrink-0 space-y-2">
        {/* YouTube row */}
        <form onSubmit={handleConnectYoutube} className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 w-[72px] shrink-0">
            <Youtube className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-[10px] font-bold text-[#6B6B6F] uppercase tracking-wider">YouTube</span>
          </div>
          <input
            type="text"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder={isYoutubeConnected ? "Connected" : isDemo ? "Demo active" : "Paste YouTube Live URL..."}
            disabled={isYoutubeConnected || isYoutubeConnecting || isDemo}
            className="flex-1 px-3 py-1.5 bg-[#0E0E10] border border-[#303032] rounded text-sm text-[#EFEFF1] placeholder-[#6B6B6F] focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isYoutubeConnected ? (
            <button
              type="button"
              onClick={() => liveChat.disconnectYoutube()}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded transition-colors flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isYoutubeConnecting || !ytUrl.trim() || isDemo}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:bg-[#4A4A4F] disabled:cursor-not-allowed text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
            >
              {isYoutubeConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span className="hidden sm:inline">{isYoutubeConnecting ? "..." : "Go"}</span>
            </button>
          )}
        </form>

        {/* Twitch row */}
        <form onSubmit={handleConnectTwitch} className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 w-[72px] shrink-0">
            <Twitch className="h-3.5 w-3.5 text-[#9146FF] shrink-0" />
            <span className="text-[10px] font-bold text-[#6B6B6F] uppercase tracking-wider">Twitch</span>
          </div>
          <input
            type="text"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder={isTwitchConnected ? "Connected" : isDemo ? "Demo active" : "Paste Twitch URL or channel..."}
            disabled={isTwitchConnected || isTwitchConnecting || isDemo}
            className="flex-1 px-3 py-1.5 bg-[#0E0E10] border border-[#303032] rounded text-sm text-[#EFEFF1] placeholder-[#6B6B6F] focus:outline-none focus:border-[#9146FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {isTwitchConnected ? (
            <button
              type="button"
              onClick={() => liveChat.disconnectTwitch()}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold rounded transition-colors flex items-center gap-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isTwitchConnecting || !twitchUrl.trim() || isDemo}
              className="px-3 py-1.5 bg-[#9146FF] hover:bg-[#7C3AED] disabled:bg-[#4A4A4F] disabled:cursor-not-allowed text-white text-xs font-bold rounded transition-colors flex items-center gap-1"
            >
              {isTwitchConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span className="hidden sm:inline">{isTwitchConnecting ? "..." : "Go"}</span>
            </button>
          )}
        </form>

        {/* Status / disconnect all row */}
        {(isConnected || isDemo) && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-sm text-[#ADADB8]">
              {isDemo ? (
                <span className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-[#9146FF]" />
                  Demo Mode Active
                </span>
              ) : streamInfo ? (
                <span className="truncate text-xs">{streamInfo.title}</span>
              ) : (
                <span className="text-xs">Connected</span>
              )}
            </div>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{isDemo ? "Stop Demo" : "Disconnect All"}</span>
            </button>
          </div>
        )}

        {/* Demo button when not connected */}
        {!isConnected && !isConnecting && !isDemo && (
          <button
            onClick={handleStartDemo}
            className="w-full py-1.5 bg-[#1F1F23] hover:bg-[#2D2D35] text-[#ADADB8] hover:text-[#EFEFF1] text-xs font-semibold rounded transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="h-3.5 w-3.5" />
            Try Demo Mode
          </button>
        )}
      </div>

      {/* Demo Controls */}
      {isDemo && demoControls && (
        <div className="px-4 py-2 bg-[#9146FF]/10 border-b border-[#9146FF]/20 shrink-0">
          <DemoControls
            {...demoControls}
            accentColor="#9146FF"
          />
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden relative bg-[#18181B]" onClick={handleChatAreaClick}>
        <div
          ref={scrollRef}
          tabIndex={-1}
          onScroll={handleScroll}
          className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#303032] scrollbar-track-transparent focus:outline-none"
          style={{ fontSize: `${fontSize}px` }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#ADADB8]">
              <MessageSquarePlaceholder />
              <p className="mt-4 text-sm">Welcome to the chat room!</p>
            </div>
          ) : (
            <div className="py-2">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <TwitchMessage
                    key={msg.id}
                    message={msg}
                    getBadgeUrl={liveChat.getBadgeUrl}
                    onUsernameClick={handleUsernameClick}
                  />
                ))}
              </AnimatePresence>
              {/* Bottom spacer so latest messages appear slightly up */}
              <div className="h-[10px] w-full pointer-events-none" />
            </div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#9146FF] hover:bg-[#7C3AED] text-white text-sm font-semibold rounded-full shadow-lg transition-colors"
            >
              <ArrowDown className="h-4 w-4" />
              New messages
            </motion.button>
          )}
        </AnimatePresence>

        {/* User history sidebar */}
        <AnimatePresence>
          {selectedUser && (
            <UserChatHistorySidebar
              selectedUser={selectedUser}
              messages={messages}
              onClose={() => setSelectedUser(null)}
              getBadgeUrl={liveChat.getBadgeUrl}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Input Area - Twitch Style */}
      <div className="px-4 py-3 bg-[#18181B] border-t border-[#303032] shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#0E0E10] border border-[#303032] rounded">
          <span className="text-[#6B6B6F] text-sm shrink-0">Chat</span>
          <input
            type="text"
            disabled
            placeholder="Chat is read-only (viewer mode)"
            className="flex-1 bg-transparent text-sm text-[#EFEFF1] placeholder-[#6B6B6F] focus:outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}

function MessageSquarePlaceholder() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#4A4A4F]"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
