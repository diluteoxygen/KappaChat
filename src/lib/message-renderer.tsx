import React, { useState } from "react";
import type { MessagePart } from "@/types/youtube";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderTextWithLinks(text: string): React.ReactNode {
  const parts = text.split(URL_REGEX);
  if (parts.length === 1) return text;
  
  return parts.map((part, i) => {
    if (part.match(URL_REGEX)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-400 hover:text-blue-300 hover:underline break-all transition-colors"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

interface EmoteImageProps {
  src: string;
  name: string;
  value: string;
}

function EmoteImage({ src, name, value }: EmoteImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <span>{value}</span>;
  }

  // NOTE: We do NOT use crossOrigin="anonymous" to avoid strict CORS preflight checks on static CDN images
  return (
    <img
      src={src}
      alt={name}
      title={name}
      className="inline-block h-[1.65375em] w-auto align-middle mx-0.5 object-contain font-semibold"
      style={{ imageRendering: 'pixelated' }}
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}

/**
 * Renders a chat message with rich content support (emojis, text, emote images)
 * 
 * @param message - Plain text fallback message
 * @param messageParts - Optional array of rich message parts (text, emoji with unicode or images)
 * @param messageHtml - Optional pre-serialized HTML from youtubei.js for InnerTube messages
 * @returns React elements for rendering the message with inline emojis and emote images
 */
export function renderMessage(message: string, messageParts?: MessagePart[], messageHtml?: string): React.ReactNode {
  if (messageParts && messageParts.length > 0) {
    return messageParts.map((part, idx) => {
      // Emoji with image URL (YouTube/Twitch/7TV custom emotes)
      if (part.type === 'emoji' && part.emojiData?.imageUrl) {
        return (
          <EmoteImage
            key={idx}
            src={part.emojiData.imageUrl}
            name={part.emojiData.name || part.value}
            value={part.value}
          />
        );
      }
      
      // Emoji with Unicode representation
      if (part.type === 'emoji' && part.emojiData?.unicode) {
        return <span key={idx}>{part.emojiData.unicode}</span>;
      }
      
      // Emoji without unicode or image (fallback to text)
      if (part.type === 'emoji' && part.emojiData?.name) {
        return <span key={idx}>{part.value}</span>;
      }
      
      // Render text parts with links
      return <span key={idx}>{renderTextWithLinks(part.value)}</span>;
    });
  }

  if (messageHtml) {
    return <span dangerouslySetInnerHTML={{ __html: messageHtml }} className="[&_a]:text-blue-400 [&_a]:hover:text-blue-300 [&_a]:hover:underline [&_a]:transition-colors" />;
  }

  // Fallback to plain text if no parts available
  return renderTextWithLinks(message);
}
