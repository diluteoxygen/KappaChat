"use client";

import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  theme: "dark" | "light";
  onToggle: () => void;
}

/**
 * Dark/Light theme toggle button
 */
export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === "dark";

  return (
    <button
      onClick={onToggle}
      className="rounded-lg p-2 text-muted transition-colors hover:bg-surface-hover hover:text-primary"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
