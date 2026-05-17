"use client";

import { useState, FormEvent } from "react";
import { X, Play, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useCustomization } from "@/lib/hooks/useCustomization";

interface ChatInputProps {
  onConnect: (videoUrl: string) => Promise<void>;
  onDisconnect: () => void;
  isConnected: boolean;
  isConnecting: boolean;
  onConnectTwitch?: (channelOrUrl: string) => Promise<void>;
  onDisconnectTwitch?: () => void;
  isTwitchConnected?: boolean;
  isTwitchConnecting?: boolean;
}

/**
 * Premium Pill Input with Accent Glow
 */
export function ChatInput({
  onConnect,
  onDisconnect,
  isConnected,
  isConnecting,
  onConnectTwitch,
  onDisconnectTwitch,
  isTwitchConnected = false,
  isTwitchConnecting = false,
}: ChatInputProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const { accentColor } = useCustomization();
  const hasTwitchControls = Boolean(onConnectTwitch && onDisconnectTwitch);

  const handleYoutubeSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (videoUrl.trim() && !isConnecting) {
      await onConnect(videoUrl.trim());
    }
  };

  const handleTwitchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onConnectTwitch) return;
    if (twitchUrl.trim() && !isTwitchConnecting) {
      await onConnectTwitch(twitchUrl.trim());
    }
  };

  if (!hasTwitchControls) {
    return (
      <form
        onSubmit={handleYoutubeSubmit}
        className="relative w-full max-w-3xl mx-auto flex items-center gap-3 p-2 pl-4 rounded-full border backdrop-blur-sm transition-all duration-300 group"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderColor: isConnected ? `${accentColor}50` : "rgba(255, 255, 255, 0.1)",
          boxShadow: isConnected
            ? `0 0 20px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.3)`
            : "0 4px 20px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="absolute inset-0 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `0 0 30px ${accentColor}30, inset 0 0 20px ${accentColor}10`,
          }}
        />

        <div className="flex-1 flex items-center min-w-0 relative z-10">
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={isConnected ? "Connected to chat..." : "Paste any YouTube live stream URL..."}
            disabled={isConnected || isConnecting}
            className="w-full bg-transparent border-none text-text-v3 placeholder:text-text-v5/60 focus:outline-none focus:ring-0 text-sm py-1.5"
            aria-label="YouTube Video Link"
          />
        </div>

        <div className="flex items-center gap-1.5 relative z-10">
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
              title="Disconnect"
              aria-label="Disconnect from chat"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!videoUrl.trim() || isConnecting}
              className="flex h-9 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.95] disabled:opacity-50 disabled:grayscale"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 15px ${accentColor}40`,
              }}
              aria-label={isConnecting ? "Connecting to chat..." : "Connect to chat"}
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" />
                  <span className="hidden sm:inline">Connect</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div
      className="relative w-full max-w-3xl mx-auto rounded-3xl border backdrop-blur-sm transition-all duration-300 p-3 sm:p-4"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderColor: isConnected || isTwitchConnected ? `${accentColor}50` : "rgba(255, 255, 255, 0.1)",
        boxShadow:
          isConnected || isTwitchConnected
            ? `0 0 20px ${accentColor}20, 0 4px 20px rgba(0,0,0,0.3)`
            : "0 4px 20px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="absolute inset-0 rounded-3xl opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: `0 0 30px ${accentColor}30, inset 0 0 20px ${accentColor}10`,
        }}
      />

      <div className="relative z-10 flex flex-col gap-2.5">
        <form onSubmit={handleYoutubeSubmit} className="flex items-center gap-2.5">
          <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-text-v5/70 font-semibold">YouTube</span>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={isConnected ? "Connected" : "Paste YouTube live URL"}
            disabled={isConnected || isConnecting}
            className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-text-v3 placeholder:text-text-v5/60 focus:outline-none focus:ring-1 focus:ring-accent/50"
            aria-label="YouTube Video Link"
          />
          {isConnected ? (
            <button
              type="button"
              onClick={onDisconnect}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
              title="Disconnect YouTube"
              aria-label="Disconnect YouTube"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!videoUrl.trim() || isConnecting}
              className="flex h-9 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.95] disabled:opacity-50 disabled:grayscale"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 15px ${accentColor}40`,
              }}
              aria-label={isConnecting ? "Connecting YouTube..." : "Connect YouTube"}
            >
              {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
          )}
        </form>

        <form onSubmit={handleTwitchSubmit} className="flex items-center gap-2.5">
          <span className="w-16 shrink-0 text-[10px] uppercase tracking-widest text-text-v5/70 font-semibold">Twitch</span>
          <input
            type="text"
            value={twitchUrl}
            onChange={(e) => setTwitchUrl(e.target.value)}
            placeholder={isTwitchConnected ? "Connected" : "Paste Twitch live URL or channel"}
            disabled={isTwitchConnected || isTwitchConnecting}
            className="flex-1 rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm text-text-v3 placeholder:text-text-v5/60 focus:outline-none focus:ring-1 focus:ring-accent/50"
            aria-label="Twitch Channel Link"
          />
          {isTwitchConnected ? (
            <button
              type="button"
              onClick={onDisconnectTwitch}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90"
              title="Disconnect Twitch"
              aria-label="Disconnect Twitch"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!twitchUrl.trim() || isTwitchConnecting}
              className="flex h-9 items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-white shadow-lg transition-all hover:brightness-110 active:scale-[0.95] disabled:opacity-50 disabled:grayscale"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 4px 15px ${accentColor}40`,
              }}
              aria-label={isTwitchConnecting ? "Connecting Twitch..." : "Connect Twitch"}
            >
              {isTwitchConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
            </button>
          )}
        </form>
      </div>

      {!isConnected && !isConnecting && !isTwitchConnected && !isTwitchConnecting && !videoUrl && !twitchUrl && (
        <motion.div 
          className="absolute bottom-full left-0 right-0 mb-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="inline-flex flex-col gap-1 text-[10px] text-text-v5/40">
            <span>Try these examples:</span>
            <div className="flex gap-2 justify-center flex-wrap">
              <code className="px-2 py-1 bg-white/5 rounded text-text-v5/60 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setVideoUrl("https://www.youtube.com/watch?v=jfKfPfyJRdk")}>youtube</code>
              <code className="px-2 py-1 bg-white/5 rounded text-text-v5/60 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setTwitchUrl("https://www.twitch.tv/xqc")}>twitch</code>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
