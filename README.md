# 🐱 KappaChat

A highly customizable, high-performance unified stream chat viewer and overlay built with **Next.js 16**, **React 19**, and **Tailwind CSS v4**.

KappaChat lets you aggregate and view live chats from **YouTube Live** and **Twitch** concurrently in a single, beautiful unified feed. It is designed both as a streamer's real-time chat dashboard and as a sleek, custom browser source for OBS/Streamlabs overlays.

---

## ⚡ Features

- **Unified Multi-Stream Chat**: Connect a YouTube Live stream and a Twitch channel concurrently into one unified real-time chat feed.
- **Ultra-Customizable Aesthetics**: A floating settings panel gives you live control over:
  - **Themes**: Sleek presets including `Dark`, `Light`, `OLED`, `Creamy`, and custom colors.
  - **Typography**: Change font families (Geist, Inter, System, Mono) and scale sizes (12px to 22px) on the fly.
  - **Layout Density**: Choose between `Comfy` and `Compact` formats.
  - **Display Toggles**: Show or hide user avatars, message timestamps, platform/subscriber badges, and entry animations.
- **OBS Overlay Mode**: A dedicated, minimal `/overlay` route designed perfectly for OBS studio browser sources. Copy your customizable overlay URL with one click.
- **Zero-Quota YouTube Chat (InnerTube)**: Integrates YouTube.js (InnerTube wrapper) to fetch YouTube chat messages, completely bypassing Google's strict 10k daily API key quota limits. No GCP setup or BYOK required!
- **Rich Emote Rendering**: Out-of-the-box support for Twitch emotes and **7TV** (including static and animated emotes).
- **Smooth Spring Animations**: Powered by **Framer Motion** spring physics for beautiful, organic message-feed transitions.
- **Virtualization & Performance**: Handles high-volume, high-density chat rooms using virtualized lists to ensure 0% CPU lag during busy streams.
- **Interactive Demo Mode**: Simulate a busy chat feed offline to test, tweak, and perfect your theme configurations.

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (required package manager)
- Node.js 18+

### Installation & Run

1. **Clone the Repository**
   ```bash
   git clone https://github.com/diluteoxygen/KappaChat.git
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

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Environment Variables

Create a `.env.local` file in your root folder for advanced features (like caching and rate-limiting):

```bash
# Optional: YouTube Data API v3 key (for secondary fallback mode)
YOUTUBE_API_KEY=your_key

# Optional: Upstash Redis configuration (for distributed caching and serverless rate-limiting)
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

---

## 💻 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com)
- **YouTube API**: [YouTube.js (InnerTube)](https://github.com/LuanRT/YouTube.js)
- **Caching**: Upstash Redis

---

## 📦 Available Scripts

```bash
bun run dev        # Starts the development server at localhost:3000
bun run build      # Builds the production Next.js bundle
bun run start      # Starts the production server
bun run lint       # Runs ESLint checking
bun run typecheck  # Validates TypeScript types (tsc --noEmit)
```

---

## 🤝 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Please check our [Contributing Guide](CONTRIBUTING.md) for details on getting started.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
