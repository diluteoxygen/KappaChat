# HANDOFF: Integrate YouTube.js (InnerTube) + Fix UI Issues

## What This Project Is

**yT3 Chat** - A customizable YouTube Live Chat viewer with two UI modes:
- **yT3 Chat**: Full-featured dashboard with sidebar customization
- **yt_chat**: Minimal streamer-mode for OBS overlays

**Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Upstash Redis

## What Was Done This Session

### Security & Architecture Fixes (already committed)
1. **Cache bypass fix**: Moved channel verification out of `getOrFetch` callback in `connect/route.ts` so verification always runs for server-key requests regardless of cache status
2. **Serverless rate limiting**: Rewrote `rate-limit.ts` with Redis-backed rate limiting and quota tracking (INCR+EXPIRE), with in-memory fallback
3. **Shared Redis client**: Extracted to `src/lib/redis.ts`, used by both `cache.ts` and `rate-limit.ts`
4. Removed broken `setInterval` cleanup (incompatible with Vercel serverless)

### Key Decision: YouTube.js (InnerTube) Integration
The YouTube Data API v3 has a hard 10,000 units/day quota. `liveChatMessages.list` costs 5 units per call. At 1 call/5s, you burn through quota in ~2 hours. BYOK (Bring Your Own Key) is terrible UX for 99% of users (requires GCP project + billing + API key).

**Solution**: Use `youtubei.js` (npm: `youtubei.js`, 4.8k stars, MIT, actively maintained) which wraps YouTube's InnerTube API. No API key needed, no quota limits, works for any channel.

**Architecture**:
- InnerTube via `youtubei.js` as the PRIMARY chat source (zero quota, any channel)
- Keep official YouTube Data API v3 as a FALLBACK if InnerTube breaks
- Drop the 100K subscriber channel verification requirement entirely
- The channel verification (`channel-verify.ts`) becomes unnecessary for InnerTube mode

## Task 1: Integrate YouTube.js (InnerTube)

### Research First (IMPORTANT)
Before implementing, the user wants you to:
1. **Use the Librarian** to check how `youtubei.js` handles live chat (look at `github.com/LuanRT/YouTube.js`)
2. **Use Context7** to verify API usage patterns for the `youtubei.js` package
3. **Use the Oracle** to plan the integration architecture

### Implementation Plan
1. **Install**: `bun add youtubei.js@latest`
2. **Create `src/lib/innertube.ts`**: InnerTube chat provider
   - Initialize `Innertube` instance (lazy, singleton)
   - Function to get live chat from a video ID or URL
   - Transform InnerTube chat messages to the existing `ChatMessage` type (see `src/types/youtube.ts`)
   - The `ChatMessage` interface has: `id`, `authorName`, `authorAvatarUrl`, `authorChannelId`, `message`, `timestamp`, `badges`, `isSuperChat`, `superChatAmount`, `superChatColor`, `messageType`
3. **Create new API route or modify existing**: The InnerTube approach can work server-side. Options:
   - SSE endpoint (`/api/youtube/stream`) that uses InnerTube's event-based chat and pushes messages to the client
   - Or keep the polling pattern but use InnerTube instead of the official API
4. **Update `useChat.ts`**: Support InnerTube as the primary source
   - Try InnerTube first
   - Fall back to official API (existing `/api/youtube/connect` + `/api/youtube/messages`) if InnerTube fails
   - Remove channel verification requirement when using InnerTube
5. **Update connect route**: When InnerTube is active, skip quota checks and channel verification

### Key YouTube.js Patterns (from research)
```typescript
import { Innertube } from 'youtubei.js';
const innertube = await Innertube.create();
const video = await innertube.getDetails('VIDEO_ID');
const livechat = video.getLivechat();

livechat.on('chat-update', (message) => {
  console.log(`${message.author.name}: ${message.text}`);
});

livechat.stop();
```

### Constraints
- InnerTube runs server-side only (Node.js) - cannot run in browser
- The `Innertube.create()` call should be done once and reused
- YouTube.js live chat is event-based, not polling-based
- Transform messages to match the existing `ChatMessage` type for zero UI changes

## Task 2: Fix UI Issues

### Known Build Errors (pre-existing)
- `StreamPage.tsx:371` - `LayoutGroup` is not defined (missing import from framer-motion)
- `StreamPage.tsx:378` - `index` prop passed to `StreamChatMessage` but not in its interface
- `DemoControls.tsx:125` - unused expression warning

### Other UI Issues to Investigate
The user mentioned "a lot of weird small issues or unfinished features". After fixing the build errors above, do a thorough review of the UI components for:
- Incomplete features or TODO comments
- Broken styling or layout issues
- Missing error states or loading states
- Inconsistencies between the two UI modes (yT3 Chat vs yt_chat)

## Files to Load

### Core files to edit
- `src/lib/hooks/useChat.ts` - Main chat hook, needs InnerTube integration
- `src/app/api/youtube/connect/route.ts` - Connection API route
- `src/app/api/youtube/messages/route.ts` - Messages API route
- `src/types/youtube.ts` - Type definitions (may need updates for InnerTube data)
- `src/lib/youtube.ts` - YouTube utility functions (extractVideoId reused)

### New files to create
- `src/lib/innertube.ts` - InnerTube chat provider

### UI files to fix
- `src/components/stream/StreamPage.tsx` - Build errors (LayoutGroup, index prop)
- `src/components/stream/StreamChatMessage.tsx` - Remove index prop if unused
- `src/components/DemoControls.tsx` - Lint warning

### Reference/context files
- `src/app/page.tsx` - Main page, shows how both UI modes work
- `src/lib/cache.ts` - Caching layer (may need updates for InnerTube)
- `src/lib/rate-limit.ts` - Rate limiting (skip for InnerTube mode)
- `src/lib/redis.ts` - Shared Redis client
- `src/lib/channel-verify.ts` - Channel verification (skip for InnerTube)
- `src/app/globals.css` - Design tokens and theme
- `src/app/layout.tsx` - Root layout with providers
- `src/lib/hooks/useCustomization.tsx` - Customization context
- `src/lib/hooks/useDemoChat.ts` - Demo mode (reference for chat hook patterns)
- `package.json` - Dependencies
- `AGENTS.md` - Project conventions

## Technical Notes

- **Package manager**: Always use `bun` (not npm/yarn/pnpm)
- **No dev server**: Don't start dev server unless explicitly asked
- **Deployment**: Vercel (serverless functions, edge considerations)
- **After changes**: Run `tb__tsc-lint-build` to verify, then use `git-commit` skill
- **Pre-existing TS errors**: `StreamPage.tsx` has build errors from before this session - fix them
- The `consumeQuota` and `checkRateLimit` functions are now async (changed this session)
- Redis is optional - everything has in-memory fallbacks
