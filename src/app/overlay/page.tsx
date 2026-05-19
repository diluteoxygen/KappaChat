"use client";

import { useEffect, useState, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Baloo_Tammudu_2 } from "next/font/google";
import { useUnifiedChat } from "@/lib/hooks/useUnifiedChat";
import { renderMessage } from "@/lib/message-renderer";
import { Badge } from "@/components/Badge";
import { TwitchBadgeImage } from "@/components/TwitchBadgeImage";
import { PlatformBadge } from "@/components/PlatformBadge";
import type { ChatMessage as ChatMessageType } from "@/types/youtube";
import { springs } from "@/lib/motion";

const baloo = Baloo_Tammudu_2({ 
  subsets: ["latin"], 
  weight: ["400", "500", "600", "700", "800"] 
});

const STREAM_USERNAME_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
  "#BB8FCE", "#85C1E9", "#F8B500", "#FF8C94"
] as const;

function getUsernameColor(channelId: string, badges: string[]): string {
  if (badges.includes("owner")) return "#FFD700";
  if (badges.includes("moderator")) return "#5E84F1";
  if (badges.includes("member")) return "#2BA640";

  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return STREAM_USERNAME_COLORS[Math.abs(hash) % STREAM_USERNAME_COLORS.length];
}

interface OverlayChatMessageProps {
  message: ChatMessageType;
  getBadgeUrl: (setId: string, version: string) => string | null;
  fadeTime: number;
}

function OverlayChatMessage({ message, getBadgeUrl, fadeTime }: OverlayChatMessageProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (fadeTime > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, fadeTime * 1000);
      return () => clearTimeout(timer);
    }
  }, [fadeTime]);

  const usernameColor = useMemo(
    () => message.authorColor || getUsernameColor(message.authorChannelId, message.badges),
    [message.authorChannelId, message.badges, message.authorColor]
  );

  const displayBadges = useMemo(() => {
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
    return badges;
  }, [message.badges]);

  if (!isVisible) return null;

  const isSuperChat = message.isSuperChat;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={springs.smooth}
      className={`py-1.5 px-3 my-1 rounded-xl transition-all ${
        isSuperChat 
          ? "bg-black/55 border-l-4 backdrop-blur-md shadow-lg" 
          : "hover:bg-white/[0.02]"
      }`}
      style={{
        borderLeft: isSuperChat ? `4px solid ${message.superChatColor}` : undefined,
      }}
    >
      <div className="flex flex-wrap items-center gap-x-2 leading-snug">
        {/* Super Chat Header Tag */}
        {isSuperChat && message.superChatAmount && (
          <span 
            className="rounded-full px-2 py-0.5 text-[10px] font-black text-white shrink-0 shadow-sm mr-1 uppercase"
            style={{ 
              backgroundColor: message.superChatColor,
              boxShadow: `0 2px 6px ${message.superChatColor}40`
            }}
          >
            {message.superChatAmount}
          </span>
        )}

        {/* Badges & Username */}
        <span className="inline-flex items-center gap-1 shrink-0">
          {(displayBadges.length > 0 || (message.twitchBadges && message.twitchBadges.length > 0)) && (
            <span className="inline-flex items-center gap-0.5 self-center translate-y-[-1px]">
              {message.twitchBadges && message.twitchBadges.length > 0 ? (
                message.twitchBadges.map(({ setId, version }) => {
                  const imgUrl = getBadgeUrl(setId, version);
                  return imgUrl ? (
                    <TwitchBadgeImage key={`${setId}/${version}`} imageUrl={imgUrl} title={setId} size="1em" />
                  ) : null;
                })
              ) : (
                displayBadges.map((badge) => <Badge key={badge} type={badge} />)
              )}
            </span>
          )}
          <span className="font-extrabold inline-flex items-center gap-1" style={{ color: usernameColor }}>
            <PlatformBadge source={message.source} size="1.1025em" />
            <span>{message.authorName}:</span>
          </span>
        </span>
        
        {/* Message text */}
        <span className={`font-bold whitespace-pre-wrap break-words [word-break:break-word] ${isSuperChat ? "text-amber-100" : "text-white"}`}>
          {renderMessage(message.message, message.messageParts, message.messageHtml)}
        </span>
      </div>
    </motion.article>
  );
}

function OverlayChat() {
  const searchParams = useSearchParams();
  const ytUrl = searchParams.get("ytUrl");
  const twitchUrl = searchParams.get("twitchUrl");
  const size = searchParams.get("size") || "large";
  const font = searchParams.get("font") || "segoe";
  const stroke = searchParams.get("stroke") || "off";
  const shadow = searchParams.get("shadow") || "small";
  const fade = parseInt(searchParams.get("fade") || "0", 10);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const liveChat = useUnifiedChat({
    maxMessages: 100, // keep it light for overlay
  });

  useEffect(() => {
    if (ytUrl) liveChat.connectYoutube(ytUrl);
    if (twitchUrl) liveChat.connectTwitch(twitchUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytUrl, twitchUrl]);

  // Listen to Simulation events from the control dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const bc = new BroadcastChannel("kappa_chat_events");
      bc.onmessage = (event) => {
        if (event.data && event.data.type === "INJECT_MOCK_MESSAGE") {
          const msg = event.data.message;
          // Hydrate timestamp back into Date object
          msg.timestamp = new Date(msg.timestamp);
          liveChat.injectMessage(msg);
        }
      };
      return () => {
        bc.close();
      };
    }
  }, [liveChat]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [liveChat.messages.length]);

  const getFontSize = () => {
    switch (size) {
      case "small": return "24px";
      case "large": return "48px";
      case "medium":
      default: return "32px";
    }
  };

  const getFontFamily = () => {
    switch (font) {
      case "baloo": return baloo.style.fontFamily;
      case "geist": return "var(--font-geist-sans), sans-serif";
      case "mono": return "var(--font-geist-mono), monospace";
      case "system": return "system-ui, sans-serif";
      case "inter": return "'Inter', sans-serif";
      case "segoe":
      default: return "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif";
    }
  };

  const getStroke = () => {
    switch (stroke) {
      case "thin": return "1px black";
      case "medium": return "2px black";
      case "thick": return "3px black";
      case "off":
      default: return "none";
    }
  };

  const getShadow = () => {
    switch (shadow) {
      case "small": return "1px 1px 0px black";
      case "medium": return "2px 2px 0px black";
      case "large": return "3px 3px 0px black";
      case "off":
      default: return "none";
    }
  };

  return (
    <div 
      className="h-dvh w-full overflow-hidden bg-transparent text-white"
      style={{
        fontFamily: getFontFamily(),
        fontSize: getFontSize(),
        WebkitTextStroke: getStroke(),
        textShadow: getShadow(),
        lineHeight: 1.4,
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        html, body {
          background: transparent !important;
          background-color: transparent !important;
        }
      `}} />
      <div
        ref={scrollRef}
        className="h-full overflow-y-auto px-4 flex flex-col justify-end pb-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <LayoutGroup>
          <div className="py-4 space-y-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {liveChat.messages.map((msg) => (
                <OverlayChatMessage 
                  key={msg.id} 
                  message={msg} 
                  getBadgeUrl={liveChat.getBadgeUrl}
                  fadeTime={fade}
                />
              ))}
            </AnimatePresence>
            {/* Bottom spacer so latest messages appear slightly up */}
            <div className="h-[20px] w-full pointer-events-none" />
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-transparent" />}>
      <OverlayChat />
    </Suspense>
  );
}
