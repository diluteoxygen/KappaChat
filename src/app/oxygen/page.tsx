"use client";

import { useState, useEffect } from "react";
import { 
  Maximize,
  ArrowLeftRight,
  Play,
  Zap,
  Loader2,
  VideoOff,
  Users,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { ChatContainer } from "@/components/ChatContainer";
import { ChatInput } from "@/components/ChatInput";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { CustomizationSidebar, SidebarContent } from "@/components/CustomizationSidebar";
import { DemoControls } from "@/components/DemoControls";
import { MobileNav } from "@/components/MobileNav";
import { useChat } from "@/lib/hooks/useChat";
import { useDemoChat } from "@/lib/hooks/useDemoChat";
import { useCustomization } from "@/lib/hooks/useCustomization";

/**
 * DiluteOxygen-specific page that auto-connects to @DiluteOxygen's live stream
 * Uses the T3 layout but skips the choice screen
 */
export default function OxygenPage() {
  const [isDemo, setIsDemo] = useState(false);
  const [isLoadingLiveStatus, setIsLoadingLiveStatus] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [liveVideoId, setLiveVideoId] = useState<string | null>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
  
  const { 
    focusMode,
    chatWidth,
    maxLoadedMessages,
    updateField,
    accentColor,
    apiKey
  } = useCustomization();

  // Live chat hook
  const liveChat = useChat({
    maxMessages: maxLoadedMessages,
    apiKey,
  });

  // Demo chat hook
  const demoChat = useDemoChat({
    maxMessages: maxLoadedMessages,
  });

  // Use the appropriate chat based on demo mode
  const chat = isDemo ? demoChat : liveChat;
  const { messages, connectionState, error, streamInfo, connect, disconnect } = chat;

  // Extract demo-specific controls for the UI
  const demoControls = isDemo ? {
    speed: demoChat.speed,
    setSpeed: demoChat.setSpeed,
    isPaused: demoChat.isPaused,
    pause: demoChat.pause,
    resume: demoChat.resume,
    progress: demoChat.progress,
    loopCount: demoChat.loopCount,
  } : null;

  // Check if DiluteOxygen is live on page load
  useEffect(() => {
    const checkLiveStatus = async () => {
      try {
        const response = await fetch("/api/youtube/oxygen-live");
        const result = await response.json();
        
        if (result.status === "success") {
          setIsLive(result.data.isLive);
          setLiveVideoId(result.data.videoId || null);
        }
      } catch (err) {
        console.error("Failed to check live status:", err);
      } finally {
        setIsLoadingLiveStatus(false);
      }
    };

    checkLiveStatus();
  }, []);

  // Auto-connect if DiluteOxygen is live
  useEffect(() => {
    if (!isLoadingLiveStatus && !autoConnectAttempted && isLive && liveVideoId) {
      setAutoConnectAttempted(true);
      connect(`https://www.youtube.com/watch?v=${liveVideoId}`);
    }
  }, [isLoadingLiveStatus, autoConnectAttempted, isLive, liveVideoId, connect]);

  const handleStartDemo = async () => {
    liveChat.disconnect();
    setIsDemo(true);
    await demoChat.connect();
  };

  const handleConnectManually = async (videoUrl: string) => {
    liveChat.disconnect();
    setIsDemo(false);
    await connect(videoUrl);
  };

  const isConnected = connectionState === "connected";
  const isConnecting = connectionState === "connecting";
  const hasMessages = messages.length > 0;

  const clearError = () => {
    // Error dismissal handled by QuotaErrorBoundary
  };

  return (
    <div className="flex h-dvh bg-background text-text-v3 selection:bg-accent/30 overflow-hidden">
      {/* Side Customization Panel - Hidden in Focus Mode (desktop only) */}
      {!focusMode && (
        <CustomizationSidebar 
          onConnect={handleConnectManually}
          onDisconnect={disconnect}
          isConnected={isConnected}
          isConnecting={isConnecting}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <MobileNav accentColor={accentColor}>
        <SidebarContent 
          onConnect={handleConnectManually}
          onDisconnect={disconnect}
          isConnected={isConnected}
          isConnecting={isConnecting}
        />
      </MobileNav>

      {/* --- Main Content Area --- */}
      <main className="flex flex-1 flex-col overflow-hidden relative transition-all duration-300">
        
        {/* Floating Exit Focus Mode Button */}
        {focusMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => updateField("focusMode", false)}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white/50 hover:text-white backdrop-blur-md transition-all"
            title="Exit Focus Mode"
            aria-label="Exit Focus Mode"
          >
            <Maximize className="h-5 w-5 rotate-180" />
          </motion.button>
        )}

        {/* Transparent App Header - Hidden in Focus Mode */}
        {!focusMode && (
          <header className="flex h-16 items-center justify-between border-b border-card-border bg-background/50 px-8 backdrop-blur-md z-10 shrink-0 transition-colors duration-300">
            <div className="flex items-center gap-6">
              {streamInfo ? (
                <StreamInfoBar streamInfo={streamInfo} isDemo={isDemo} />
              ) : (
                <>
                  <span className="text-sm font-bold text-text-v1 tracking-tight">DiluteOxygen's Live Chat</span>
                  <div className="h-4 w-px bg-card-border" />
                  <span className="text-xs font-medium text-text-v5 px-2 py-1 rounded bg-white/5">
                    {messages.length} messages
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-4">
              <ConnectionStatus state={connectionState} error={error} isDemo={isDemo} />
              <div className="h-4 w-px bg-card-border mx-2" />
              
              <button 
                onClick={() => window.location.href = "/"}
                className="rounded-xl p-2.5 text-text-v5 hover:bg-accent/10 hover:text-accent transition-all active:scale-90"
                title="Go Home"
                aria-label="Go to home page"
              >
                <ArrowLeftRight className="h-4.5 w-4.5" />
              </button>
            </div>
          </header>
        )}

        {/* Chat Viewing Area */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full flex flex-col items-center">
            {/* Dynamic Width Container */}
            <div 
              className="h-full flex flex-col transition-all duration-300 ease-out border-x border-transparent"
              style={{ 
                width: `${chatWidth}%`,
                borderLeftColor: chatWidth < 100 ? 'var(--card-border)' : 'transparent',
                borderRightColor: chatWidth < 100 ? 'var(--card-border)' : 'transparent',
                backgroundColor: chatWidth < 100 ? 'var(--background)' : 'transparent'
              }}
            >
              {/* Show Loading, Offline, or Chat */}
              <div className="flex-1 overflow-hidden py-0">
                {isLoadingLiveStatus ? (
                  <LoadingStatus />
                ) : !isLive && !hasMessages && !isConnected ? (
                  <OfflineStatus onStartDemo={handleStartDemo} onConnect={handleConnectManually} />
                ) : (
                  <ChatContainer messages={messages} />
                )}
              </div>
              
              {/* Demo Controls - shown when in demo mode and not in focus mode */}
              {isDemo && demoControls && !focusMode && (
                <div className="w-full px-6 py-4 border-t border-card-border backdrop-blur-xl" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="max-w-3xl mx-auto">
                    <DemoControls
                      {...demoControls}
                      accentColor={accentColor}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Loading status component
 */
function LoadingStatus() {
  const { accentColor } = useCustomization();
  
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div 
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: accentColor }} />
        <p className="text-sm text-text-v4">Checking if DiluteOxygen is live...</p>
      </motion.div>
    </div>
  );
}

/**
 * Offline status component
 */
function OfflineStatus({ onStartDemo, onConnect }: { onStartDemo: () => Promise<void>; onConnect: (url: string) => Promise<void> }) {
  const { accentColor } = useCustomization();
  
  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <motion.div 
        className="relative p-8 rounded-3xl border backdrop-blur-xl max-w-md w-full text-center overflow-hidden"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          type: "spring",
          stiffness: 200,
          damping: 25,
        }}
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
        }}
      >
        <motion.div 
          className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border"
          style={{
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}05)`,
            borderColor: `${accentColor}30`,
          }}
        >
          <VideoOff className="h-8 w-8" style={{ color: accentColor }} />
        </motion.div>
        
        <h1 className="text-2xl font-black text-text-v1 mb-3 tracking-tight">
          DiluteOxygen is offline
        </h1>
        <p className="text-sm text-text-v4 mb-8 leading-relaxed">
          Check back later when @DiluteOxygen goes live, or try the demo mode.
        </p>
        
        <div className="flex flex-col gap-3">
          <motion.button
            onClick={onStartDemo}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
              border: `1px solid ${accentColor}60`,
              color: 'white',
              boxShadow: `0 4px 20px ${accentColor}40`,
            }}
            whileHover={{ 
              scale: 1.05,
              boxShadow: `0 8px 30px ${accentColor}50`,
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Zap className="h-4 w-4 fill-current" />
            Try the demo
          </motion.button>
          
          <p className="text-xs text-text-v5/50">
            Or connect via the sidebar
          </p>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Stream Info Bar Component
 */
function StreamInfoBar({ streamInfo, isDemo }: { streamInfo: { channelTitle: string; title: string; concurrentViewers?: string; actualStartTime?: string }; isDemo?: boolean }) {
  const { accentColor } = useCustomization();
  
  const formatDuration = (startTime?: string) => {
    if (!startTime) return null;
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="flex items-center gap-4 text-xs text-text-v5">
      {isDemo && (
        <motion.span 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider"
          style={{
            background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
            border: `1px solid ${accentColor}50`,
            color: accentColor,
          }}
          animate={{ 
            boxShadow: [
              `0 0 0px ${accentColor}00`,
              `0 0 12px ${accentColor}40`,
              `0 0 0px ${accentColor}00`,
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="h-3 w-3" />
          Demo
        </motion.span>
      )}
      <span className="font-semibold text-text-v3">{streamInfo.channelTitle}</span>
      <span className="hidden sm:inline truncate max-w-[200px]">{streamInfo.title}</span>
      {streamInfo.concurrentViewers && (
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {parseInt(streamInfo.concurrentViewers).toLocaleString()}
        </span>
      )}
      {streamInfo.actualStartTime && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(streamInfo.actualStartTime)}
        </span>
      )}
    </div>
  );
}
