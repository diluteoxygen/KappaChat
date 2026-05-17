# AGENTS.md - AI Agent Guidelines for KappaChat

## Project Overview

**KappaChat** - A customizable, high-performance unified stream chat viewer built with **Next.js 16**.
Two UI modes: full-featured dashboard (KappaChat) and minimal streamer-mode (`/overlay`) for OBS overlays.
KappaChat aggregates live streams from **YouTube Live** and **Twitch** concurrently into a single real-time client feed.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion, YouTube.js (InnerTube), Upstash Redis

---

## MOST IMPORTANT RULE

**ALWAYS CHECK THE .agents/skills DIRECTORY** and if any foldername is connected to what you're building, read its SKILL.md file.

---

## Build & Development Commands

```bash
# Package manager: Bun (required)
bun install              # Install dependencies

# Development
bun run dev              # Start dev server (http://localhost:3000)
bun run build            # Production build
bun run start            # Start production server

# Code quality
bun run lint             # Run ESLint
bun run typecheck        # Run TypeScript type checking (tsc --noEmit)
```

### Running Tests

```bash
bun test                     # Run all tests
bun test path/to/file.test.ts   # Run single test file
bun test --watch             # Watch mode
```

Test files should use `*.test.ts` or `*.test.tsx` extension.
Testing libraries available: `@testing-library/react-hooks`, `happy-dom`, `react-test-renderer`

---

## Project Structure

```
src/
  app/                    # Next.js App Router
    api/                  # Backend endpoints
      twitch/             # Twitch APIs (7tv emotes, badges, users)
      youtube/            # YouTube APIs (connect, innertube, messages)
    globals.css           # Global styles & design tokens
    layout.tsx            # Root layout with providers
    page.tsx              # Landing & choice page component
  components/             # React components
    stream/               # Core unified and YouTube stream components
    twitch/               # Twitch-specific component views
  lib/
    hooks/                # Custom React hooks
      use7TVEmotes.ts     # 7TV static & animated emote fetcher
      useChat.ts          # YouTube chat connection hook
      useCustomization.tsx# Settings & local customization states
      useDemoChat.ts      # Demo mode chat loop simulation
      useTwitchChat.ts    # Twitch WebSocket IRC connector
      useUnifiedChat.ts   # Aggregates YouTube and Twitch into one feed
    cache.ts              # Server-side caching (Redis + memory)
    emoji-parser.ts       # 7TV emote injection utility
    youtube.ts            # YouTube API and URL parsing utilities
  types/
    youtube.ts            # TypeScript type definitions (unified ChatMessage shape)
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - all code must pass strict TypeScript checks.
- Use explicit return types for exported functions.
- Define interfaces for component props and API responses.
- Use `type` for unions/aliases, `interface` for object shapes.

```typescript
// Good: Explicit interface for props
interface ChatMessageProps {
  message: ChatMessageType;
}

// Good: Type for union types
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error" | "offline";
```

### Imports

- Use path alias `@/*` for imports from `src/` directory.
- Group imports: React/Next.js first, then external libs, then internal modules.
- Use type-only imports when importing only types.

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types/youtube";
import { useCustomization } from "@/lib/hooks/useCustomization";
```

### Naming Conventions

- **Components:** PascalCase (`ChatMessage.tsx`, `ConnectionStatus.tsx`)
- **Hooks:** camelCase with `use` prefix (`useChat.ts`, `useCustomization.tsx`)
- **Types/Interfaces:** PascalCase (`ChatMessage`, `ConnectionState`)
- **Functions/variables:** camelCase (`extractVideoId`, `pollingRef`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants
- **Files:** Match the primary export name.

---

## Technical Details

### Unified Live Chat Architecture
- **YouTube Chat**: Connected using **YouTube.js (InnerTube)** serverless wrapper (no quota limits, no API key required) as primary, with standard YouTube Data API v3 (BYOK) as a secondary fallback.
- **Twitch Chat**: Directly connects via client-side Twitch IRC WebSocket protocol.
- **7TV Emotes**: Fetches static & animated 7TV emotes for channels and parses them into text runs dynamically using a custom HTML tokenizer renderer.
- **Unified Hook**: `useUnifiedChat.ts` instantiates both Twitch and YouTube connections and blends their message arrays sorted by receipt timestamps.

### Caching & Rate Limiting
- **L1/L2 Cache**: Serverless endpoints utilize Upstash Redis for distributed cache lookup and in-memory caches as a local fallback.
- **Rate Limiting**: Serverless quota controls are managed with Redis transaction tracking (`INCR` + `EXPIRE`).

### ESLint Exceptions
These rules are intentionally disabled in `eslint.config.mjs`:
- `react-hooks/set-state-in-effect` - localStorage hydration pattern
- `react-hooks/immutability` - recursive callback patterns
- `react-hooks/incompatible-library` - @tanstack/react-virtual

---

## Security Rules (Aikido)

When generating or modifying code:
1. Run `aikido_full_scan` on all modified first-party code.
2. Fix any identified security issues using scan remediation.
3. Re-scan until zero security issues remain.

See `.agent/rules/aikido_rules.md` for full details.

---

## Don'ts

- Don't commit `.env` files or API keys.
- Don't use `require()` - use ES modules.
- Don't use `any` type - define proper types.
- Don't disable TypeScript strict checks.
- Don't add dependencies without checking bundle size impact.
