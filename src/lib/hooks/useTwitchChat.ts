"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage, ConnectionState } from "@/types/youtube";
import { extractTwitchChannel, parseTwitchMessage } from "@/lib/twitch";
import { inject7TVEmotes } from "@/lib/emoji-parser";
import { useTwitchAvatars } from "@/lib/hooks/useTwitchAvatars";
import { useTwitchBadges } from "@/lib/hooks/useTwitchBadges";
import { use7TVEmotes } from "@/lib/hooks/use7TVEmotes";

interface UseTwitchChatOptions {
  maxMessages?: number;
}

interface TwitchStreamInfo {
  videoId: string;
  channelId: string;
  channelTitle: string;
  title: string;
}

interface UseTwitchChatReturn {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  error: string | null;
  streamInfo: TwitchStreamInfo | null;
  connect: (channelOrUrl: string) => Promise<void>;
  disconnect: () => void;
  clearMessages: () => void;
  retryCount: number;
  /** Look up a Twitch badge image URL by setId + version */
  getBadgeUrl: (setId: string, version: string) => string | null;
  injectMessage: (msg: ChatMessage) => void;
}

const MAX_RETRIES = 4;
const RECONNECT_BASE_DELAY_MS = 1200;

function getRetryDelay(attempt: number): number {
  const jitter = Math.floor(Math.random() * 700);
  return Math.min(RECONNECT_BASE_DELAY_MS * Math.pow(2, attempt) + jitter, 12000);
}

export function useTwitchChat({ maxMessages = 500 }: UseTwitchChatOptions = {}): UseTwitchChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<TwitchStreamInfo | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReconnectRef = useRef(false);
  const channelRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Avatar resolution
  const { resolveAvatars, getAvatar, setOnUpdate } = useTwitchAvatars();
  // Badge image resolution
  const { fetchBadges, getBadgeUrl } = useTwitchBadges();
  // 7TV Emotes resolution
  const { fetch7TVEmotes, emotesMap } = use7TVEmotes();
  // Keep a ref to emotesMap so the socket message handler can access the latest
  const emotesMapRef = useRef(emotesMap);
  useEffect(() => {
    emotesMapRef.current = emotesMap;
  }, [emotesMap]);

  // When avatars are resolved, update messages with real avatar URLs
  useEffect(() => {
    setOnUpdate(() => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.source !== "twitch") return msg;
          const realAvatar = getAvatar(msg.authorChannelId);
          if (realAvatar && realAvatar !== msg.authorAvatarUrl) {
            return { ...msg, authorAvatarUrl: realAvatar };
          }
          return msg;
        }),
      );
    });

    return () => setOnUpdate(null);
  }, [getAvatar, setOnUpdate]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const closeSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimer();
    closeSocket();
    channelRef.current = null;
    setConnectionState("disconnected");
    setError(null);
    setRetryCount(0);
    setStreamInfo(null);
  }, [clearReconnectTimer, closeSocket]);

  const connectSocket = useCallback(
    (channel: string, attempt: number) => {
      clearReconnectTimer();
      closeSocket();

      const socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
      wsRef.current = socket;

      socket.onopen = () => {
        const anonymousNick = `justinfan${Math.floor(Math.random() * 1000000)}`;
        socket.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
        socket.send("PASS SCHMOOPIIE");
        socket.send(`NICK ${anonymousNick}`);
        socket.send(`JOIN #${channel}`);

        setError(null);
        setConnectionState("connected");
        setRetryCount(attempt);
        setStreamInfo({
          videoId: `twitch:${channel}`,
          channelId: channel,
          channelTitle: channel,
          title: `Twitch chat: ${channel}`,
        });

        // Fetch badge images for this channel.
        // We use the channel name to look up the broadcaster ID first,
        // then fetch channel + global badges together.
        fetch("/api/twitch/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ logins: [channel] }),
        })
          .then((r) => r.json())
          .then((data) => {
            const broadcasterId: string | undefined =
              data.users && Object.keys(data.users).length > 0 
                ? Object.keys(data.users)[0] 
                : undefined;
            fetchBadges(broadcasterId);
            fetch7TVEmotes(broadcasterId);
          })
          .catch(() => {
            fetchBadges(undefined);
            fetch7TVEmotes(undefined);
          });
      };

      socket.onmessage = (event) => {
        const raw = typeof event.data === "string" ? event.data : "";
        const lines = raw.split("\r\n");
        const newUserIds: string[] = [];

        lines.forEach((line) => {
          if (!line) return;

          if (line.startsWith("PING")) {
            socket.send(line.replace("PING", "PONG"));
            return;
          }

          const parsed = parseTwitchMessage(line);
          if (!parsed) return;
          if (seenIdsRef.current.has(parsed.id)) return;

          // Inject 7TV emotes into the parsed message parts
          if (parsed.messageParts && emotesMapRef.current) {
            parsed.messageParts = inject7TVEmotes(parsed.messageParts, emotesMapRef.current);
          }

          seenIdsRef.current.add(parsed.id);

          // Check if we already have a resolved avatar for this user
          const cachedAvatar = getAvatar(parsed.authorChannelId);
          if (cachedAvatar) {
            parsed.authorAvatarUrl = cachedAvatar;
          } else {
            newUserIds.push(parsed.authorChannelId);
          }

          setMessages((prev) => {
            const merged = [...prev, parsed];
            return merged.slice(-maxMessages);
          });
        });

        // Queue new user IDs for avatar resolution
        if (newUserIds.length > 0) {
          resolveAvatars(newUserIds);
        }
      };

      socket.onerror = () => {
        setError("Failed to connect to Twitch chat");
        setConnectionState("error");
      };

      socket.onclose = () => {
        wsRef.current = null;
        if (!shouldReconnectRef.current) return;

        const nextAttempt = attempt + 1;
        if (nextAttempt > MAX_RETRIES) {
          setConnectionState("error");
          setError("Twitch chat disconnected after multiple retries");
          return;
        }

        setConnectionState("connecting");
        reconnectTimerRef.current = setTimeout(() => {
          connectSocket(channel, nextAttempt);
        }, getRetryDelay(nextAttempt));
      };
    },
    [clearReconnectTimer, closeSocket, maxMessages, resolveAvatars, getAvatar, fetchBadges, fetch7TVEmotes],
  );

  const connect = useCallback(
    async (channelOrUrl: string) => {
      const channel = extractTwitchChannel(channelOrUrl);
      if (!channel) {
        setConnectionState("error");
        setError("Please enter a valid Twitch URL or channel name");
        return;
      }

      shouldReconnectRef.current = true;
      channelRef.current = channel;
      seenIdsRef.current.clear();
      setMessages([]);
      setError(null);
      setRetryCount(0);
      setConnectionState("connecting");
      connectSocket(channel, 0);
    },
    [connectSocket],
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    seenIdsRef.current.clear();
  }, []);

  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      closeSocket();
    };
  }, [clearReconnectTimer, closeSocket]);

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
    getBadgeUrl,
    injectMessage,
  };
}