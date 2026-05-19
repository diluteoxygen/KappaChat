"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Zap, 
  Sparkles, 
  DollarSign, 
  Gift, 
  Trophy, 
  Bell, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import type { ChatMessage } from "@/types/youtube";
import { renderMessage } from "@/lib/message-renderer";
import { PlatformBadge } from "@/components/PlatformBadge";
import { springs } from "@/lib/motion";

interface StreamEventsSidebarProps {
  messages: ChatMessage[];
  onClose: () => void;
  accentColor?: string;
}

type EventFilterTab = "all" | "tips" | "subs" | "other";

export function StreamEventsSidebar({
  messages,
  onClose,
  accentColor = "#ca0377",
}: StreamEventsSidebarProps) {
  const [activeTab, setActiveTab] = useState<EventFilterTab>("all");
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

  // Extract all event messages (where isSuperChat is true)
  const allEvents = useMemo(() => {
    return messages.filter((msg) => msg.isSuperChat === true);
  }, [messages]);

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const amountStr = (event.superChatAmount || "").toLowerCase();
      const type = event.messageType;

      if (activeTab === "tips") {
        // Tips: superChatEvent, superStickerEvent, contains bits or dollars
        return (
          type === "superChatEvent" ||
          type === "superStickerEvent" ||
          amountStr.includes("bits") ||
          amountStr.includes("$") ||
          amountStr.includes("€") ||
          amountStr.includes("£") ||
          amountStr.includes("¥")
        );
      }

      if (activeTab === "subs") {
        // Subs: newSponsorEvent, giftMembershipReceivedEvent, membershipGiftingEvent, memberMilestoneChatEvent, contains sub/gift/member
        return (
          type === "newSponsorEvent" ||
          type === "giftMembershipReceivedEvent" ||
          type === "membershipGiftingEvent" ||
          type === "memberMilestoneChatEvent" ||
          amountStr.includes("sub") ||
          amountStr.includes("gift") ||
          amountStr.includes("member")
        );
      }

      if (activeTab === "other") {
        // Other: Raids or anything else that is not tips or subs
        const isTip = (
          type === "superChatEvent" ||
          type === "superStickerEvent" ||
          amountStr.includes("bits") ||
          amountStr.includes("$") ||
          amountStr.includes("€") ||
          amountStr.includes("£")
        );
        const isSub = (
          type === "newSponsorEvent" ||
          type === "giftMembershipReceivedEvent" ||
          type === "membershipGiftingEvent" ||
          type === "memberMilestoneChatEvent" ||
          amountStr.includes("sub") ||
          amountStr.includes("gift") ||
          amountStr.includes("member")
        );
        return !isTip && !isSub;
      }

      return true; // "all"
    });
  }, [allEvents, activeTab]);

  // Auto scroll to bottom of feed on mount or new events
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [filteredEvents.length]);

  // Tab Details & Metrics
  const metrics = useMemo(() => {
    const totalCount = allEvents.length;
    let tipsCount = 0;
    let subsCount = 0;
    let otherCount = 0;

    allEvents.forEach((event) => {
      const amountStr = (event.superChatAmount || "").toLowerCase();
      const type = event.messageType;

      if (
        type === "superChatEvent" ||
        type === "superStickerEvent" ||
        amountStr.includes("bits") ||
        amountStr.includes("$") ||
        amountStr.includes("€") ||
        amountStr.includes("£")
      ) {
        tipsCount++;
      } else if (
        type === "newSponsorEvent" ||
        type === "giftMembershipReceivedEvent" ||
        type === "membershipGiftingEvent" ||
        type === "memberMilestoneChatEvent" ||
        amountStr.includes("sub") ||
        amountStr.includes("gift") ||
        amountStr.includes("member")
      ) {
        subsCount++;
      } else {
        otherCount++;
      }
    });

    return {
      total: totalCount,
      tips: tipsCount,
      subs: subsCount,
      other: otherCount,
    };
  }, [allEvents]);

  const getEventIcon = (event: ChatMessage) => {
    const amountStr = (event.superChatAmount || "").toLowerCase();
    const type = event.messageType;

    if (amountStr.includes("bits")) return <Zap className="h-3 w-3 text-purple-400" />;
    if (amountStr.includes("gift")) return <Gift className="h-3 w-3 text-pink-400" />;
    if (amountStr.includes("sub") || amountStr.includes("member")) return <Sparkles className="h-3 w-3 text-emerald-400" />;
    if (amountStr.includes("raid")) return <Trophy className="h-3 w-3 text-blue-400" />;
    if (type === "superChatEvent" || amountStr.includes("$")) return <DollarSign className="h-3 w-3 text-amber-400" />;
    return <Bell className="h-3 w-3 text-text-v4" />;
  };

  return (
    <motion.div
      onClick={(e) => e.stopPropagation()}
      initial={{ x: "100%", opacity: 0.9 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0.9 }}
      transition={springs.smooth}
      className="absolute top-0 right-0 h-full w-[310px] sm:w-[340px] bg-sidebar border-l border-border/40 z-50 flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl stream-events-sidebar"
      style={{
        boxShadow: `-10px 0 30px -15px rgba(0, 0, 0, 0.5), inset 1px 0 0 0 rgba(255, 255, 255, 0.05)`,
      }}
    >
      {/* Background soft glow matching accent color */}
      <div 
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-[80px] opacity-15 pointer-events-none transition-all duration-500"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="relative p-4 pb-2 border-b border-border/20 shrink-0 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-[10px] font-black uppercase tracking-widest text-text-v1">Stream Events</h3>
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

      {/* Mini Metric Card */}
      <div className="p-4 py-3 border-b border-border/10 shrink-0 z-10 bg-white/[0.01]">
        <div className="grid grid-cols-4 gap-1 bg-black/25 p-1 rounded-xl border border-white/5">
          {[
            { id: "all" as const, label: "All", count: metrics.total },
            { id: "tips" as const, label: "Tips", count: metrics.tips },
            { id: "subs" as const, label: "Subs", count: metrics.subs },
            { id: "other" as const, label: "Other", count: metrics.other },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1 rounded-lg transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSelected 
                    ? "bg-accent text-white font-black shadow-md shadow-accent/20" 
                    : "hover:bg-white/5 text-text-v4 hover:text-text-v1"
                }`}
              >
                <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                  {tab.label}
                </span>
                <span className="text-xs font-mono font-black mt-1 leading-none">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Feed Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar relative"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(255,255,255,0.08) transparent",
        }}
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-text-v5/40 p-4">
            <Bell className="h-8 w-8 mb-2 stroke-[1.5] text-text-v5/20 animate-pulse" />
            <p className="text-xs">No stream events found for this filter in the current session.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEvents.map((event, index) => {
              const formattedTime = event.timestamp.toLocaleTimeString([], { 
                hour: "2-digit", 
                minute: "2-digit" 
              });

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                  className="relative group p-2.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-200 flex flex-col gap-1.5"
                  style={{
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Glowing Event Border matching amount color */}
                  <div 
                    className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-md" 
                    style={{ backgroundColor: event.superChatColor || "var(--accent)" }}
                  />

                  {/* Header row */}
                  <div className="flex items-center justify-between pl-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PlatformBadge source={event.source} size="0.8em" />
                      <span className="text-[10px] font-bold text-text-v4 truncate">
                        {event.authorName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Event amount Badge */}
                      <span 
                        className="rounded-full px-2 py-0.5 text-[8px] font-black text-white shadow-sm uppercase flex items-center gap-1"
                        style={{ backgroundColor: event.superChatColor || "var(--accent)" }}
                      >
                        {getEventIcon(event)}
                        {event.superChatAmount}
                      </span>
                      <span className="text-[8px] font-mono text-text-v5/40 tabular-nums">
                        {formattedTime}
                      </span>
                    </div>
                  </div>

                  {/* Comment / Notification Detail */}
                  {event.message && (
                    <div className="pl-1 text-[11px] text-text-v2 font-medium leading-relaxed break-words bg-black/10 p-1.5 rounded-lg border border-white/[0.02]">
                      {renderMessage(event.message, event.messageParts, event.messageHtml)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border/10 shrink-0 text-center bg-black/15">
        <span className="text-[8px] text-text-v5/30 font-semibold tracking-widest uppercase flex items-center justify-center gap-1">
          <ChevronRight className="h-2.5 w-2.5 text-accent animate-pulse" />
          Realtime Monitor Active
        </span>
      </div>
    </motion.div>
  );
}
