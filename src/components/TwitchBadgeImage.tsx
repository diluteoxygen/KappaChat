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

  const scaledSize = typeof size === 'number'
    ? size * 1.1025
    : typeof size === 'string' && size.endsWith('em')
      ? `${parseFloat(size) * 1.1025}em`
      : typeof size === 'string' && size.endsWith('px')
        ? `${parseFloat(size) * 1.1025}px`
        : size;

  return (
    <img
      src={imageUrl}
      alt={title ?? "badge"}
      title={title}
      width={typeof scaledSize === 'number' ? scaledSize : undefined}
      height={typeof scaledSize === 'number' ? scaledSize : undefined}
      className="inline-block shrink-0 rounded-sm"
      style={{ 
        imageRendering: "pixelated", 
        width: typeof scaledSize === 'string' ? scaledSize : undefined, 
        height: typeof scaledSize === 'string' ? scaledSize : undefined 
      }}
      onError={() => setFailed(true)}
    />
  );
}
