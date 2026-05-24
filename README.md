<div align="center">
  <img src="https://raw.githubusercontent.com/diluteoxygen/KappaChat/main/public/kappachat-banner.svg" alt="KappaChat Banner" width="100%"/>
</div>

<br/>

# <a href="#"><img src="https://raw.githubusercontent.com/diluteoxygen/KappaChat/refs/heads/main/public/kappa.png" width="48" alt="Kappa"/></a> KappaChat [![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/diluteoxygen/KappaChat) [![License](https://img.shields.io/badge/license-GPL--3.0-green.svg)](https://github.com/diluteoxygen/KappaChat/blob/main/LICENSE) [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)](https://nextjs.org) [![React](https://img.shields.io/badge/React-19-06B6D4?logo=react&logoColor=white)](https://react.dev) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**KappaChat** is an overlay that allows you to show your unified Twitch and YouTube chat on screen with OBS, XSplit, and any streaming software that supports browser sources. It integrates Twitch, **BetterTTV**, **FrankerFaceZ**, and **7TV** emotes, always at the best available quality. You have extensive options to customize your chat aesthetics, including theme selection, typography, and density, as well as enabling smooth animations for new messages. Additionally, KappaChat bypasses standard YouTube API quota restrictions by utilizing an InnerTube client.

## Features

- Unified multi-stream chat for YouTube Live and Twitch
- 7TV, BetterTTV, and FrankerFaceZ emotes support
- Twitch and YouTube channel custom badges
- Wide variety of fonts and styling presets (Dark, Light, OLED, Creamy)
- Layout density toggles
- Smooth entry animations (on/off)
- Bypasses YouTube quota limits (InnerTube wrapper)
- Dedicated minimal overlay mode for OBS and Streamlabs
- Interactive demo mode to simulate high volume chat locally

## Getting Started

### Prerequisites

- Bun package manager
- Node.js 18 or above

### Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/diluteoxygen/KappaChat.git
cd KappaChat

bun install
```

Start the application:

```bash
bun run dev
```

You can access the main configuration portal at `http://localhost:3000` and use the minimal streaming viewer at `http://localhost:3000/overlay`.

## Environment Variables

For fallback availability on YouTube API or extended Twitch integration features, you will need to map these credentials. Create a `.env.local` inside the root directory:

```env
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
YOUTUBE_DATA_API_KEY=your_youtube_data_api_key
```

## Contributing

We welcome updates and bug reports. Please consult our [CONTRIBUTING.md](CONTRIBUTING.md) to review information thoroughly before submitting patches or pull requests. KappaChat requires strict TypeScript configurations and employs ESLint rules for maintaining high performance and code quality standards.

## License

This project is licensed under the GNU General Public License version 3 (GPL-3.0). See the LICENSE file for detailed redistribution terms.

## Commit History

[![KappaChat Commit Activity](https://github-readme-activity-graph.vercel.app/graph?username=diluteoxygen&repo=KappaChat&theme=github-compact&custom_title=KappaChat%20History)](https://github.com/diluteoxygen/KappaChat/graphs/commit-activity)
