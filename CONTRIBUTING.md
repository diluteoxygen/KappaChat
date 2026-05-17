# Contributing to KappaChat

Thank you for your interest in contributing! This guide outlines how to set up the project locally, the coding conventions we follow, and how to submit your contributions.

---

## 🛠️ Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (required - the standard package manager for this project)
- Node.js 18+
- Git

### Development Setup

1. **Fork and Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/KappaChat.git
   cd KappaChat
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Start the Development Server**
   ```bash
   bun run dev
   ```

---

## 📂 Project Structure

```
src/
  app/                    # Next.js App Router pages & layouts
    api/                  # Backend endpoints
      twitch/             # Twitch endpoints (7tv, badges, users)
      youtube/            # YouTube endpoints (connect, innertube, messages)
    globals.css           # Global design tokens and theme rules
    layout.tsx            # Root layout with context providers
    page.tsx              # Main entry page
  components/             # UI Components
    stream/               # Streamer dashboard and live chat components
    twitch/               # Twitch chat dashboard pages
  lib/
    hooks/                # Custom hooks (useChat, useTwitchChat, useUnifiedChat, use7TVEmotes)
    cache.ts              # Server caching logic
    emoji-parser.ts       # Emote parsing & injecting utility
    youtube.ts            # YouTube integration helpers
  types/
    youtube.ts            # Shared TypeScript type definitions
```

---

## 🎨 Coding Guidelines

### TypeScript

- Strict type safety is **enabled**—ensure there are no `any` types or implicit returns.
- Define explicit return types for all helper functions and hooks.
- Use `interface` for component props and state shapes, and `type` for union/intersection aliases.

### Import Order

- Use the `@/*` absolute path alias for imports inside `src/`.
- Group your imports logically:
  1. React and Next.js APIs
  2. External npm libraries
  3. Context hooks & utility functions
  4. Type declarations (`type-only` imports preferred)

```typescript
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types/youtube";
import { useCustomization } from "@/lib/hooks/useCustomization";
```

### CSS and Styling

- Use **Tailwind CSS v4** combined with custom design tokens from `globals.css`.
- Avoid hardcoded values (such as text colors or borders) in favor of semantic CSS variable tokens (e.g. `text-text-v2`, `bg-surface-muted`, `border-border`).

---

## 🚀 Submitting Changes

### Branch Naming Convention

- `feat/feature-name` — for introducing new features
- `fix/bug-name` — for fixing existing issues
- `docs/doc-name` — for updating documentation files
- `refactor/refactor-name` — for structural code improvements

### Commit Messages

Use conventional commit styling:
```text
type(scope): description

feat(chat): add support for Twitch 7TV animated emotes
fix(settings): align mobile layout input fields
docs(readme): add detailed environment setup instructions
```

### Pull Request Checklist

1. Create a branch from `main`.
2. Make your edits and run validation checks locally:
   ```bash
   bun run typecheck
   bun run lint
   ```
3. Test the features in your browser (and within OBS overlay mode if editing overlays).
4. Submit a clear Pull Request detailing what was changed and why.

---

## 📈 Testing

Testing infrastructure is configured using Bun. When adding tests, make sure to follow the format:

```bash
bun test                     # Run all test suites
bun test path/to/file.test.ts   # Run a single test file
bun test --watch             # Run tests in watch mode
```

---

## 💬 Questions & Support

- Open a [GitHub Issue](https://github.com/diluteoxygen/KappaChat/issues)
- Connect with [diluteoxygen on GitHub](https://github.com/diluteoxygen)

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
