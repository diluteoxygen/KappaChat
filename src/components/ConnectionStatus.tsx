"use client";

import { motion } from "framer-motion";
import { Wifi, WifiOff, Loader2, AlertCircle, Moon, Zap } from "lucide-react";
import type { ConnectionState } from "@/types/youtube";
import { springs } from "@/lib/motion";

interface ConnectionStatusProps {
  state: ConnectionState;
  error?: string | null;
  isDemo?: boolean;
}

const stateConfig: Record<
  ConnectionState,
  { icon: typeof Wifi; color: string; bgColor: string; label: string; pulse?: boolean }
> = {
  disconnected: {
    icon: WifiOff,
    color: "text-white/40",
    bgColor: "bg-white/5",
    label: "Disconnected",
  },
  connecting: {
    icon: Loader2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    label: "Finding stream...",
  },
  connected: {
    icon: Wifi,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "Live",
    pulse: true,
  },
  error: {
    icon: AlertCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Error",
  },
  offline: {
    icon: Moon,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    label: "Stream Offline",
  },
};

/**
 * Connection status indicator with premium styling
 * Enhanced with motion and visual feedback
 */
export function ConnectionStatus({ state, error, isDemo }: ConnectionStatusProps) {
  const config = stateConfig[state];
  const Icon = isDemo ? Zap : config.icon;
  const isSpinning = state === "connecting";
  const displayLabel = isDemo ? "Demo Mode" : (error && state === "error" ? error : config.label);
  const displayColor = isDemo ? "text-accent" : config.color;
  const displayBg = isDemo ? "bg-accent/10" : config.bgColor;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={springs.snappy}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${displayColor} ${displayBg} border border-current/20`}
      role="status"
      aria-live="polite"
      aria-label={`Connection status: ${displayLabel}`}
    >
      {/* Animated icon container */}
      <motion.div
        className="relative"
        animate={config.pulse && !isDemo ? {
          scale: [1, 1.2, 1],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Icon
          className={`h-3.5 w-3.5 ${isSpinning ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        {/* Live pulse indicator */}
        {(config.pulse || isDemo) && state === "connected" && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: "currentColor" }}
            animate={{
              opacity: [0.5, 0, 0.5],
              scale: [1, 2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        )}
      </motion.div>
      
      <span className="truncate max-w-[120px]">{displayLabel}</span>
    </motion.div>
  );
}
