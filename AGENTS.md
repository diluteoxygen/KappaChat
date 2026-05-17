# AGENTS.md - AI Agent Guidelines for yt-chat-view

## Project Overview

**yT3 Chat** - A customizable YouTube Live Chat viewer built with Next.js 16.
Two UI modes: full-featured (yT3 Chat) and minimal streamer-mode (yt_chat) for OBS overlays.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion

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

Testing infrastructure is set up but no tests exist yet. When adding tests:

```bash
# Expected test patterns (when tests are added)
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
    api/youtube/          # API routes (connect, messages)
    globals.css           # Global styles & design tokens
    layout.tsx            # Root layout with providers
    page.tsx              # Main page component
  components/             # React components
    stream/               # Streamer-mode components
  lib/
    hooks/                # Custom React hooks
    cache.ts              # Server-side caching (Redis + memory)
    demo-data.ts          # Demo chat messages
    motion.ts             # Framer Motion presets
    youtube.ts            # YouTube API utilities
  types/
    youtube.ts            # TypeScript type definitions
```

---

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - all code must pass strict TypeScript checks
- Use explicit return types for exported functions
- Define interfaces for component props and API responses
- Use `type` for unions/aliases, `interface` for object shapes

```typescript
// Good: Explicit interface for props
interface ChatMessageProps {
  message: ChatMessageType;
}

// Good: Type for union types
export type ConnectionState = "disconnected" | "connecting" | "connected" | "error" | "offline";
```

### Imports

- Use path alias `@/*` for imports from `src/` directory
- Group imports: React/Next.js first, then external libs, then internal modules
- Use type-only imports when importing only types

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
- **Files:** Match the primary export name

### Component Patterns

```typescript
"use client";  // Required for client components

import { useState } from "react";
import type { SomeType } from "@/types/youtube";

interface ComponentProps {
  prop1: string;
  prop2?: number;
}

/**
 * JSDoc comment describing the component
 */
export function ComponentName({ prop1, prop2 = 10 }: ComponentProps) {
  const [state, setState] = useState<string>("");
  
  // Component logic...
  
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
}
```

### Error Handling

- API routes return structured responses: `{ status: "success" | "error", data?, code?, message? }`
- Use try/catch with specific error messages
- Type-guard errors with `err instanceof Error`

```typescript
try {
  // operation
} catch (err) {
  const message = err instanceof Error ? err.message : "Failed to perform action";
  setError(message);
}
```

### Styling

- Use **Tailwind CSS v4** with custom design tokens from `globals.css`
- Use CSS custom properties for theming (`var(--font-family)`, `var(--border-radius)`)
- Prefer utility classes over inline styles (except for dynamic values)
- Use semantic color tokens: `text-text-v2`, `bg-surface-muted`, `border-border`

---

## API Routes

API routes use POST methods and return JSON:

```typescript
// src/app/api/youtube/connect/route.ts
export async function POST(request: Request) {
  const { videoId, apiKey } = await request.json();
  
  // Validate and process...
  
  return Response.json({
    status: "success",
    data: { liveChatId, videoId, channelId, title }
  });
}
```

---

## Environment Variables

```bash
YOUTUBE_API_KEY=           # Required: YouTube Data API v3 key
UPSTASH_REDIS_REST_URL=    # Optional: Redis URL for caching
UPSTASH_REDIS_REST_TOKEN=  # Optional: Redis token
# Alternative naming:
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

---

## Security Rules (Aikido)

When generating or modifying code:
1. Run `aikido_full_scan` on all modified first-party code
2. Fix any identified security issues using scan remediation
3. Re-scan until zero security issues remain

See `.agent/rules/aikido_rules.md` for full details.

---

## Key Technical Details

### YouTube API Integration
- Default channel restricted to `@t3dotgg` (channel ID: `UCbRP3c757lWg9M-U7TyEkXA`)
- BYOK mode unlocks all channels
- Video URL formats supported: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/live/`

### Caching Strategy
- L1: In-memory cache (warm serverless instances)
- L2: Upstash Redis (distributed cache)
- Request coalescing prevents duplicate API calls

### ESLint Exceptions
These rules are intentionally disabled in `eslint.config.mjs`:
- `react-hooks/set-state-in-effect` - localStorage hydration pattern
- `react-hooks/immutability` - recursive callback patterns
- `react-hooks/incompatible-library` - @tanstack/react-virtual

---

## Common Tasks

### Adding a New Component
1. Create file in `src/components/` with PascalCase naming
2. Add `"use client"` directive if using React hooks/state
3. Define props interface
4. Export named function component

### Adding a New Hook
1. Create file in `src/lib/hooks/` with `use` prefix
2. Add `"use client"` directive
3. Define options/return interfaces
4. Export named hook function

### Adding New Types
1. Add to `src/types/youtube.ts` or create new type file
2. Use JSDoc comments for documentation
3. Export types for use across the codebase

---

## Don'ts

- Don't commit `.env` files or API keys
- Don't use `require()` - use ES modules
- Don't use `any` type - define proper types
- Don't disable TypeScript strict checks
- Don't add dependencies without checking bundle size impact
