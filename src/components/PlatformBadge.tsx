"use client";

interface PlatformBadgeProps {
  source?: "youtube" | "twitch" | "demo";
  size?: number | string;
}

/**
 * Premium Platform Badge Component
 * Renders beautifully styled, high-fidelity YouTube or Twitch logo badges.
 * Includes custom drop-shadow filters and responsive brand color palettes.
 */
export function PlatformBadge({ source, size = "1.1em" }: PlatformBadgeProps) {
  if (!source || source === "demo") return null;

  const style = { width: size, height: size };

  switch (source) {
    case "youtube":
      return (
        <span 
          className="inline-flex items-center justify-center shrink-0 text-[#FF0000] hover:text-red-400 transition-colors select-none"
          title="YouTube Live"
          aria-label="YouTube Live Chat"
        >
          <svg 
            className="fill-current drop-shadow-[0_1px_3px_rgba(255,0,0,0.35)] transition-transform hover:scale-105 duration-200" 
            style={style} 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.483 20.455 12 20.455 12 20.455s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </span>
      );
    case "twitch":
      return (
        <span 
          className="inline-flex items-center justify-center shrink-0 text-[#a970ff] hover:text-[#c499ff] transition-colors select-none"
          title="Twitch"
          aria-label="Twitch Chat"
        >
          <svg 
            className="fill-current drop-shadow-[0_1px_3px_rgba(169,112,255,0.35)] transition-transform hover:scale-105 duration-200" 
            style={style} 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
          </svg>
        </span>
      );
    default:
      return null;
  }
}
