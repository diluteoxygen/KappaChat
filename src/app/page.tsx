"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { StreamPage } from "@/components/stream/StreamPage";
import { ChevronRight } from "lucide-react";
import { useCustomization } from "@/lib/hooks/useCustomization";
import { springs } from "@/lib/motion";
import Image from "next/image";

import { useDemoChat } from "@/lib/hooks/useDemoChat";
import { StreamChatMessage } from "@/components/stream/StreamChatMessage";

function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { accentColor } = useCustomization();
  
  // Initialize demo chat for the right-side preview
  const { messages, connect, disconnect } = useDemoChat({ 
    maxMessages: 50,
    speed: 1, 
    loop: true 
  });

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen w-full flex items-center justify-center p-6 md:p-12 lg:p-16 xl:p-20 bg-[#0a0a0a] overflow-hidden"
    >
      {/* Top Right Shimmering Soft Edge Glow */}
      <motion.div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[150px] opacity-10 pointer-events-none"
        style={{ backgroundColor: accentColor }}
        animate={{
          opacity: [0.08, 0.18, 0.08],
          scale: [1, 1.05, 1],
          y: [-15, 15, -15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center z-10">
        
        {/* Left Column: Content */}
        <div className="space-y-8 flex flex-col items-start text-left order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-2"
          >
            <Image 
              src="/kappa.png" 
              alt="KappaChat Logo" 
              width={80} 
              height={80} 
              className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none"
          >
            Your stream's chat,
            <br />
            <span 
              style={{ 
                color: accentColor,
                filter: `drop-shadow(0 0 15px ${accentColor}D9)`
              }}
            >
              your way
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-lg text-zinc-400 leading-relaxed max-w-lg font-normal"
          >
            You deserve a <em className="italic text-white font-medium">better</em> multistream chat experience. No logins, no signups, no credit card.
          </motion.p>

          <motion.button
            onClick={onEnter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.95 }}
            className="group relative flex items-center gap-3 px-8 py-4 rounded-full text-white font-bold text-lg overflow-hidden transition-all shadow-xl"
            style={{ 
              backgroundColor: accentColor,
              boxShadow: `0 6px 20px -8px ${accentColor}`
            }}
          >
            <span className="relative z-10">Get Started</span>
            <ChevronRight className="relative z-10 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </motion.button>
        </div>

        {/* Right Column: Demo Box */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="order-1 lg:order-2 relative w-full h-[400px] lg:h-[500px] max-h-[70vh] rounded-[2rem] border border-white/10 bg-[#0a0a0a]/40 backdrop-blur-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{
            boxShadow: `0 20px 60px -25px ${accentColor}18, inset 0 0 0 1px rgba(255,255,255,0.05)`
          }}
        >
          {/* Mac-like header */}
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/5 bg-white/[0.02]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="mx-auto text-xs font-mono text-zinc-500">Live Preview</div>
          </div>
          
          {/* Chat Feed */}
          <div className="flex-1 overflow-hidden relative p-4 flex flex-col justify-end">
            {/* Fade mask at top */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0a0a0a]/80 to-transparent z-10 pointer-events-none" />
            
            <div className="flex flex-col gap-1 overflow-y-hidden justify-end">
              <LayoutGroup>
                <AnimatePresence mode="popLayout" initial={false}>
                  {messages.map((msg) => (
                    <StreamChatMessage 
                      key={msg.id} 
                      message={msg} 
                      getBadgeUrl={() => null}
                    />
                  ))}
                </AnimatePresence>
              </LayoutGroup>
            </div>
          </div>
        </motion.div>
        
      </div>
    </motion.div>
  );
}

export default function Home({ isCrackshotPreset = false }: { isCrackshotPreset?: boolean } = {}) {
  const [hasEntered, setHasEntered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const entered = localStorage.getItem("kappa_has_entered");
      if (entered === "true" || isCrackshotPreset) {
        setHasEntered(true);
      }
    }
    setMounted(true);
  }, [isCrackshotPreset]);

  const handleEnter = () => {
    setHasEntered(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("kappa_has_entered", "true");
    }
  };

  const handleLogout = () => {
    setHasEntered(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("kappa_has_entered");
      localStorage.removeItem("kappa_auto_connect");
    }
  };

  if (!mounted) {
    return <div className="h-screen w-full bg-[#0a0a0a]" />;
  }

  return (
    <AnimatePresence mode="wait">
      {!hasEntered ? (
        <LandingPage key="landing" onEnter={handleEnter} />
      ) : (
        <motion.main
          key="stream"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.smooth}
          className="h-dvh w-full bg-background overflow-hidden"
        >
          <StreamPage isCrackshotPreset={isCrackshotPreset} onLogout={handleLogout} />
        </motion.main>
      )}
    </AnimatePresence>
  );
}
