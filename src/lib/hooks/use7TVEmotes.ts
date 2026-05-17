"use client";

import { useCallback, useEffect, useState } from "react";

// Global state outside the hook so all instances share the same map
const globalEmotesMap: Record<string, string> = {};
const fetchedChannels = new Set<string>();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function use7TVEmotes() {
  const [emotesMap, setEmotesMap] = useState<Record<string, string>>(globalEmotesMap);

  useEffect(() => {
    const listener = () => setEmotesMap({ ...globalEmotesMap });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const fetch7TVEmotes = useCallback(async (broadcasterId?: string) => {
    const cacheKey = broadcasterId ?? "global";
    if (fetchedChannels.has(cacheKey)) return;
    fetchedChannels.add(cacheKey);

    try {
      const res = await fetch("/api/twitch/7tv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcasterId }),
      });

      if (!res.ok) {
        fetchedChannels.delete(cacheKey);
        return;
      }

      const data = await res.json();
      const emotes: Record<string, string> = data.emotes ?? {};

      if (Object.keys(emotes).length > 0) {
        Object.assign(globalEmotesMap, emotes);
        notifyListeners();
      }
    } catch {
      // Silently fail - 7TV emotes just won't be parsed
      fetchedChannels.delete(cacheKey);
    }
  }, []);

  return { fetch7TVEmotes, emotesMap };
}
