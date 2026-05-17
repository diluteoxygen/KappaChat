"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, X, Check, Link as LinkIcon, MonitorPlay, Palette, Type, Layout } from "lucide-react";
import { springs } from "@/lib/motion";

interface OverlayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor?: string;
  ytUrl?: string;
  twitchUrl?: string;
}

export function OverlayConfigModal({ isOpen, onClose, accentColor = "#ef4444", ytUrl = "", twitchUrl = "" }: OverlayConfigModalProps) {
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");

  // Update URL whenever settings change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      if (ytUrl) params.append("ytUrl", ytUrl);
      if (twitchUrl) params.append("twitchUrl", twitchUrl);
      params.append("size", "medium");
      params.append("font", "baloo");
      params.append("stroke", "medium");
      params.append("shadow", "small");
      
      setGeneratedUrl(`${baseUrl}/overlay?${params.toString()}`);
    }
  }, [ytUrl, twitchUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={springs.smooth}
              className="w-full max-w-lg bg-sidebar border border-border rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${accentColor}20`, color: accentColor }}>
                    <MonitorPlay className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-text-v1">OBS Overlay Link</h2>
                    <p className="text-xs text-text-v5">Get your transparent chat link for OBS</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-v5 hover:text-text-v1 hover:bg-surface-hover rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.1) transparent" }}>
                
                {/* Source Info */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-text-v5 uppercase tracking-wider">
                    <LinkIcon className="h-4 w-4" /> Connection
                  </label>
                  <div className="bg-surface-muted/30 border border-border rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-text-v4">YouTube:</span>
                      <span className="text-text-v1 truncate max-w-[200px]">{ytUrl || "Not connected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-v4">Twitch:</span>
                      <span className="text-text-v1 truncate max-w-[200px]">{twitchUrl || "Not connected"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer / URL Output */}
              <div className="p-6 border-t border-border bg-surface-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border border-border rounded-xl px-4 py-3 font-mono text-xs text-text-v4 overflow-hidden text-ellipsis whitespace-nowrap">
                    {generatedUrl}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-lg min-w-[100px]"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`,
                      boxShadow: `0 4px 15px ${accentColor}40`,
                    }}
                  >
                    {copied ? (
                      <><Check className="h-4 w-4" /> Copied</>
                    ) : (
                      <><Copy className="h-4 w-4" /> Copy</>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-text-v5 text-center">
                  Add a new "Browser Source" in OBS, paste this URL, and check "Control audio via OBS".
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
