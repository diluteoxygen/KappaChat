"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageSquare } from "lucide-react";
import { springs } from "@/lib/motion";

interface MobileNavProps {
  children: React.ReactNode;
  accentColor: string;
}

/**
 * Mobile navigation drawer
 * Full-screen sidebar for mobile devices
 */
export function MobileNav({ children, accentColor }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button - only visible on small screens */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          boxShadow: `0 8px 32px ${accentColor}40`,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={springs.snappy}
        aria-label="Open settings menu"
        aria-expanded={isOpen}
      >
        <Menu className="h-6 w-6 text-white" />
      </motion.button>

      {/* Mobile drawer overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={springs.smooth}
              className="md:hidden fixed inset-y-0 right-0 z-50 w-full max-w-[360px] bg-sidebar shadow-2xl overflow-hidden"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-card-border bg-sidebar">
                <div className="flex items-center gap-3">
                  <div 
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ 
                      background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}10)`,
                      border: `1px solid ${accentColor}30`,
                    }}
                  >
                    <MessageSquare className="h-5 w-5" style={{ color: accentColor }} />
                  </div>
                  <span className="text-lg font-black tracking-tight text-text-v1">Settings</span>
                </div>
                
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted hover:bg-surface-hover text-text-v5 hover:text-text-v1 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close settings menu"
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>

              {/* Drawer content - scrollable */}
              <div className="h-[calc(100%-76px)] overflow-y-auto custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
