"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  variant?: "default" | "circular" | "text" | "badge";
}

/**
 * Skeleton loading component with shimmer animation
 * Premium loading states for professional UX
 */
export function Skeleton({ className, variant = "default" }: SkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-white/5";
  
  const variantClasses = {
    default: "rounded-lg",
    circular: "rounded-full",
    text: "rounded h-4",
    badge: "rounded-full h-5 w-12",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ["-100%", "100%"] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

/**
 * Chat message skeleton for loading states
 */
export function ChatMessageSkeleton({ isCompact = false }: { isCompact?: boolean }) {
  if (isCompact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1">
        <Skeleton variant="circular" className="h-4 w-4 shrink-0" />
        <Skeleton variant="badge" className="w-10" />
        <Skeleton variant="text" className="flex-1 max-w-[200px]" />
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-6 py-2.5">
      <Skeleton variant="circular" className="h-9 w-9 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="badge" />
          <Skeleton variant="text" className="w-24" />
        </div>
        <Skeleton variant="text" className="w-full max-w-[300px]" />
      </div>
    </div>
  );
}

/**
 * Stream info bar skeleton
 */
export function StreamInfoSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton variant="badge" className="w-16" />
      <Skeleton variant="text" className="w-32" />
      <Skeleton variant="text" className="w-48 hidden sm:block" />
    </div>
  );
}

/**
 * Multiple chat messages skeleton for initial load
 */
export function ChatLoadingSkeleton({ count = 5, isCompact = false }: { count?: number; isCompact?: boolean }) {
  return (
    <div className="space-y-1 py-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <ChatMessageSkeleton isCompact={isCompact} />
        </motion.div>
      ))}
    </div>
  );
}
