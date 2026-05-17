# Contributing to yT3 Chat

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (required - used as the package manager)
- Node.js 18+ (for compatibility)
- Git

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/yt-chat-view.git
cd yt-chat-view

# Install dependencies
bun install

# Start the development server
bun run dev
```

## Project Structure

```
src/
  app/                    # Next.js App Router pages and layouts
    api/youtube/          # API routes for YouTube integration
    globals.css           # Global styles and design tokens
    layout.tsx            # Root layout with providers
    page.tsx              # Main page component
  components/             # React components
    stream/               # Streamer-mode (yt_chat) components
  lib/
    hooks/                # Custom React hooks
    cache.ts              # Server-side caching utilities
    demo-data.ts          # Demo chat messages
    motion.ts             # Framer Motion presets
    youtube.ts            # YouTube API utilities
  types/
    youtube.ts            # TypeScript type definitions
```

## Code Style

### TypeScript

- Strict mode is enabled - all code must pass strict TypeScript checks
- Use explicit return types for exported functions
- Define interfaces for component props and API responses
- Use `type` for unions/aliases, `interface` for object shapes

### Imports

- Use path alias `@/*` for imports from `src/` directory
- Group imports: React/Next.js first, then external libs, then internal modules

```typescript
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types/youtube";
import { useCustomization } from "@/lib/hooks/useCustomization";
```

### Components

- All client components must have `"use client"` directive
- Use named exports for components
- Define props interfaces with descriptive names

```typescript
"use client";

import { useState } from "react";

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  // ...
}
```

### Styling

- Use Tailwind CSS utility classes
- Use CSS custom properties for theming (defined in `globals.css`)
- Prefer semantic color tokens: `text-text-v2`, `bg-surface-muted`, etc.

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Commit Messages

Use conventional commits format:

```
type(scope): description

feat(chat): add super chat highlighting
fix(ui): correct spacing on mobile devices
docs(readme): update installation instructions
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run type checking and linting:
   ```bash
   bun run typecheck
   bun run lint
   ```
4. Test your changes locally
5. Submit a pull request with a clear description

## Testing

Currently, the project has testing infrastructure but no tests. When adding tests:

```bash
bun test                     # Run all tests
bun test path/to/file.test.ts   # Run single test file
bun test --watch             # Watch mode
```

Test files should use `*.test.ts` or `*.test.tsx` extension.

## Reporting Issues

When reporting bugs:

1. Check existing issues first
2. Include browser/environment details
3. Provide steps to reproduce
4. Include screenshots if relevant

## Feature Requests

1. Check existing issues and discussions
2. Describe the use case clearly
3. Explain why this feature would be valuable

## Questions?

- Open a [GitHub Issue](https://github.com/pc-style/yt-chat-view/issues)
- Reach out on X: [@pcstyle53](https://x.com/pcstyle53)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
