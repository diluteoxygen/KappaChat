"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/youtube";
import { useCustomization } from "@/lib/hooks/useCustomization";

interface ChatContainerProps {
  messages: ChatMessageType[];
  getBadgeUrl?: (setId: string, version: string) => string | null;
}

/**
 * Virtualized Chat Container
 * Respects 'maxLoadedMessages' implicitly via the messages prop length
 * Respects 'smoothScrollIntensity' for auto-scroll behavior
 */
export function ChatContainer({ messages, getBadgeUrl }: ChatContainerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const lastMessageCountRef = useRef(0);
  
  const { smoothScrollIntensity, chatStyle, messageAlign } = useCustomization();

  // Estimate size based on chat style (Compact vs Comfy)
  const estimateSize = useCallback(() => {
    // Compact: More accurate accounting for avatar, badges, text
    // Comfy: Conservative estimate to prevent overlap (actual is 60-120+px)
    return chatStyle === "compact" ? 22 : 100;
  }, [chatStyle]);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 20, // Increased from 10 to 20 for larger safety margin with varying message heights
  });

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = parentRef.current;
    
    // Determine if user is near bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceFromBottom < 100;
    
    setIsAutoScrollEnabled(isNearBottom);
    
    if (isNearBottom) {
      setNewMessageCount(0);
    }
  }, []);

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      // New messages arrived
      if (isAutoScrollEnabled) {
        // Scroll behavior based on intensity
        const behavior = smoothScrollIntensity === "off" ? "auto" : "smooth";
        
        // For 'high' intensity, we might want to ensure we're strictly at the bottom
        // But native smooth scroll is usually sufficient. 
        // If 'high' meant 'slow', we'd need custom animation. 
        // For now, we map 'off' -> auto (instant), 'low'/'high' -> smooth.
        
        virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior });
      } else {
        setNewMessageCount(prev => prev + (messages.length - lastMessageCountRef.current));
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isAutoScrollEnabled, virtualizer, smoothScrollIntensity]);

  return (
    <div className="relative h-full w-full">
      <div
        ref={parentRef}
        className="h-full overflow-y-auto custom-scrollbar scroll-smooth"
        onScroll={handleScroll}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={virtualizer.measureElement}
            >
              <div className={messageAlign === "center" ? "flex justify-center" : ""}>
                <ChatMessage message={messages[virtualRow.index]} getBadgeUrl={getBadgeUrl} />
              </div>
            </div>
          ))}
        </div>

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center p-8 animate-fade-in">
            <motion.div 
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 border border-accent/20"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 20px rgba(202, 3, 119, 0.1)",
                  "0 0 40px rgba(202, 3, 119, 0.2)",
                  "0 0 20px rgba(202, 3, 119, 0.1)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageSquare className="h-10 w-10 text-accent" />
            </motion.div>
            <h2 className="text-2xl font-bold text-text-v1 mb-3">Ready to watch live chat?</h2>
            <p className="text-text-v4 max-w-sm leading-relaxed mb-6">
              Paste any YouTube live stream URL below to start watching real-time messages instantly.
            </p>
            <div className="flex flex-col gap-2 text-[11px] text-text-v5">
              <span>✨ No registration required</span>
              <span>🚀 Works with any public live stream</span>
              <span>🎨 Fully customizable appearance</span>
            </div>
          </div>
        )}
      </div>

      {!isAutoScrollEnabled && newMessageCount > 0 && (
        <button
          onClick={() => virtualizer.scrollToIndex(messages.length - 1, { align: "end", behavior: "smooth" })}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white shadow-2xl shadow-accent/40 animate-fade-in active:scale-95 hover:brightness-110 transition-all"
          aria-label={`Scroll to ${newMessageCount} new messages`}
        >
          <ArrowDown className="h-4 w-4" />
          {newMessageCount} new messages
        </button>
      )}
    </div>
  );
}
