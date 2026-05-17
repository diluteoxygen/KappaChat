"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, ConnectionState, BadgeType, MessageType } from "@/types/youtube";
import { extractVideoId } from "@/lib/youtube";
import { use7TVEmotes } from "@/lib/hooks/use7TVEmotes";
import { inject7TVEmotes } from "@/lib/emoji-parser";

interface UseChatOptions {
  maxMessages?: number;
  apiKey?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  error: string | null;
  streamInfo: StreamInfo | null;
  connect: (videoUrl: string) => Promise<void>;
  disconnect: () => void;
  clearMessages: () => void;
  retryCount: number;
  injectMessage: (msg: ChatMessage) => void;
}

interface StreamInfo {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
  thumbnailUrl?: string;
  concurrentViewers?: string;
  actualStartTime?: string;
}

interface ApiMessage {
  id: string;
  snippet: {
    type: string;
    publishedAt: string;
    displayMessage?: string;
    textMessageDetails?: { messageText: string };
    superChatDetails?: {
      userComment?: string;
      amountDisplayString?: string;
      tier?: number;
    };
    superStickerDetails?: {
      amountDisplayString?: string;
      tier?: number;
      superStickerMetadata?: { altText?: string };
    };
  };
  authorDetails: {
    channelId: string;
    displayName: string;
    profileImageUrl: string;
    isChatOwner: boolean;
    isChatModerator: boolean;
    isChatSponsor: boolean;
    isVerified: boolean;
  };
}

/** Maximum retry attempts before giving up */
const MAX_RETRIES = 5;

/** Initial retry delay in ms */
const INITIAL_RETRY_DELAY = 1000;

/** Maximum retry delay in ms */
const MAX_RETRY_DELAY = 30000;

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(attempt: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(delay + jitter, MAX_RETRY_DELAY);
}

/**
 * Parse and improve error messages for better UX
 */
function getReadableError(error: string): string {
  const errorMap: Record<string, string> = {
    "liveChatEnded": "This stream has ended",
    "liveChatNotFound": "Live chat not found - is this a live stream?",
    "videoNotFound": "Video not found - check the URL",
    "quotaExceeded": "API quota exceeded - try again tomorrow or use your own API key",
    "rateLimitExceeded": "Too many requests - slowing down",
    "forbidden": "Access denied - this channel may restrict chat access",
    "Invalid YouTube URL": "Please enter a valid YouTube URL or video ID",
    "not a live stream": "This video is not currently live streaming",
    "QUOTA_EXCEEDED": "Daily API quota reached - try Demo Mode or add your own API key",
    "RATE_LIMITED": "Rate limited - please wait a moment",
    "CHANNEL_NOT_VERIFIED": "Only verified channels (100K+ subs) are supported without an API key",
    "CHANNEL_NOT_FOUND": "Channel not found - check the video URL",
    "NO_LIVE_CHAT": "This video does not have an active live chat",
    "INNERTUBE_ERROR": "Failed to connect via InnerTube - trying fallback",
  };

  for (const [key, message] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  
  return error;
}

/**
 * Get SuperChat tier color based on amount
 */
function getSuperChatColor(tier: number): string {
  const colors: Record<number, string> = {
    1: "#1565c0",
    2: "#00bfa5",
    3: "#ffca28",
    4: "#f57c00",
    5: "#e91e63",
    6: "#e62117",
    7: "#e62117",
  };
  return colors[tier] || colors[1];
}

/**
 * Get badges for a user
 */
function getBadges(author: ApiMessage["authorDetails"]): BadgeType[] {
  const badges: BadgeType[] = [];
  if (author.isChatOwner) badges.push("owner");
  if (author.isChatModerator) badges.push("moderator");
  if (author.isChatSponsor) badges.push("member");
  if (author.isVerified) badges.push("verified");
  return badges;
}

/**
 * Transform API message to ChatMessage
 */
function transformMessage(msg: ApiMessage): ChatMessage {
  const { snippet, authorDetails } = msg;

  let message = "";
  let isSuperChat = false;
  let superChatAmount: string | undefined;
  let superChatColor: string | undefined;

  switch (snippet.type) {
    case "textMessageEvent":
      message = snippet.textMessageDetails?.messageText || "";
      break;
    case "superChatEvent":
      message = snippet.superChatDetails?.userComment || "";
      isSuperChat = true;
      superChatAmount = snippet.superChatDetails?.amountDisplayString;
      superChatColor = getSuperChatColor(snippet.superChatDetails?.tier || 1);
      break;
    case "superStickerEvent":
      message = `[Super Sticker: ${snippet.superStickerDetails?.superStickerMetadata?.altText || "Sticker"}]`;
      isSuperChat = true;
      superChatAmount = snippet.superStickerDetails?.amountDisplayString;
      superChatColor = getSuperChatColor(snippet.superStickerDetails?.tier || 1);
      break;
    default:
      message = snippet.displayMessage || "";
  }

  return {
    id: msg.id,
    authorName: authorDetails.displayName.replace(/^@/, ''),
    authorAvatarUrl: authorDetails.profileImageUrl,
    authorChannelId: authorDetails.channelId,
    message,
    timestamp: new Date(snippet.publishedAt),
    receivedAt: Date.now(),
    badges: getBadges(authorDetails),
    isSuperChat,
    superChatAmount,
    superChatColor,
    messageType: snippet.type as MessageType,
  };
}

/**
 * Hook for managing YouTube Live Chat
 * 
 * Strategy: InnerTube SSE (primary) → Official API polling (fallback)
 * - InnerTube: No API key needed, no quota, works for any channel
 * - Official API: Used as fallback if InnerTube fails, requires API key
 */
export function useChat({ maxMessages = 500, apiKey }: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const { fetch7TVEmotes, emotesMap } = use7TVEmotes();
  const emotesMapRef = useRef(emotesMap);
  useEffect(() => {
    emotesMapRef.current = emotesMap;
  }, [emotesMap]);

  useEffect(() => {
    if (connectionState === "connected") {
      fetch7TVEmotes(); // fetch global emotes for YouTube
    }
  }, [connectionState, fetch7TVEmotes]);

  // Polling refs (official API fallback)
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const liveChatIdRef = useRef<string | null>(null);
  const pageTokenRef = useRef<string | undefined>(undefined);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const consecutiveErrorsRef = useRef(0);
  const connectionStateRef = useRef<ConnectionState>(connectionState);

  // InnerTube SSE ref
  const eventSourceRef = useRef<EventSource | null>(null);
  const usingInnerTubeRef = useRef(false);

  useEffect(() => {
    connectionStateRef.current = connectionState;
  }, [connectionState]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const closeEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    stopPolling();
    closeEventSource();
    usingInnerTubeRef.current = false;
    liveChatIdRef.current = null;
    pageTokenRef.current = undefined;
    consecutiveErrorsRef.current = 0;
    setConnectionState("disconnected");
    setStreamInfo(null);
    setError(null);
    setRetryCount(0);
  }, [stopPolling, closeEventSource]);

  // ── Official API Polling (fallback) ──────────────────────

  const pollMessages = useCallback(async () => {
    if (!liveChatIdRef.current) return;

    try {
      const response = await fetch("/api/youtube/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liveChatId: liveChatIdRef.current,
          pageToken: pageTokenRef.current,
          apiKey,
        }),
      });

      const result = await response.json();

      if (result.status === "error") {
        throw new Error(result.message);
      }

      const data = result.data;

      consecutiveErrorsRef.current = 0;
      setRetryCount(0);
      setError(null);
      
      if (connectionStateRef.current !== "connected") {
        setConnectionState("connected");
      }

      if (data.offlineAt) {
        setConnectionState("offline");
        stopPolling();
        return;
      }

      const newMessages = data.items
        .map(transformMessage)
        .map((msg: ChatMessage) => {
          if (msg.messageParts && emotesMapRef.current) {
            msg.messageParts = inject7TVEmotes(msg.messageParts, emotesMapRef.current);
          }
          return msg;
        })
        .filter((msg: ChatMessage) => !seenIdsRef.current.has(msg.id));

      newMessages.forEach((msg: ChatMessage) => seenIdsRef.current.add(msg.id));

      if (newMessages.length > 0) {
        setMessages((prev) => {
          const combined = [...prev, ...newMessages];
          return combined.slice(-maxMessages);
        });
      }

      pageTokenRef.current = data.nextPageToken;

      const pollInterval = Math.max(data.pollingIntervalMillis, 1000);
      pollingRef.current = setTimeout(pollMessages, pollInterval);
    } catch (err) {
      consecutiveErrorsRef.current += 1;
      const errorCount = consecutiveErrorsRef.current;
      const rawMessage = err instanceof Error ? err.message : "Failed to fetch messages";
      const readableMessage = getReadableError(rawMessage);
      
      setError(readableMessage);
      setRetryCount(errorCount);
      
      if (errorCount >= MAX_RETRIES) {
        setConnectionState("error");
        stopPolling();
        setError(`${readableMessage} (gave up after ${MAX_RETRIES} attempts)`);
        return;
      }
      
      setConnectionState("error");
      const delay = getRetryDelay(errorCount);
      pollingRef.current = setTimeout(pollMessages, delay);
    }
  }, [maxMessages, stopPolling, apiKey]);

  const connectPolling = useCallback(
    async (videoId: string) => {
      try {
        const response = await fetch("/api/youtube/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, apiKey }),
        });

        const result = await response.json();

        if (result.status === "error") {
          throw new Error(result.message);
        }

        const data = result.data;
        liveChatIdRef.current = data.liveChatId;

        setStreamInfo({
          videoId: data.videoId,
          channelId: data.channelId,
          channelTitle: data.channelTitle,
          title: data.title,
          thumbnailUrl: data.thumbnailUrl,
          concurrentViewers: data.concurrentViewers,
          actualStartTime: data.actualStartTime,
        });

        setConnectionState("connected");
        pollMessages();
      } catch (err) {
        const rawMessage = err instanceof Error ? err.message : "Failed to connect";
        const readableMessage = getReadableError(rawMessage);
        setError(readableMessage);
        setConnectionState("error");
      }
    },
    [pollMessages, apiKey],
  );

  // ── InnerTube SSE (primary) ──────────────────────────────

  const connectInnerTube = useCallback(
    (videoId: string) => {
      return new Promise<boolean>((resolve) => {
        const es = new EventSource(`/api/youtube/innertube?videoId=${videoId}`);
        eventSourceRef.current = es;
        usingInnerTubeRef.current = true;

        let resolved = false;

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case "connected":
                setStreamInfo({
                  videoId,
                  channelId: data.streamInfo.channelId || "",
                  channelTitle: data.streamInfo.channelTitle || "",
                  title: data.streamInfo.title || "",
                  thumbnailUrl: data.streamInfo.thumbnailUrl,
                  concurrentViewers: data.streamInfo.concurrentViewers,
                });
                setConnectionState("connected");
                if (!resolved) {
                  resolved = true;
                  resolve(true);
                }
                break;

              case "message": {
                const msg: ChatMessage = {
                  ...data.message,
                  timestamp: new Date(data.message.timestamp),
                  receivedAt: Date.now(),
                };
                if (msg.messageParts && emotesMapRef.current) {
                  msg.messageParts = inject7TVEmotes(msg.messageParts, emotesMapRef.current);
                }
                if (!seenIdsRef.current.has(msg.id)) {
                  seenIdsRef.current.add(msg.id);
                  setMessages((prev) => {
                    const combined = [...prev, msg];
                    return combined.slice(-maxMessages);
                  });
                }
                break;
              }

              case "end":
                setConnectionState("offline");
                es.close();
                eventSourceRef.current = null;
                break;

              case "error":
                if (!resolved) {
                  resolved = true;
                  es.close();
                  eventSourceRef.current = null;
                  usingInnerTubeRef.current = false;
                  resolve(false);
                }
                break;
            }
          } catch {
            // JSON parse error, ignore
          }
        };

        es.onerror = () => {
          if (!resolved) {
            resolved = true;
            es.close();
            eventSourceRef.current = null;
            usingInnerTubeRef.current = false;
            resolve(false);
          } else {
            // Connection lost after successful connect - try to reconnect
            es.close();
            eventSourceRef.current = null;
            // If we were connected, attempt SSE reconnect
            if (connectionStateRef.current === "connected") {
              setConnectionState("connecting");
              setTimeout(() => {
                if (connectionStateRef.current !== "disconnected") {
                  connectInnerTube(videoId);
                }
              }, 2000);
            }
          }
        };
      });
    },
    [maxMessages],
  );

  // ── Public connect: InnerTube first, then fallback ───────

  const connect = useCallback(
    async (videoUrl: string) => {
      disconnect();
      setError(null);
      setConnectionState("connecting");
      seenIdsRef.current.clear();
      setMessages([]);

      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        setError("Please enter a valid YouTube URL or video ID");
        setConnectionState("error");
        return;
      }

      // Try InnerTube first (no quota, any channel)
      const innerTubeSuccess = await connectInnerTube(videoId);
      if (innerTubeSuccess) return;

      // Fallback to official API
      await connectPolling(videoId);
    },
    [disconnect, connectInnerTube, connectPolling],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    seenIdsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      stopPolling();
      closeEventSource();
    };
  }, [stopPolling, closeEventSource]);

  const injectMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const combined = [...prev, msg];
      return combined.slice(-maxMessages);
    });
  }, [maxMessages]);

  return {
    messages,
    connectionState,
    error,
    streamInfo,
    connect,
    disconnect,
    clearMessages,
    retryCount,
    injectMessage,
  };
}
