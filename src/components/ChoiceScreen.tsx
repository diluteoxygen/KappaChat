"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, Palette, Sparkles, MessageSquare, ArrowRight, X } from "lucide-react";
import { springs } from "@/lib/motion";

interface ChoiceScreenProps {
  onChoice: (variant: "yt_chat" | "yT3_chat" | "twitch_chat") => void;
  onDismiss: () => void;
}

const ACCENT = "#CA0377"; // Primary magenta
const ACCENT_SOFT = "rgba(202, 3, 119, 0.15)";
const ACCENT_GLOW = "rgba(202, 3, 119, 0.4)";

const springTransition = { type: "spring" as const, stiffness: 300, damping: 28 };

/**
 * Redesigned choice screen - breaks the grid, left-aligned, single accent
 */
export function ChoiceScreen({ onChoice, onDismiss }: ChoiceScreenProps) {
  const [exiting, setExiting] = useState<"yt_chat" | "yT3_chat" | "twitch_chat" | null>(null);

  const handleChoice = useCallback(
    (variant: "yt_chat" | "yT3_chat" | "twitch_chat") => {
      setExiting(variant);
      setTimeout(() => onChoice(variant), 500);
    },
    [onChoice],
  );

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle background texture */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Single subtle accent glow */}
          <div 
            className="absolute top-0 right-0 w-[800px] h-[600px] opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 100% 0%, ${ACCENT_SOFT} 0%, transparent 60%)`,
            }}
          />

          {/* Content */}
          <motion.div
            className="relative z-10 w-full max-w-3xl mx-auto px-6 py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Header */}
            <div className="mb-10">
              <motion.h1 
                className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ...springTransition }}
              >
                Your stream's chat,
                <br />
                <span style={{ color: ACCENT }}>your way</span>
              </motion.h1>
              <motion.p 
                className="text-white/40 text-base max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Three ways to watch YouTube Live Chat. Pick the one that fits your setup.
              </motion.p>
            </div>

            {/* Secondary Options - Side by Side */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* YT Card */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ...springTransition }}
                onClick={() => handleChoice("yt_chat")}
                className="group relative text-left p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors">
                    <Monitor className="w-5 h-5 text-white/70" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">YT Overlay</h3>
                <p className="text-sm text-white/40 leading-relaxed">Minimal, transparent. Perfect for OBS scenes.</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-medium text-white/50 px-2 py-0.5 rounded bg-white/[0.06]">Minimal</span>
                  <span className="text-[10px] font-medium text-white/50 px-2 py-0.5 rounded bg-white/[0.06]">OBS</span>
                </div>
              </motion.button>

              {/* Twitch Card */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, ...springTransition }}
                onClick={() => handleChoice("twitch_chat")}
                className="group relative text-left p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center group-hover:border-white/[0.15] transition-colors">
                    <MessageSquare className="w-5 h-5 text-white/70" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">Twitch Style</h3>
                <p className="text-sm text-white/40 leading-relaxed">Classic 1:1 chat clone. Familiar and compact.</p>
                <div className="flex gap-2 mt-3">
                  <span className="text-[10px] font-medium text-white/50 px-2 py-0.5 rounded bg-white/[0.06]">Classic</span>
                  <span className="text-[10px] font-medium text-white/50 px-2 py-0.5 rounded bg-white/[0.06]">Chat</span>
                </div>
              </motion.button>
            </div>

            {/* Hero Card - T3 */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ...springTransition }}
              onClick={() => handleChoice("yT3_chat")}
              className="group relative w-full text-left p-5 rounded-xl border transition-all overflow-hidden"
              style={{ 
                borderColor: ACCENT,
                background: `linear-gradient(135deg, ${ACCENT_SOFT} 0%, rgba(202,3,119,0.05) 100%)`,
              }}
              whileHover={{ 
                y: -2,
                boxShadow: `0 8px 32px ${ACCENT_GLOW}`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Recommended badge */}
              <div className="absolute top-4 right-4">
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
                  style={{ 
                    background: ACCENT,
                    color: "white",
                  }}
                >
                  <Sparkles className="w-3 h-3" />
                  Recommended
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: ACCENT }}
                >
                  <Palette className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">Full Dashboard</h3>
              <p className="text-white/60 leading-relaxed max-w-md">
                Full control. Themes, layouts, effects, and complete chat customization for power users.
              </p>
              
              <div className="flex items-center gap-2 mt-4 text-sm font-medium" style={{ color: ACCENT }}>
                <span>Get started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>

            {/* Dismiss - More visible */}
            <motion.div 
              className="mt-8 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-white/30">
                Switch modes anytime from the top bar
              </p>
              <button
                onClick={onDismiss}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] text-sm text-white/50 hover:text-white/70 transition-all"
              >
                <X className="w-4 h-4" />
                Don&apos;t show again
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
