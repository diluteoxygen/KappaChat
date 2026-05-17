# yT3 Chat

A customizable YouTube Live Chat viewer built with Next.js. Two UI modes: full-featured dashboard (yT3 Chat) and minimal streamer-mode (yt_chat) for OBS overlays.

## Features

- **Two UI Modes**: Choose between minimal OBS-ready overlay or full-featured dashboard
- **Real-time Chat**: Connect to any YouTube Live stream
- **Demo Mode**: Try it out without using API quota
- **Customizable**: Themes, colors, font sizes, layouts, and more
- **BYOK (Bring Your Own Key)**: Use your own YouTube API key for unrestricted access
- **Responsive**: Works on desktop and mobile
- **Virtualized**: Handles high-volume chats efficiently

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- YouTube Data API v3 key (optional - default restricted to @t3dotgg)

### Installation

```bash
# Clone the repository
git clone https://github.com/pc-style/yt-chat-view.git
cd yt-chat-view

# Install dependencies
bun install

# Start the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Required for unrestricted channel access
YOUTUBE_API_KEY=your_youtube_api_key

# Optional: Redis caching (Upstash)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Usage

### Connecting to a Stream

1. Open the app and choose your preferred UI mode
2. Paste a YouTube Live URL in the input field
3. Click Connect to start viewing chat

Supported URL formats:
- `https://youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/live/VIDEO_ID`

### Demo Mode

Click "Try Demo Mode" to see the chat in action without using any API quota. Great for testing customization options.

### BYOK Mode

Without an API key, the app is restricted to @t3dotgg streams only. To connect to any channel:
1. Get a YouTube Data API v3 key from [Google Cloud Console](https://console.cloud.google.com/)
2. Add it in the Settings panel or set `YOUTUBE_API_KEY` environment variable

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual)

## Scripts

```bash
bun run dev        # Start development server
bun run build      # Build for production
bun run start      # Start production server
bun run lint       # Run ESLint
bun run typecheck  # Run TypeScript type checking
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## Links

- **Issues & Feature Requests**: [GitHub Issues](https://github.com/pc-style/yt-chat-view/issues)
- **Questions**: [@pcstyle53 on X](https://x.com/pcstyle53)

## License

MIT License - see [LICENSE](LICENSE) for details.
