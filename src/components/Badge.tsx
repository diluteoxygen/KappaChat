"use client";

import { Crown, Shield, Star, BadgeCheck, Zap, Heart, Sparkles } from "lucide-react";
import type { BadgeType } from "@/types/youtube";

interface BadgeProps {
  type: BadgeType;
}

const badgeConfig: Record<BadgeType, { icon: typeof Crown; color: string; label: string }> = {
  owner: {
    icon: Crown,
    color: "text-yellow-400",
    label: "Channel Owner",
  },
  broadcaster: {
    icon: Crown,
    color: "text-yellow-400",
    label: "Broadcaster",
  },
  moderator: {
    icon: Shield,
    color: "text-green-400",
    label: "Moderator",
  },
  member: {
    icon: Star,
    color: "text-emerald-400",
    label: "Member",
  },
  verified: {
    icon: BadgeCheck,
    color: "text-blue-400",
    label: "Verified",
  },
  vip: {
    icon: Sparkles,
    color: "text-pink-400",
    label: "VIP",
  },
  subscriber: {
    icon: Heart,
    color: "text-purple-400",
    label: "Subscriber",
  },
  turbo: {
    icon: Zap,
    color: "text-violet-400",
    label: "Turbo",
  },
  prime: {
    icon: Crown,
    color: "text-blue-500",
    label: "Prime",
  },
};

/**
 * Badge component for displaying user roles/status
 * Supports both YouTube and Twitch badge types
 */
export function Badge({ type }: BadgeProps) {
  const config = badgeConfig[type];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center ${config.color}`}
      title={config.label}
      aria-label={config.label}
    >
      <Icon className="h-[1.05em] w-[1.05em]" aria-hidden="true" />
    </span>
  );
}
