"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatMessage, ConnectionState } from "@/types/youtube";
import { 
  getDemoMessagesWithDelays, 
  DEMO_STREAM_INFO, 
  DEMO_DURATION_MS 
} from "@/lib/demo-data";

export type PlaybackSpeed = 1 | 2 | 5;

interface UseDemoChatOptions {
  maxMessages?: number;
  speed?: PlaybackSpeed;
  loop?: boolean;
  /** Add slight randomization to message timing for natural feel */
  naturalTiming?: boolean;
}

interface UseDemoChatReturn {
  messages: ChatMessage[];
  connectionState: ConnectionState;
  error: string | null;
  streamInfo: typeof DEMO_STREAM_INFO | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clearMessages: () => void;
  isDemo: true;
  speed: PlaybackSpeed;
  setSpeed: (speed: PlaybackSpeed) => void;
  isPaused: boolean;
  pause: () => void;
  resume: () => void;
  /** Progress through demo (0-1) */
  progress: number;
  /** Current loop iteration (1-based) */
  loopCount: number;
  /** Total duration of one demo loop in ms (adjusted for speed) */
  totalDuration: number;
  /** Time elapsed in current loop in ms */
  elapsed: number;
  injectMessage: (msg: ChatMessage) => void;
}

/**
 * Add random jitter to timing for more natural message flow
 * Returns a value between -15% and +15% of the delay
 */
function addTimingJitter(delay: number): number {
  const jitterPercent = (Math.random() - 0.5) * 0.3; // -15% to +15%
  return Math.max(0, delay * (1 + jitterPercent));
}

/**
 * Demo chat hook - simulates live chat with pre-recorded data
 * Zero API calls, purely client-side playback
 */
export function useDemoChat({
  maxMessages = 500,
  speed: initialSpeed = 1,
  loop = true,
  naturalTiming = true,
}: UseDemoChatOptions = {}): UseDemoChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<typeof DEMO_STREAM_INFO | null>(null);
  const [speed, setSpeed] = useState<PlaybackSpeed>(initialSpeed);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loopCount, setLoopCount] = useState(1);
  const [elapsed, setElapsed] = useState(0);

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Total duration adjusted for current speed
  const totalDuration = DEMO_DURATION_MS / speed;

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Start progress tracking interval
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    progressIntervalRef.current = setInterval(() => {
      if (startTimeRef.current > 0) {
        const currentElapsed = Date.now() - startTimeRef.current;
        const currentDuration = DEMO_DURATION_MS / speed;
        const currentProgress = Math.min(1, currentElapsed / currentDuration);
        setElapsed(currentElapsed);
        setProgress(currentProgress);
      }
    }, 100); // Update every 100ms for smooth progress
  }, [speed]);

  const disconnect = useCallback(() => {
    clearTimeouts();
    setConnectionState("disconnected");
    setStreamInfo(null);
    startTimeRef.current = 0;
    pausedAtRef.current = 0;
    setIsPaused(false);
    setProgress(0);
    setLoopCount(1);
    setElapsed(0);
  }, [clearTimeouts]);

  const scheduleMessages = useCallback((fromOffset = 0, isNewLoop = false) => {
    clearTimeouts();
    
    if (isNewLoop) {
      setLoopCount((prev) => prev + 1);
    }
    
    const demoMessages = getDemoMessagesWithDelays();
    const now = Date.now();
    startTimeRef.current = now - fromOffset;

    // Start progress tracking
    startProgressTracking();

    demoMessages.forEach(({ message, delay }) => {
      // Apply natural timing jitter if enabled
      const jitteredDelay = naturalTiming ? addTimingJitter(delay) : delay;
      const adjustedDelay = jitteredDelay / speed;
      const targetTime = adjustedDelay - fromOffset;
      
      if (targetTime > 0) {
        const timeout = setTimeout(() => {
          // Generate fresh ID for each playback
          const freshMessage: ChatMessage = {
            ...message,
            id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            timestamp: new Date(),
          };
          
          setMessages((prev) => {
            const combined = [...prev, freshMessage];
            return combined.slice(-maxMessages);
          });
        }, targetTime);
        
        timeoutsRef.current.push(timeout);
      }
    });

    // Schedule loop restart if enabled
    if (loop) {
      const loopDelay = (DEMO_DURATION_MS / speed) - fromOffset + 1000;
      if (loopDelay > 0) {
        const loopTimeout = setTimeout(() => {
          setMessages([]); // Clear for fresh loop
          setProgress(0);
          setElapsed(0);
          scheduleMessages(0, true); // true = new loop
        }, loopDelay);
        timeoutsRef.current.push(loopTimeout);
      }
    }
  }, [speed, maxMessages, loop, naturalTiming, clearTimeouts, startProgressTracking]);

  const connect = useCallback(async () => {
    disconnect();
    setConnectionState("connecting");
    
    // Simulate brief connection delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setStreamInfo(DEMO_STREAM_INFO);
    setConnectionState("connected");
    setMessages([]);
    setLoopCount(1);
    scheduleMessages(0);
  }, [disconnect, scheduleMessages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const pause = useCallback(() => {
    if (connectionState !== "connected" || isPaused) return;
    
    clearTimeouts();
    pausedAtRef.current = Date.now() - startTimeRef.current;
    setIsPaused(true);
  }, [connectionState, isPaused, clearTimeouts]);

  const resume = useCallback(() => {
    if (connectionState !== "connected" || !isPaused) return;
    
    setIsPaused(false);
    // pausedAtRef is already in "real time" (not speed-adjusted), pass directly
    scheduleMessages(pausedAtRef.current);
  }, [connectionState, isPaused, scheduleMessages]);

  // Restart scheduling when speed changes
  useEffect(() => {
    if (connectionState === "connected" && !isPaused) {
      const elapsedTime = Date.now() - startTimeRef.current;
      scheduleMessages(elapsedTime / speed); // Convert to base time
    }
  }, [speed, connectionState, isPaused, scheduleMessages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeouts();
    };
  }, [clearTimeouts]);

  const injectMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      const combined = [...prev, msg];
      return combined.slice(-maxMessages);
    });
  }, [maxMessages]);

  return {
    messages,
    connectionState,
    error,
    streamInfo,
    connect,
    disconnect,
    clearMessages,
    isDemo: true,
    speed,
    setSpeed,
    isPaused,
    pause,
    resume,
    progress,
    loopCount,
    totalDuration,
    elapsed,
    injectMessage,
  };
}
