"use client";

import { useState } from "react";

interface TwitchBadgeImageProps {
  /** The 2x CDN image URL from the badge map */
  imageUrl: string;
  /** Badge title for accessibility */
  title?: string;
  /** CSS size class or pixel value, defaults to 18 */
  size?: number | string;
}

/**
 * Renders a real Twitch badge image from the CDN.
 * Falls back gracefully if the image fails to load.
 */
export function TwitchBadgeImage({ imageUrl, title, size = 18 }: TwitchBadgeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <img
      src={imageUrl}
      alt={title ?? "badge"}
      title={title}
      width={typeof size === 'number' ? size : undefined}
      height={typeof size === 'number' ? size : undefined}
      className="inline-block shrink-0 rounded-sm"
      style={{ 
        imageRendering: "pixelated", 
        width: typeof size === 'string' ? size : undefined, 
        height: typeof size === 'string' ? size : undefined 
      }}
      onError={() => setFailed(true)}
    />
  );
}
