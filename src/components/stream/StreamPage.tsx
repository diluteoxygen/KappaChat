"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { 
  ArrowDown, 
  Wifi, 
  WifiOff, 
  Trash2, 
  Settings, 
  Play, 
  Youtube, 
  Loader2, 
  LogOut,
  Zap,
  Twitch,
  Palette,
  Type,
  Layout,
  Eye,
  Zap as ZapIcon,
  ChevronDown,
  RotateCcw,
  Check,
  Maximize,
  MonitorPlay,
  MessageSquare
} from "lucide-react";
import { StreamChatMessage } from "./StreamChatMessage";
import { useUnifiedChat } from "@/lib/hooks/useUnifiedChat";
import { useDemoChat } from "@/lib/hooks/useDemoChat";
import { 
  useCustomization, 
  type ChatStyle, 
  type ThemePreset, 
  type FontFamily, 
  type BorderRadius 
} from "@/lib/hooks/useCustomization";
import { DemoControls } from "@/components/DemoControls";
import { springs } from "@/lib/motion";

// Presets for settings sections
const colorPresets = ["#CA0377", "#9147ff", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
const themePresets: ThemePreset[] = ["dark", "light", "oled", "creamy", "custom"];
const fontPresets: { value: FontFamily; label: string }[] = [
  { value: "geist", label: "Geist" },
  { value: "inter", label: "Inter" },
  { value: "system", label: "System" },
  { value: "mono", label: "Mono" },
];
const radiusPresets: BorderRadius[] = ["none", "small", "medium", "large"];

/**
 * Collapsible Settings Section for the overlay panel
 */
function SettingsSection({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: typeof Palette; 
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-3 px-1 text-left hover:bg-surface-muted transition-colors rounded"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-text-v5" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-v5">{title}</span>
        </div>
        <ChevronDown 
          className={`h-3.5 w-3.5 text-text-v5/50 transition-transform duration-200 ${isOpen ? "" : "-rotate-90"}`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ${isOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"}`}
      >
        <div className="space-y-3 pt-1">
          {children}
        </div>
      </div>
    </div>
  );
}

interface StreamPageProps {
  isCrackshotPreset?: boolean;
  onLogout?: () => void;
}

/**
 * Ultra-minimal Streamer Chat Display
 * Designed for OBS overlays and stream displays
 * Enhanced with Motion spring physics
 */
export function StreamPage({ isCrackshotPreset = false, onLogout }: StreamPageProps = {}) {
  const [ytUrl, setYtUrl] = useState("");
  const [twitchUrl, setTwitchUrl] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [copiedOBS, setCopiedOBS] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const isProgrammaticScrollRef = useRef(false);

  const { 
    apiKey, 
    updateField, 
    resetToDefaults,
    fontSize, 
    accentColor,
    maxLoadedMessages,
    chatStyle,
    themePreset,
    fontFamily,
    borderRadius,
    showAvatars,
    showTimestamps,
    showBadges,
    messageAnimations,
    focusMode,
    chatWidth,
  } = useCustomization();

  const liveChat = useUnifiedChat({
    maxMessages: maxLoadedMessages,
    apiKey: apiKey,
  });

  const demoChat = useDemoChat({
    maxMessages: maxLoadedMessages,
  });

  const chat = isDemo ? demoChat : liveChat;
  const { messages, connectionState, streamInfo, clearMessages } = chat;

  const isYoutubeConnected = !isDemo && liveChat.unified.youtube.isConnected;
  const isYoutubeConnecting = !isDemo && liveChat.unified.youtube.isConnecting;
  const isTwitchConnected = !isDemo && liveChat.unified.twitch.isConnected;
  const isTwitchConnecting = !isDemo && liveChat.unified.twitch.isConnecting;

  // Extract demo-specific controls
  const demoControls = isDemo ? {
    speed: demoChat.speed,
    setSpeed: demoChat.setSpeed,
    isPaused: demoChat.isPaused,
    pause: demoChat.pause,
    resume: demoChat.resume,
    progress: demoChat.progress,
    loopCount: demoChat.loopCount,
  } : null;

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";

  const handleCopyOBSLink = async () => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      if (isYoutubeConnected && ytUrl) params.append("ytUrl", ytUrl);
      if (isTwitchConnected && twitchUrl) params.append("twitchUrl", twitchUrl);
      params.append("size", "large");
      params.append("font", "segoe");
      params.append("stroke", "off");
      params.append("shadow", "small");
      
      const generatedUrl = `${baseUrl}/overlay?${params.toString()}`;
      try {
        await navigator.clipboard.writeText(generatedUrl);
        setCopiedOBS(true);
        setTimeout(() => setCopiedOBS(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleStartDemo = async () => {
    liveChat.disconnectYoutube();
    liveChat.disconnectTwitch();
    setIsDemo(true);
    setYtUrl("");
    setTwitchUrl("");
    await demoChat.connect();
  };

  // Load saved URLs on mount and handle auto-connection
  useEffect(() => {
    let initialYt = "";
    let initialTwitch = "";

    if (isCrackshotPreset) {
      initialYt = "https://youtu.be/Cfho6ToHTMk";
      initialTwitch = "https://www.twitch.tv/crackshotplays";
      setYtUrl(initialYt);
      setTwitchUrl(initialTwitch);
    } else if (typeof window !== "undefined") {
      const savedYt = localStorage.getItem("kappa_yt_url");
      const savedTwitch = localStorage.getItem("kappa_twitch_url");
      if (savedYt) {
        initialYt = savedYt;
        setYtUrl(savedYt);
      }
      if (savedTwitch) {
        initialTwitch = savedTwitch;
        setTwitchUrl(savedTwitch);
      }
    }

    // Auto-connect if enabled or if crackshot preset is active
    if (typeof window !== "undefined") {
      const autoConnect = localStorage.getItem("kappa_auto_connect") === "true";
      if (autoConnect || isCrackshotPreset) {
        const trimYt = initialYt.trim();
        const trimTwitch = initialTwitch.trim();

        if (trimYt || trimTwitch) {
          setIsDemo(false);
          demoChat.disconnect();

          if (trimYt) {
            let formattedUrl = trimYt;
            if (!formattedUrl.startsWith("http") && !formattedUrl.includes("youtube.com")) {
              const name = formattedUrl.startsWith("@") ? formattedUrl : `@${formattedUrl}`;
              formattedUrl = `https://www.youtube.com/${name}/live`;
            } else if (formattedUrl.includes("youtube.com") && !formattedUrl.includes("/live") && !formattedUrl.includes("watch?v=")) {
              formattedUrl = formattedUrl.replace(/\/$/, '') + "/live";
            }
            liveChat.connectYoutube(formattedUrl);
          }

          if (trimTwitch) {
            liveChat.connectTwitch(trimTwitch);
          }
        }
      }
    }
  }, [isCrackshotPreset]);

  const handleConnectYoutube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ytUrl.trim()) {
      setIsDemo(false);
      demoChat.disconnect();
      
      let formattedUrl = ytUrl.trim();
      if (!formattedUrl.startsWith("http") && !formattedUrl.includes("youtube.com")) {
        // Just a channel name
        const name = formattedUrl.startsWith("@") ? formattedUrl : `@${formattedUrl}`;
        formattedUrl = `https://www.youtube.com/${name}/live`;
      } else if (formattedUrl.includes("youtube.com") && !formattedUrl.includes("/live") && !formattedUrl.includes("watch?v=")) {
        // Channel URL without /live
        formattedUrl = formattedUrl.replace(/\/$/, '') + "/live";
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("kappa_yt_url", ytUrl.trim());
        localStorage.setItem("kappa_auto_connect", "true");
      }
      await liveChat.connectYoutube(formattedUrl);
    }
  };

  const handleConnectTwitch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twitchUrl.trim()) {
      setIsDemo(false);
      demoChat.disconnect();
      
      if (typeof window !== "undefined") {
        localStorage.setItem("kappa_twitch_url", twitchUrl.trim());
        localStorage.setItem("kappa_auto_connect", "true");
      }
      await liveChat.connectTwitch(twitchUrl.trim());
    }
  };

  const handleUnifiedConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimYt = ytUrl.trim();
    const trimTwitch = twitchUrl.trim();
    
    if (!trimYt && !trimTwitch) return;
    
    setIsDemo(false);
    demoChat.disconnect();
    
    const promises: Promise<any>[] = [];
    
    if (trimYt && !isYoutubeConnected) {
      let formattedUrl = trimYt;
      if (!formattedUrl.startsWith("http") && !formattedUrl.includes("youtube.com")) {
        const name = formattedUrl.startsWith("@") ? formattedUrl : `@${formattedUrl}`;
        formattedUrl = `https://www.youtube.com/${name}/live`;
      } else if (formattedUrl.includes("youtube.com") && !formattedUrl.includes("/live") && !formattedUrl.includes("watch?v=")) {
        formattedUrl = formattedUrl.replace(/\/$/, '') + "/live";
      }
      
      if (typeof window !== "undefined") {
        localStorage.setItem("kappa_yt_url", trimYt);
        localStorage.setItem("kappa_auto_connect", "true");
      }
      promises.push(liveChat.connectYoutube(formattedUrl));
    }
    
    if (trimTwitch && !isTwitchConnected) {
      if (typeof window !== "undefined") {
        localStorage.setItem("kappa_twitch_url", trimTwitch);
        localStorage.setItem("kappa_auto_connect", "true");
      }
      promises.push(liveChat.connectTwitch(trimTwitch));
    }
    
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  };

  const handleDisconnect = () => {
    liveChat.disconnectYoutube();
    liveChat.disconnectTwitch();
    demoChat.disconnect();
    setIsDemo(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kappa_auto_connect");
    }
  };

  // Smooth auto-scroll with slight delay for animation
  useEffect(() => {
    if (isAutoScrollEnabled && scrollRef.current) {
      isProgrammaticScrollRef.current = true;
      const timer = setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth"
        });
        // Clear the flag after the smooth scroll animation completes (~500ms)
        setTimeout(() => {
          isProgrammaticScrollRef.current = false;
        }, 600);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isAutoScrollEnabled]);

  // Detect manual scroll — ignore events during programmatic scrolls
  const handleScroll = useCallback(() => {
    if (isProgrammaticScrollRef.current) return;
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setIsAutoScrollEnabled(isNearBottom);
  }, []);


  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden relative">
      {/* Subtle static background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full blur-[150px] opacity-30"
          style={{ backgroundColor: `${accentColor}15` }}
        />
      </div>

      {/* Settings Overlay */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={springs.smooth}
              className="absolute top-0 right-0 h-full w-80 bg-sidebar border-l border-border z-50 flex flex-col shadow-2xl overflow-y-auto"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-text-v4">Settings</h3>
                <div className="flex items-center gap-2">
                  <motion.button 
                    onClick={resetToDefaults}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-surface-muted text-text-v5 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Reset to defaults"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </motion.button>
                  <motion.button 
                    onClick={() => setShowSettings(false)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-surface-muted text-text-v4 hover:text-text-v1"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>

              {/* Connections Section */}
              <div className="px-6 pb-5 space-y-4">
                <label className="text-[10px] font-bold text-text-v5 uppercase tracking-widest flex items-center gap-2">
                  <Wifi className="h-3 w-3 animate-pulse text-accent" />
                  Connections
                </label>
                
                <form onSubmit={handleUnifiedConnect} className="space-y-3.5">
                  {/* YouTube Input Group */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Youtube className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span className="text-[10px] uppercase tracking-widest text-text-v5 font-semibold">YouTube</span>
                      </div>
                      {isYoutubeConnected && (
                        <button 
                          type="button" 
                          onClick={() => {
                            liveChat.disconnectYoutube();
                            if (!isTwitchConnected && typeof window !== "undefined") {
                              localStorage.removeItem("kappa_auto_connect");
                            }
                          }} 
                          className="text-[9px] uppercase tracking-widest text-red-400 font-bold hover:text-red-300 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={ytUrl} 
                      onChange={(e) => setYtUrl(e.target.value)}
                      placeholder={isYoutubeConnected ? "Connected" : isDemo ? "Demo active" : "URL or @username..."}
                      disabled={isYoutubeConnected || isYoutubeConnecting || isDemo}
                      className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-sm text-text-v1 placeholder:text-text-v5/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                    />
                  </div>

                  {/* Twitch Input Group */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Twitch className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                        <span className="text-[10px] uppercase tracking-widest text-text-v5 font-semibold">Twitch</span>
                      </div>
                      {isTwitchConnected && (
                        <button 
                          type="button" 
                          onClick={() => {
                            liveChat.disconnectTwitch();
                            if (!isYoutubeConnected && typeof window !== "undefined") {
                              localStorage.removeItem("kappa_auto_connect");
                            }
                          }} 
                          className="text-[9px] uppercase tracking-widest text-purple-400 font-bold hover:text-purple-300 transition-colors"
                        >
                          Disconnect
                        </button>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={twitchUrl} 
                      onChange={(e) => setTwitchUrl(e.target.value)}
                      placeholder={isTwitchConnected ? "Connected" : isDemo ? "Demo active" : "Channel name..."}
                      disabled={isTwitchConnected || isTwitchConnecting || isDemo}
                      className="w-full bg-surface-muted border border-border rounded-xl px-3 py-2.5 text-sm text-text-v1 placeholder:text-text-v5/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                    />
                  </div>

                  {/* Unified Submit Button */}
                  {!isYoutubeConnected && !isTwitchConnected ? (
                    <button 
                      type="submit" 
                      disabled={(isYoutubeConnecting || isTwitchConnecting) || (!ytUrl.trim() && !twitchUrl.trim()) || isDemo}
                      style={{
                        backgroundColor: (!ytUrl.trim() && !twitchUrl.trim()) || (isYoutubeConnecting || isTwitchConnecting) || isDemo ? "var(--surface-muted)" : "var(--accent)",
                      }}
                      className="w-full mt-2 py-3 rounded-xl text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                    >
                      {(isYoutubeConnecting || isTwitchConnecting) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Connecting Channels...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current" />
                          Connect Channels
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      {!isYoutubeConnected && ytUrl.trim() && (
                        <button 
                          type="submit"
                          disabled={isYoutubeConnecting}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {isYoutubeConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3 w-3 fill-current" />} Connect YT
                        </button>
                      )}
                      {!isTwitchConnected && twitchUrl.trim() && (
                        <button 
                          type="submit"
                          disabled={isTwitchConnecting}
                          className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                          {isTwitchConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3 w-3 fill-current" />} Connect Twitch
                        </button>
                      )}
                    </div>
                  )}
                </form>

                {(isDemo || isConnected) && (
                  <motion.button 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    type="button" 
                    onClick={handleDisconnect}
                    className="w-full px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 transition-colors"
                  >
                    {isDemo ? "Stop Demo" : "Disconnect All"}
                  </motion.button>
                )}
              </div>

              <div className="h-px bg-surface-muted mx-6" />

              {/* Customization Sections */}
              <div className="px-6 py-2">
                {isDemo && demoControls && (
                  <div className="pb-4"><DemoControls {...demoControls} accentColor={accentColor} /></div>
                )}

                {/* Theme & Colors */}
                <SettingsSection title="Theme" icon={Palette} defaultOpen={false}>
                  <div className="flex flex-wrap gap-1.5">
                    {themePresets.map((preset) => (
                      <button key={preset} onClick={() => updateField("themePreset", preset)}
                        className={`px-2.5 py-1.5 rounded text-[9px] font-bold capitalize border transition-colors flex-1 text-center min-w-[50px] ${themePreset === preset ? "bg-accent/10 border-accent text-accent" : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"}`}>
                        {preset}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {colorPresets.map((color) => (
                      <button key={color} onClick={() => updateField("accentColor", color)}
                        className={`h-6 w-6 rounded-full transition-transform ${accentColor === color ? "scale-110 ring-2 ring-accent/50" : "hover:scale-105"}`}
                        style={{ backgroundColor: color }}>
                        {accentColor === color && <Check className="h-3 w-3 text-white mx-auto" />}
                      </button>
                    ))}
                    <input type="color" value={accentColor} onChange={(e) => updateField("accentColor", e.target.value)}
                      className="h-6 w-6 rounded-full overflow-hidden border border-dashed border-border cursor-pointer" />
                  </div>
                </SettingsSection>

                {/* Typography */}
                <SettingsSection title="Text" icon={Type}>
                  <div className="flex flex-wrap gap-1.5">
                    {fontPresets.map((font) => (
                      <button key={font.value} onClick={() => updateField("fontFamily", font.value)}
                        className={`px-2.5 py-1.5 rounded text-[9px] font-bold border transition-colors flex-1 text-center min-w-[60px] ${fontFamily === font.value ? "bg-accent/10 border-accent text-accent" : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"}`}>
                        {font.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-v5 uppercase">Size</label>
                      <span className="text-[10px] font-mono text-text-v4 bg-surface-muted px-1.5 py-0.5 rounded">{fontSize}px</span>
                    </div>
                    <input type="range" min={12} max={22} value={fontSize} onChange={(e) => updateField("fontSize", parseInt(e.target.value))}
                      className="w-full accent-accent h-1.5 bg-surface-muted rounded-full appearance-none cursor-pointer" />
                  </div>
                </SettingsSection>

                {/* Layout */}
                <SettingsSection title="Layout" icon={Layout}>
                  <div className="flex gap-1.5">
                    {(["comfy", "compact"] as ChatStyle[]).map((style) => (
                      <button key={style} onClick={() => updateField("chatStyle", style)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${chatStyle === style ? "bg-accent/10 text-accent" : "bg-surface-muted text-text-v5 hover:bg-surface-hover"}`}>
                        {style}
                      </button>
                    ))}
                  </div>

                </SettingsSection>

                {/* Display */}
                <SettingsSection title="Display" icon={Eye}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Avatars", active: showAvatars, key: "showAvatars" as const },
                      { label: "Time", active: showTimestamps, key: "showTimestamps" as const },
                      { label: "Badges", active: showBadges, key: "showBadges" as const },
                      { label: "Anims", active: messageAnimations, key: "messageAnimations" as const },
                    ].map((item) => (
                      <button key={item.key} onClick={() => updateField(item.key, !item.active)}
                        className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${item.active ? "bg-accent/10 border-accent text-accent" : "bg-surface-muted border-transparent text-text-v5 hover:bg-surface-hover"}`}>
                        <span className="text-[10px] font-bold uppercase">{item.label}</span>
                        <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${item.active ? "bg-accent/50" : "bg-surface-muted"}`}>
                          <div className={`h-3 w-3 rounded-full bg-text-v1 shadow-sm transition-transform duration-150 ${item.active ? "translate-x-3" : "translate-x-0"}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </SettingsSection>

                {/* Performance */}
                <SettingsSection title="Performance" icon={ZapIcon}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-text-v5 uppercase">Max Messages</label>
                      <span className="text-[10px] font-mono text-text-v4 bg-surface-muted px-1.5 py-0.5 rounded">{maxLoadedMessages}</span>
                    </div>
                    <input type="range" min={100} max={1000} step={50} value={maxLoadedMessages}
                      onChange={(e) => updateField("maxLoadedMessages", parseInt(e.target.value))}
                      className="w-full accent-accent h-1.5 bg-surface-muted rounded-full appearance-none cursor-pointer" />
                  </div>
                  <p className="text-[9px] text-text-v5/50">Lower if experiencing lag</p>
                </SettingsSection>
              </div>

              {/* Footer */}
              <div className="mt-auto px-6 py-5 border-t border-border space-y-3">
                <p className="text-[10px] text-text-v5 text-center leading-relaxed">
                  Questions or bugs?{" "}
                  <a href="https://github.com/DiluteOxygen" target="_blank" rel="noopener noreferrer" className="text-text-v4 hover:text-text-v1 transition-colors">@DiluteOxygen</a>
                  {" "}·{" "}
                  <a href="https://github.com/DiluteOxygen/yt-chat-view" target="_blank" rel="noopener noreferrer" className="text-text-v4 hover:text-text-v1 transition-colors">GitHub</a>
                </p>
                <p className="text-[10px] text-text-v5/50 text-center">yt_chat streamer-mode v1.0</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Minimal Header with animations */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="relative flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-xl shrink-0 z-10"
      >
        <div className="flex items-center gap-4">
          {/* Logo with pulse */}
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.02 }}
            transition={springs.snappy}
          >
            <motion.div 
              className="h-8 w-8 rounded-lg flex items-center justify-center transition-all"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: isConnected ? `0 0 16px ${accentColor}60` : "none"
              }}
            >
              <Youtube className="h-4 w-4 text-white" />
            </motion.div>
            <span className="text-lg font-black text-text-v1 tracking-tight">KappaChat</span>
          </motion.div>

          {/* Connection Status with animated transitions */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${connectionState}-${isDemo}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={springs.snappy}
              className="flex items-center gap-2 text-sm"
            >
              {isConnected && isDemo ? (
                <>
                  <Zap className="h-4 w-4" style={{ color: accentColor }} />
                  <span className="font-bold" style={{ color: accentColor }}>Demo</span>
                  {/* Compact demo controls in header */}
                  {demoControls && (
                    <DemoControls
                      {...demoControls}
                      accentColor={accentColor}
                      compact
                    />
                  )}
                </>
              ) : isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-400" />
                  <span className="text-green-400 font-medium">Live</span>
                  {streamInfo && (
                    <motion.span 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-text-v5 hidden sm:inline"
                    >
                      {streamInfo.channelTitle}
                    </motion.span>
                  )}
                </>
              ) : isConnecting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4 text-text-v4" />
                  </motion.div>
                  <span className="text-text-v4 font-medium">Connecting...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-text-v5" />
                  <span className="text-text-v5 font-medium">Offline</span>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <motion.span 
            className="text-xs font-mono text-text-v5/50 hidden sm:inline"
            key={messages.length}
            initial={{ scale: 1.2, color: "var(--color-text-v4)" }}
            animate={{ scale: 1, color: "var(--color-text-v5)" }}
            transition={{ duration: 0.3 }}
          >
            {messages.length} msgs
          </motion.span>
          <motion.button
            onClick={clearMessages}
            className="p-2 rounded-xl text-text-v5 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear Chat"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
          <motion.button
            onClick={handleCopyOBSLink}
            className="p-2 rounded-xl text-text-v5 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            title="Copy OBS Overlay Link"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
          >
            {copiedOBS ? <Check className="h-4 w-4 text-amber-400" /> : <MonitorPlay className="h-4 w-4" />}
          </motion.button>
          <motion.button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl text-text-v5 hover:text-text-v1/60 hover:bg-surface-muted transition-colors"
            title="Open Settings"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
          >
            <Settings className="h-4 w-4" />
          </motion.button>
          {onLogout && (
            <motion.button
              onClick={onLogout}
              className="p-2 rounded-xl text-text-v5 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Exit to Landing Page"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={springs.snappy}
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          )}
        </div>
      </motion.header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden relative">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-2"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {/* Messages with layout animations */}
          <LayoutGroup>
            <div className="py-4 space-y-0">
              <AnimatePresence mode="popLayout" initial={false}>
                {messages.map((msg) => (
                  <StreamChatMessage 
                    key={msg.id} 
                    message={msg} 
                    getBadgeUrl={liveChat.getBadgeUrl}
                  />
                ))}
              </AnimatePresence>
            </div>
          </LayoutGroup>

          {/* Empty State with enhanced animation */}
          <AnimatePresence>
            {messages.length === 0 && !isConnected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={springs.gentle}
                className="flex flex-col items-center justify-center h-full w-full p-4 overflow-y-auto"
              >
                {/* Glassmorphism Card */}
                <motion.div 
                  className="relative p-6 sm:p-8 rounded-[2rem] border backdrop-blur-xl w-full max-w-md text-center overflow-hidden shadow-2xl my-auto"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3), 0 0 80px ${accentColor}10`,
                  }}
                >
                  {/* Accent glow orb */}
                  <div 
                    className="absolute -top-32 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
                    style={{ backgroundColor: accentColor }}
                  />
                  
                  {/* Icon */}
                  <motion.div 
                    className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
                      borderColor: `${accentColor}30`,
                    }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <MessageSquare className="h-6 w-6" style={{ color: accentColor }} />
                  </motion.div>
                  
                  <motion.h1 
                    className="text-2xl sm:text-3xl font-black text-text-v1 mb-2 tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Your stream's chat,
                    <br />
                    <span style={{ color: accentColor }}>your way</span>
                  </motion.h1>
                  <motion.p 
                    className="text-[11px] text-text-v4 mb-6 leading-relaxed max-w-xs mx-auto"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    Connect directly to YouTube or Twitch below.
                  </motion.p>
                  
                  {/* Connection Forms */}
                  <motion.form 
                    onSubmit={handleUnifiedConnect} 
                    className="space-y-3.5 max-w-sm mx-auto text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* YouTube Section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-text-v4 flex items-center gap-1.5">
                          <Youtube className="h-3 w-3 text-red-500 shrink-0" />
                          YouTube Stream
                        </span>
                        {isYoutubeConnected && (
                          <span className="text-[8px] uppercase tracking-wider text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">Connected</span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={ytUrl} 
                        onChange={(e) => setYtUrl(e.target.value)}
                        placeholder="URL or @username..."
                        disabled={isYoutubeConnected || isYoutubeConnecting || isDemo}
                        className="w-full bg-surface-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-text-v1 placeholder:text-text-v5/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                      />
                    </div>

                    {/* Twitch Section */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest text-text-v4 flex items-center gap-1.5">
                          <Twitch className="h-3 w-3 text-purple-400 shrink-0" />
                          Twitch Stream
                        </span>
                        {isTwitchConnected && (
                          <span className="text-[8px] uppercase tracking-wider text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded">Connected</span>
                        )}
                      </div>
                      <input 
                        type="text" 
                        value={twitchUrl} 
                        onChange={(e) => setTwitchUrl(e.target.value)}
                        placeholder="Channel name..."
                        disabled={isTwitchConnected || isTwitchConnecting || isDemo}
                        className="w-full bg-surface-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-text-v1 placeholder:text-text-v5/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed" 
                      />
                    </div>

                    {/* Giant Premium Unified Button */}
                    <motion.button 
                      type="submit" 
                      disabled={(isYoutubeConnecting || isTwitchConnecting) || (!ytUrl.trim() && !twitchUrl.trim()) || isDemo}
                      whileHover={{ scale: (!ytUrl.trim() && !twitchUrl.trim()) || (isYoutubeConnecting || isTwitchConnecting) || isDemo ? 1 : 1.015 }}
                      whileTap={{ scale: (!ytUrl.trim() && !twitchUrl.trim()) || (isYoutubeConnecting || isTwitchConnecting) || isDemo ? 1 : 0.985 }}
                      className="w-full py-2.5 mt-2 rounded-xl font-bold text-xs text-white shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: (!ytUrl.trim() && !twitchUrl.trim()) || (isYoutubeConnecting || isTwitchConnecting) || isDemo ? "var(--surface-muted)" : accentColor,
                        boxShadow: (!ytUrl.trim() && !twitchUrl.trim()) || (isYoutubeConnecting || isTwitchConnecting) || isDemo ? "none" : `0 8px 24px -8px ${accentColor}`,
                      }}
                    >
                      {(isYoutubeConnecting || isTwitchConnecting) ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-current" />
                          Connect Channels
                        </>
                      )}
                    </motion.button>
                  </motion.form>


                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-[10px] text-text-v5 mt-6"
                  >
                    Customize the look anytime from the settings menu.
                  </motion.p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!isAutoScrollEnabled && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.8 }}
              transition={springs.snappy}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                isProgrammaticScrollRef.current = true;
                setIsAutoScrollEnabled(true);
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
                setTimeout(() => { isProgrammaticScrollRef.current = false; }, 600);
              }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-xl shadow-red-500/30 hover:bg-red-600 transition-colors"
            >
              <ArrowDown className="h-4 w-4" />
              New messages
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
