"use client";

import { useState } from "react";
import { X, Key, ExternalLink } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

/**
 * Settings modal for API key configuration
 */
export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onApiKeyChange,
}: SettingsModalProps) {
  const [inputValue, setInputValue] = useState(apiKey);

  if (!isOpen) return null;

  const handleSave = () => {
    onApiKeyChange(inputValue.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <section className="w-full max-w-md rounded-brand-2 border border-border-subtle bg-surface p-6 shadow-2xl">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <h2 id="settings-title" className="text-lg font-bold text-primary">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-brand-1 p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-primary"
            aria-label="Close settings"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        {/* API Key Input */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="api-key"
              className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary"
            >
              <Key className="h-4 w-4 text-accent" aria-hidden="true" />
              YouTube API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your YouTube Data API v3 key"
              className="w-full rounded-brand-1 border border-border bg-surface-elevated px-4 py-2.5 text-sm text-primary placeholder-muted transition-all focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-muted)] focus:outline-none"
            />
          </div>

          {/* Help text */}
          <p className="text-xs leading-relaxed text-muted">
            You need a YouTube Data API v3 key to use this app.{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
            >
              Get one from Google Cloud Console
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </p>
        </div>

        {/* Actions */}
        <footer className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-brand-1 px-4 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!inputValue.trim()}
            className="rounded-brand-1 bg-button px-6 py-2 text-sm font-bold text-white transition-all hover:bg-button-hover active:bg-button-active disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </footer>
      </section>
    </div>
  );
}
