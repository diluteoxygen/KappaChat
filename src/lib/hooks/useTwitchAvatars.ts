"use client";

import { useCallback, useRef } from "react";

/**
 * Client-side Twitch avatar resolution hook.
 *
 * Batches user-ID lookups to /api/twitch/users, caches results in memory,
 * and returns a getter function for components to resolve avatars.
 *
 * Usage:
 *   const { resolveAvatars, getAvatar } = useTwitchAvatars();
 *   // After receiving messages, call resolveAvatars with user IDs
 *   resolveAvatars(["12345", "67890"]);
 *   // In render, get the real avatar (or null if not yet resolved)
 *   const url = getAvatar("12345");
 */

interface AvatarCacheEntry {
  avatarUrl: string;
  displayName: string;
}

export function useTwitchAvatars() {
  const cacheRef = useRef<Map<string, AvatarCacheEntry>>(new Map());
  const pendingRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUpdateRef = useRef<(() => void) | null>(null);

  const flush = useCallback(async () => {
    const batch = Array.from(pendingRef.current);
    pendingRef.current.clear();

    if (batch.length === 0) return;

    try {
      const response = await fetch("/api/twitch/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: batch }),
      });

      if (!response.ok) return;

      const result = await response.json();
      const users: Record<string, AvatarCacheEntry> = result.users || {};

      let hasNew = false;
      for (const [userId, data] of Object.entries(users)) {
        if (!cacheRef.current.has(userId)) {
          cacheRef.current.set(userId, data as AvatarCacheEntry);
          hasNew = true;
        }
      }

      // Mark unresolved IDs as "empty" so we don't re-fetch them
      for (const id of batch) {
        if (!cacheRef.current.has(id)) {
          cacheRef.current.set(id, { avatarUrl: "", displayName: "" });
        }
      }

      if (hasNew && onUpdateRef.current) {
        onUpdateRef.current();
      }
    } catch {
      // Silently fail — fallback avatars will be used
    }
  }, []);

  /**
   * Queue user IDs for avatar resolution. Debounces to batch them.
   */
  const resolveAvatars = useCallback(
    (userIds: string[]) => {
      let needsFlush = false;
      for (const id of userIds) {
        if (id && !cacheRef.current.has(id) && !pendingRef.current.has(id)) {
          pendingRef.current.add(id);
          needsFlush = true;
        }
      }

      if (needsFlush) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(flush, 400);
      }
    },
    [flush],
  );

  /**
   * Get the resolved avatar URL for a user ID, or null if not resolved yet.
   */
  const getAvatar = useCallback((userId: string): string | null => {
    const entry = cacheRef.current.get(userId);
    if (!entry || !entry.avatarUrl) return null;
    return entry.avatarUrl;
  }, []);

  /**
   * Register a callback to be invoked when new avatars are resolved.
   */
  const setOnUpdate = useCallback((cb: (() => void) | null) => {
    onUpdateRef.current = cb;
  }, []);

  return { resolveAvatars, getAvatar, setOnUpdate };
}
