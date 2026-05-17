"use client";

import { useCallback, useRef, useState } from "react";

/**
 * useTwitchBadges — fetches and caches Twitch badge images.
 *
 * Call fetchBadges(broadcasterId) after connecting to a channel.
 * Then use getBadgeUrl(setId, version) to get the 2x image URL for a badge.
 */
export function useTwitchBadges() {
  // Map of "setId/version" -> image_url_2x
  const [badgeMap, setBadgeMap] = useState<Record<string, string>>({});
  const fetchedChannelsRef = useRef<Set<string>>(new Set());

  /**
   * Fetch global + channel-specific badges for a broadcaster.
   * No-ops if already fetched for this channel.
   */
  const fetchBadges = useCallback(async (broadcasterId?: string) => {
    const cacheKey = broadcasterId ?? "global";
    if (fetchedChannelsRef.current.has(cacheKey)) return;
    fetchedChannelsRef.current.add(cacheKey);

    try {
      const res = await fetch("/api/twitch/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ broadcasterId }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const badges: Record<string, string> = data.badges ?? {};

      if (Object.keys(badges).length > 0) {
        setBadgeMap((prev) => ({ ...prev, ...badges }));
      }
    } catch {
      // Silently fail — badge images just won't show
    }
  }, []);

  /**
   * Get the 2x image URL for a badge given its set ID and version.
   * Returns null if not yet loaded.
   */
  const getBadgeUrl = useCallback(
    (setId: string, version: string): string | null => {
      return badgeMap[`${setId}/${version}`] ?? null;
    },
    [badgeMap],
  );

  return { fetchBadges, getBadgeUrl, badgeMap };
}
