"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, FastForward, RotateCcw, ChevronDown, Zap } from "lucide-react";
import type { PlaybackSpeed } from "@/lib/hooks/useDemoChat";

interface DemoControlsProps {
  speed: PlaybackSpeed;
  setSpeed: (speed: PlaybackSpeed) => void;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  progress: number;
  loopCount: number;
  accentColor: string;
  /** Compact mode for smaller spaces */
  compact?: boolean;
}

const SPEED_OPTIONS: PlaybackSpeed[] = [1, 2, 5];

/**
 * Demo playback controls with speed selection, play/pause, and progress indicator
 * Auto-collapsed by default, expandable on click
 */
export function DemoControls({
  speed,
  setSpeed,
  isPaused,
  pause,
  resume,
  progress,
  loopCount,
  accentColor,
  compact = false,
}: DemoControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const progressPercent = Math.round(progress * 100);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Play/Pause */}
        <button
          onClick={isPaused ? resume : pause}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors active:scale-90"
          aria-label={isPaused ? "Resume demo" : "Pause demo"}
        >
          {isPaused ? (
            <Play className="h-3.5 w-3.5 text-white/60 fill-current" />
          ) : (
            <Pause className="h-3.5 w-3.5 text-white/60" />
          )}
        </button>

        {/* Speed indicator */}
        <button
          onClick={() => {
            const currentIndex = SPEED_OPTIONS.indexOf(speed);
            const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
            setSpeed(SPEED_OPTIONS[nextIndex]);
          }}
          className="text-[10px] font-bold text-white/40 hover:text-white/60 transition-colors min-w-[28px]"
          aria-label={`Change speed (current: ${speed}x)`}
        >
          {speed}x
        </button>

        {/* Mini progress bar */}
        <div className="relative w-12 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{ 
              backgroundColor: accentColor,
              width: `${progressPercent}%`,
            }}
          />
        </div>

        {/* Loop indicator */}
        {loopCount > 1 && (
          <span className="flex items-center gap-0.5 text-[10px] text-white/30">
            <RotateCcw className="h-2.5 w-2.5" />
            {loopCount}
          </span>
        )}
      </div>
    );
  }

  // Collapsible full controls
  return (
    <div className="w-full">
      {/* Collapsed toggle bar - using div with role="button" to allow nested button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 hover:bg-white/[0.07] border border-white/10 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" style={{ color: accentColor }} />
          <span className="text-xs font-semibold text-white/60">Demo Mode</span>
          <span className="text-[10px] text-white/30">{speed}x</span>
          {loopCount > 1 && (
            <span className="flex items-center gap-0.5 text-[10px] text-white/30">
              <RotateCcw className="h-2.5 w-2.5" />
              {loopCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Inline play/pause */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isPaused) { resume(); } else { pause(); }
            }}
            className="p-1 rounded bg-white/5 hover:bg-white/10 transition-colors"
            aria-label={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="h-3 w-3 fill-current" style={{ color: accentColor }} />
            ) : (
              <Pause className="h-3 w-3 text-white/50" />
            )}
          </button>
          
          {/* Mini progress */}
          <div className="relative w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
              style={{ backgroundColor: accentColor, width: `${progressPercent}%` }}
            />
          </div>
          
          <ChevronDown 
            className={`h-3.5 w-3.5 text-white/30 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
      </div>

      {/* Expanded controls */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-2 pb-1 px-1 flex items-center justify-between gap-3">
              {/* Play/Pause button */}
              <button
                onClick={isPaused ? resume : pause}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors active:scale-95"
                style={{
                  backgroundColor: isPaused ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isPaused ? `${accentColor}40` : "rgba(255,255,255,0.1)"}`,
                }}
                aria-label={isPaused ? "Resume demo playback" : "Pause demo playback"}
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" style={{ color: accentColor }} />
                    <span className="text-xs font-medium" style={{ color: accentColor }}>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 text-white/60" />
                    <span className="text-xs font-medium text-white/60">Pause</span>
                  </>
                )}
              </button>

              {/* Speed selector */}
              <div className="flex items-center gap-1">
                <FastForward className="h-3 w-3 text-white/30 mr-1" />
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                    style={{
                      backgroundColor: speed === s ? `${accentColor}25` : "transparent",
                      border: `1px solid ${speed === s ? `${accentColor}50` : "rgba(255,255,255,0.1)"}`,
                      color: speed === s ? accentColor : "rgba(255,255,255,0.4)",
                    }}
                    aria-label={`Set playback speed to ${s}x`}
                    aria-pressed={speed === s}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
