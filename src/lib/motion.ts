/**
 * Motion Animation Presets
 * Lightweight, performant animation configuration
 * Prioritizes CSS transitions over JavaScript springs where possible
 */

import type { Transition, Variants } from "framer-motion";

/**
 * Spring configurations - tuned for snappy, lightweight feel
 * Higher damping = less bounce = faster settle
 */
export const springs = {
  /** Fast, minimal bounce - for buttons, toggles */
  snappy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
  },
  /** Smooth but quick - for content transitions */
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
  },
  /** Quick tween alternative - for simple fades */
  quick: {
    type: "tween" as const,
    duration: 0.15,
    ease: "easeOut",
  },
  /** Gentle for larger elements */
  gentle: {
    type: "tween" as const,
    duration: 0.2,
    ease: "easeOut",
  },
} satisfies Record<string, Transition>;

/**
 * Stagger configuration for list animations
 */
export const staggerConfig = {
  fast: 0.02,
  normal: 0.03,
  slow: 0.05,
};

/**
 * Chat message animation - simplified, no blur for performance
 */
export const chatMessageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

/**
 * Container variants for staggered children
 */
export const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerConfig.fast,
    },
  },
};

/**
 * Simple fade up - lightweight alternative
 */
export const fadeUpVariants: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

/**
 * Scale fade for modals - no blur
 */
export const scaleFadeVariants: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

/**
 * Slide variants for drawers/sidebars
 */
export const slideVariants = {
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
} satisfies Record<string, Variants>;

/**
 * Simple button interaction - scale only
 */
export const buttonInteraction = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: springs.snappy,
};

/**
 * Create staggered delay based on index
 */
export function getStaggerDelay(
  index: number,
  staggerAmount = staggerConfig.fast,
  maxDelay = 0.3,
): number {
  return Math.min(index * staggerAmount, maxDelay);
}
