"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Key, Zap, X } from "lucide-react";
import { useCustomization } from "@/lib/hooks/useCustomization";
import { springs } from "@/lib/motion";

interface QuotaErrorBoundaryProps {
  error: string | null;
  onDismiss: () => void;
  onStartDemo: () => void;
}

export function QuotaErrorBoundary({ error, onDismiss, onStartDemo }: QuotaErrorBoundaryProps) {
  const { accentColor } = useCustomization();
  const [isVisible, setIsVisible] = useState(false);

  const isQuotaError = error?.toLowerCase().includes("quota") || 
                       error?.toLowerCase().includes("rate limit") ||
                       error?.includes("QUOTA_EXCEEDED") ||
                       error?.includes("RATE_LIMITED");

  useEffect(() => {
    setIsVisible(!!isQuotaError);
  }, [isQuotaError]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={handleDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={springs.smooth}
            className="relative max-w-md w-full rounded-2xl border border-white/10 bg-[#111] p-8 shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              aria-label="Close error dialog"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Warning glow */}
            <div 
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full blur-[80px] opacity-50"
              style={{ backgroundColor: "#f59e0b" }}
            />

            {/* Icon */}
            <motion.div 
              className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30"
              animate={{ 
                boxShadow: [
                  "0 0 0px rgba(245,158,11,0)",
                  "0 0 30px rgba(245,158,11,0.3)",
                  "0 0 0px rgba(245,158,11,0)",
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </motion.div>

            {/* Content */}
            <div className="relative text-center">
              <h2 className="text-xl font-black text-white mb-2">
                API Quota Exhausted
              </h2>
              <p className="text-sm text-white/50 mb-6 leading-relaxed">
                The daily YouTube API quota has been reached. Quota resets at midnight Pacific time.
              </p>

              {/* Options */}
              <div className="space-y-3">
                {/* Demo Mode Option */}
                <motion.button
                  onClick={() => {
                    handleDismiss();
                    onStartDemo();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
                    border: `1px solid ${accentColor}50`,
                    color: accentColor,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Zap className="h-4 w-4" />
                  Try Demo Mode (No API needed)
                </motion.button>

                {/* BYOK Option */}
                <motion.div
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-white/60"
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <Key className="h-4 w-4" />
                  <span>Or add your own API key in Settings</span>
                </motion.div>
              </div>

              <p className="text-[10px] text-white/30 mt-6">
                Get a free YouTube Data API key from Google Cloud Console
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
