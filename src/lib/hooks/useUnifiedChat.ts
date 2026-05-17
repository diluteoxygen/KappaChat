"use client";

import { useMemo, useCallback } from "react";
import type { ChatMessage, ConnectionState } from "@/types/youtube";
import { useChat } from "@/lib/hooks/useChat";
import { useTwitchChat } from "@/lib/hooks/useTwitchChat";

interface UseUnifiedChatOptions {
  maxMessages?: number;
  apiKey?: string;
}

interface UnifiedChatState {
  youtube: {
    state: ConnectionState;
    error: string | null;
    isConnected: boolean;
    isConnecting: boolean;
  };
  twitch: {
    state: ConnectionState;
    error: string | null;
    isConnected: boolean;
    isConnecting: boolean;
  };
}

interface UseUnifiedChatReturn {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  error: string | null;
  streamInfo: {
    videoId: string;
    channelId: string;
    channelTitle: string;
    title: string;
    thumbnailUrl?: string;
    concurrentViewers?: string;
    actualStartTime?: string;
  } | null;
  clearMessages: () => void;
  connectYoutube: (videoUrl: string) => Promise<void>;
  disconnectYoutube: () => void;
  connectTwitch: (channelOrUrl: string) => Promise<void>;
  disconnectTwitch: () => void;
  unified: UnifiedChatState;
  /** Look up a Twitch badge image URL by setId + version */
  getBadgeUrl: (setId: string, version: string) => string | null;
  injectMessage: (msg: ChatMessage) => void;
}

export function useUnifiedChat({ maxMessages = 500, apiKey }: UseUnifiedChatOptions = {}): UseUnifiedChatReturn {
  const youtube = useChat({ maxMessages, apiKey });
  const twitch = useTwitchChat({ maxMessages });

  const messages = useMemo(() => {
    const all = [...youtube.messages, ...twitch.messages];
    all.sort((a, b) => {
      const timeA = a.receivedAt || a.timestamp.getTime();
      const timeB = b.receivedAt || b.timestamp.getTime();
      if (timeA === timeB) {
        return a.timestamp.getTime() - b.timestamp.getTime();
      }
      return timeA - timeB;
    });
    return all.slice(-maxMessages);
  }, [youtube.messages, twitch.messages, maxMessages]);

  const connectionState: ConnectionState = useMemo(() => {
    const yt = youtube.connectionState;
    const tw = twitch.connectionState;

    if (yt === "connected" || tw === "connected") return "connected";
    if (yt === "connecting" || tw === "connecting") return "connecting";
    if (yt === "error" || tw === "error") return "error";
    if (yt === "offline") return "offline";
    return "disconnected";
  }, [youtube.connectionState, twitch.connectionState]);

  const unified = useMemo<UnifiedChatState>(() => {
    return {
      youtube: {
        state: youtube.connectionState,
        error: youtube.error,
        isConnected: youtube.connectionState === "connected",
        isConnecting: youtube.connectionState === "connecting",
      },
      twitch: {
        state: twitch.connectionState,
        error: twitch.error,
        isConnected: twitch.connectionState === "connected",
        isConnecting: twitch.connectionState === "connecting",
      },
    };
  }, [youtube.connectionState, youtube.error, twitch.connectionState, twitch.error]);

  const error = useMemo(() => {
    if (youtube.error && twitch.error) {
      return `YouTube: ${youtube.error} | Twitch: ${twitch.error}`;
    }
    return youtube.error || twitch.error;
  }, [youtube.error, twitch.error]);

  const injectMessage = useCallback((msg: ChatMessage) => {
    if (msg.source === "twitch") {
      twitch.injectMessage(msg);
    } else {
      youtube.injectMessage(msg);
    }
  }, [youtube, twitch]);

  return {
    messages,
    connectionState,
    error,
    streamInfo: youtube.streamInfo || twitch.streamInfo,
    clearMessages: () => {
      youtube.clearMessages();
      twitch.clearMessages();
    },
    connectYoutube: youtube.connect,
    disconnectYoutube: youtube.disconnect,
    connectTwitch: twitch.connect,
    disconnectTwitch: twitch.disconnect,
    unified,
    getBadgeUrl: twitch.getBadgeUrl,
    injectMessage,
  };
}