<div align="center">
  <img src="https://raw.githubusercontent.com/diluteoxygen/KappaChat/main/public/kappachat-banner.svg" alt="KappaChat Banner" width="100%"/>
</div>
<br/>

# <a href="#"><img src="https://raw.githubusercontent.com/diluteoxygen/KappaChat/refs/heads/main/public/kappa.png" width="48" alt="Kappa"/></a> KappaChat

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/diluteoxygen/KappaChat) [![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](https://github.com/diluteoxygen/KappaChat/blob/main/LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-06B6D4?logo=react&logoColor=white)](https://react.dev) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

You're live on Twitch and YouTube at the same time. Now you've got two chats, two emote sets, two browser sources cluttering your OBS scene, and zero idea which window to actually read. The "professional" fix is running dual chat widgets side by side and pretending that's not insane.

`KappaChat` merges both into one overlay, renders every 7TV/BBTV/FFZ emote at full quality, and drops cleanly into any browser source. One feed. One sanity left intact.

## Before / after

You want a unified chat overlay for a multi-platform stream. The industry standard: two separate embeds, two sets of CSS fighting each other, an emote extension that only works on one of them, and a Discord thread titled "why is my chat ugly."

With `KappaChat`:

```bash
bun run dev
```

Open `localhost:3000/overlay`, drop it in OBS, done. Both chats, one overlay, emotes intact.

## Features

- Unified multi-stream chat for YouTube Live and Twitch - no more tab-switching to see who's talking
- 7TV, BetterTTV, and FrankerFaceZ emotes, rendered at the best quality available instead of whatever blurry fallback the platform serves
- Twitch and YouTube channel badges, because subs and mods deserve their flair
- Theme presets (Dark, Light, OLED, Creamy) and a full font lineup, for when "default sans-serif" just won't cut it
- Density toggles for when chat is either dead or absolutely sending it
- Smooth entry animations, toggleable for the purists who want messages to just *appear*
- A dedicated minimal overlay mode built specifically for OBS and Streamlabs browser sources
- An interactive demo mode that simulates a packed chat locally, so you can tune your theme before you're actually live

## Getting Started

### Prerequisites

- Bun package manager
- Node.js 18 or above

### Installation

Clone it, install it, run it. No Terraform required.

```bash
git clone https://github.com/diluteoxygen/KappaChat.git
cd KappaChat
bun install
```

```bash
bun run dev
```

- Config portal: `http://localhost:3000`
- Stream-ready overlay: `http://localhost:3000/overlay`

## Environment Variables

For extended Twitch features or a YouTube API fallback, hand over your credentials. Create a `.env.local` in the root:

```env
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
YOUTUBE_DATA_API_KEY=your_youtube_data_api_key
```

## FAQ

### Will this lag my stream?

It's a browser source rendering text and emotes, not a 4K render farm. Your encoder has bigger problems than KappaChat.

### Why not just use the native Twitch/YouTube chat widgets?

Because then you'd have two overlays, two themes, and twice the chance someone's chat box covers your facecam at the worst possible moment.

### Can I run this without Twitch or YouTube live?

Yes - flip on demo mode and it'll simulate a busy chat locally, so you can dial in your theme before you're actually on the clock.

### My emotes look wrong / missing.

Check that 7TV/BTTV/FFZ are actually enabled for the relevant channel on their respective platforms. KappaChat fetches what's available - it can't summon emotes that don't exist yet.

## Contributing

We welcome updates and bug reports. Please consult [CONTRIBUTING.md](CONTRIBUTING.md) before submitting patches or pull requests. KappaChat runs strict TypeScript and ESLint - keep it clean.

## License

[GPL-3.0](LICENSE)

## Commit History

[![KappaChat Commit Activity](https://github-readme-activity-graph.vercel.app/graph?username=diluteoxygen&repo=KappaChat&theme=github-compact&custom_title=KappaChat%20History)](https://github.com/diluteoxygen/KappaChat/graphs/commit-activity)
