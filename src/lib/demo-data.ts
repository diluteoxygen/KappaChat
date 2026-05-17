/**
 * Pre-recorded demo chat data for zero-API-cost demonstrations
 * Simulates a realistic high-density stream chat (Twitch / YouTube style)
 * Rich in xQc and Forsen chat memes, bits, subs, and custom emotes.
 */

import type { ChatMessage, BadgeType, MessagePart } from "@/types/youtube";

interface DemoMessage {
  authorName: string;
  message: string;
  badges: BadgeType[];
  isSuperChat?: boolean;
  superChatAmount?: string;
  superChatColor?: string;
  delay: number; // ms from start
}

const DEMO_AVATARS = [
  "https://yt3.ggpht.com/ytc/AIdro_nM8X9q6ZKQH9LNPXwS8Gy_dFfGnPaFZm1UfnVe=s88-c-k-c0x00ffffff-no-rj",
  "https://yt3.ggpht.com/ytc/AIdro_kVNiXHQO9aSd8KjJ3x1TAVbvJwpBDIHXGgAPZM=s88-c-k-c0x00ffffff-no-rj",
  "https://yt3.ggpht.com/ytc/AIdro_n8X2-kPQxHp7DH45GNYdGGJz3PNJJfQqRQYsyL=s88-c-k-c0x00ffffff-no-rj",
  "https://static-cdn.jtvnw.net/user-default-pictures-uv/cddc22c1-befa-4779-875d-35b78b2b110f-profile_image-70x70.png",
  "https://static-cdn.jtvnw.net/user-default-pictures-uv/13eadeee-a620-47d9-93e5-dca82de09a15-profile_image-70x70.png",
];

// Direct 7TV v3 Global Emotes that do NOT redirect and return 200 OK directly.
const EMOTE_MAP: Record<string, string> = {
  // Direct, working 7TV v3 global emotes
  "EZ": "https://cdn.7tv.app/emote/01GB4CK01800090V9B3D8CGEEX/2x.webp",
  "Clap": "https://cdn.7tv.app/emote/01GAM8EFQ00004MXFXAJYKA859/2x.webp",
  "AYAYA": "https://cdn.7tv.app/emote/01GB32XE6R00018VJGJ4A9BNCV/2x.webp",
  "PepePls": "https://cdn.7tv.app/emote/01GAFTZ9K80003DHH026MC7JW0/2x.webp",
  "peepoHappy": "https://cdn.7tv.app/emote/01GAZ199Z8000FEWHS6AT5QZV0/2x.webp",
  "peepoSad": "https://cdn.7tv.app/emote/01GAZ4SBX80007YCE2RXBT44B2/2x.webp",
  "FeelsDankMan": "https://cdn.7tv.app/emote/01GB9W8JN80004CKF2H1TWA99H/2x.webp",
  "forsenPls": "https://cdn.7tv.app/emote/01GB8EQNJ8000497KFBZWNSDFZ/2x.webp",
  "gachiBASS": "https://cdn.7tv.app/emote/01GB4P2HX0000BJ5HR8F6XV9Q0/2x.webp",
  "PartyParrot": "https://cdn.7tv.app/emote/01FKSDK14G0008TM5NY9QEG0QV/2x.webp",
  "WAYTOODANK": "https://cdn.7tv.app/emote/01G98W833R0000BRQD106P0ZNT/2x.webp",
  "AlienDance": "https://cdn.7tv.app/emote/01GB2ZJFBG000DTBJYANG8XYFP/2x.webp",
  "ApuApustaja": "https://cdn.7tv.app/emote/01GGCQPCGR000C7MT8JZGP6E89/2x.webp",
  "BasedGod": "https://cdn.7tv.app/emote/01GB9W2CDG000BFSD141G0MGSA/2x.webp",
  "peepoPls": "https://cdn.7tv.app/emote/01HM524VE80004SKSHMCZWXH1T/2x.webp",
  "TeaTime": "https://cdn.7tv.app/emote/01HM4P26CR000449DZBT4FVMA5/2x.webp",
  "WineTime": "https://cdn.7tv.app/emote/01HM4PGHC80007635TAZG67FT5/2x.webp",
  "BibleThump": "https://cdn.7tv.app/emote/01J8NMZ2HG0005G1FWF2H9Y615/2x.webp",
  "Stare": "https://cdn.7tv.app/emote/01GG3YGWK8000DWE419062SG28/2x.webp",
  "gachiGASM": "https://cdn.7tv.app/emote/01F9EM2ETG000E7SC8F953GXCX/2x.webp",
  "RareParrot": "https://cdn.7tv.app/emote/01GB4XE3ZR000DKFRGM9Q1M7VS/2x.webp",
  "FeelsWeirdMan": "https://cdn.7tv.app/emote/01GB4FWTR8000DGEZ8VYY59RBN/2x.webp",
  "FeelsOkayMan": "https://cdn.7tv.app/emote/01GB46137R000BJ5HR8F6XV8J1/2x.webp",
  "FeelsStrongMan": "https://cdn.7tv.app/emote/01GB4EV0Q800090V9B3D8CGEHV/2x.webp",
  "sadAstha": "https://cdn.betterttv.net/emote/5ffd1599eb9c37314d220c09/3x.webp",

  // Aliases mapping old keywords to verified v3 global URLs
  "KEKW": "https://cdn.7tv.app/emote/01GB4CK01800090V9B3D8CGEEX/2x.webp", // EZ
  "LULW": "https://cdn.7tv.app/emote/01GB4EV0Q800090V9B3D8CGEHV/2x.webp", // FeelsStrongMan
  "Pog": "https://cdn.7tv.app/emote/01GAZ199Z8000FEWHS6AT5QZV0/2x.webp", // peepoHappy
  "POGGERS": "https://cdn.7tv.app/emote/01GAZ199Z8000FEWHS6AT5QZV0/2x.webp",
  "pepega": "https://cdn.7tv.app/emote/01GB9W8JN80004CKF2H1TWA99H/2x.webp", // FeelsDankMan
  "Pepega": "https://cdn.7tv.app/emote/01GB9W8JN80004CKF2H1TWA99H/2x.webp",
  "monkaS": "https://cdn.7tv.app/emote/01GAZ4SBX80007YCE2RXBT44B2/2x.webp", // peepoSad
  "xqcL": "https://cdn.7tv.app/emote/01GAZ199Z8000FEWHS6AT5QZV0/2x.webp", // peepoHappy
  "GigaChad": "https://cdn.7tv.app/emote/01GB9W2CDG000BFSD141G0MGSA/2x.webp", // BasedGod
  "Clueless": "https://cdn.7tv.app/emote/01GG3YGWK8000DWE419062SG28/2x.webp", // Stare
  "OMEGALUL": "https://cdn.7tv.app/emote/01G98W833R0000BRQD106P0ZNT/2x.webp", // WAYTOODANK
  "Copium": "https://cdn.7tv.app/emote/01GB9W8JN80004CKF2H1TWA99H/2x.webp", // FeelsDankMan
  "Prayge": "https://cdn.7tv.app/emote/01GAZ4SBX80007YCE2RXBT44B2/2x.webp", // peepoSad
  "Sadge": "https://cdn.7tv.app/emote/01GAZ4SBX80007YCE2RXBT44B2/2x.webp", // peepoSad
  "catJAM": "https://cdn.7tv.app/emote/01FKSDK14G0008TM5NY9QEG0QV/2x.webp", // PartyParrot
  "PagMan": "https://cdn.7tv.app/emote/01F6N0NRYR000AR0YATR3Q3CPR/2x.webp", // peepoHappy
};

function parseMessageParts(text: string): MessagePart[] {
  const words = text.split(" ");
  const parts: MessagePart[] = [];
  let currentText = "";

  for (const word of words) {
    if (EMOTE_MAP[word]) {
      // Flush previous text
      if (currentText) {
        parts.push({ type: "text", value: currentText.trimEnd() });
        currentText = "";
      }
      // Add space separator if needed
      if (parts.length > 0 && parts[parts.length - 1].type !== 'text') {
        parts.push({ type: "text", value: " " });
      }
      parts.push({
        type: "emoji",
        value: word,
        emojiData: {
          name: word,
          imageUrl: EMOTE_MAP[word]
        }
      });
      // Add a trailing space to prepare for the next word
      currentText = " ";
    } else {
      currentText += (currentText ? " " : "") + word;
    }
  }

  if (currentText && currentText.trim()) {
    parts.push({ type: "text", value: currentText });
  }

  return parts;
}

const DEMO_MESSAGES: DemoMessage[] = [
  { authorName: "juicer_2004", message: "JUICERS RISE UP peepoHappy", badges: ["subscriber"], delay: 0 },
  { authorName: "baj_forsen", message: "forsen Pls forsenPls", badges: [], delay: 200 },
  { authorName: "Stare_Andy", message: "surely he will beat the record today Stare", badges: [], delay: 500 },
  { authorName: "ModMike", message: "Chat is wild today, keep it clean boys", badges: ["moderator"], delay: 800 },
  { authorName: "copium_dealer", message: "FeelsDankMan he's not bad, it was just a lag spike", badges: ["member"], delay: 1100 },
  { authorName: "Warlord1", message: "WAYTOODANK SO BAD WAYTOODANK", badges: ["vip"], delay: 1400 },
  { authorName: "streamer_simp", message: "check behind you peepoSad", badges: [], isSuperChat: true, superChatAmount: "100 BITS", superChatColor: "#9146ff", delay: 1700 },
  { authorName: "cat_jammer", message: "PartyParrot PartyParrot PartyParrot", badges: [], delay: 2000 },
  { authorName: "Based_viewer", message: "PagMan LIVE PagMan LIVE PagMan LIVE PagMan LIVE PagMan LIVE PagMan LIVE ", badges: ["member"], delay: 2300 },
  { authorName: "donator_prime", message: "PLAY CS2 WITH CRACKSHOT sadAstha", badges: ["vip", "member"], isSuperChat: true, superChatAmount: "$10.00", superChatColor: "#eab308", delay: 2700 },
  { authorName: "ReactLegend", message: "ReactGod joined the channel membership!", badges: [], isSuperChat: true, superChatAmount: "NEW MEMBER", superChatColor: "#10b981", delay: 3200 },
  { authorName: "xQc_Enjoyer", message: "peepoHappy peepoHappy peepoHappy", badges: ["subscriber"], delay: 3600 },
  { authorName: "speedrunner_pro", message: "peepoSad sub 15 run is today peepoSad", badges: [], delay: 4000 },
  { authorName: "FeelsStrongMan_spammer", message: "FeelsStrongMan HE THREW IT FeelsStrongMan", badges: [], delay: 4300 },
  { authorName: "forsen_clone_4", message: "forsen Pls forsenPls", badges: [], delay: 4600 },
  { authorName: "FeelsDankMan_coder", message: "FeelsDankMan coding in javascript FeelsDankMan", badges: ["member"], delay: 5000 },
  { authorName: "viewer_392", message: "is he live? EZ", badges: [], delay: 5300 },
  { authorName: "sub_gifter", message: "gifted 5 tier 1 subs to the community!", badges: [], isSuperChat: true, superChatAmount: "5 GIFTED SUBS", superChatColor: "#ff4b4b", delay: 5700 },
  { authorName: "copius_maximus", message: "he is definitely not throwing FeelsDankMan", badges: [], delay: 6100 },
  { authorName: "EZ_gamer", message: "EZ Clap EZ game", badges: ["vip"], delay: 6500 },
  { authorName: "xqc_fan", message: "JUICE IS DRIPPING peepoHappy", badges: ["subscriber"], delay: 6900 },
  { authorName: "Sadge_guy", message: "another run lost peepoSad", badges: [], delay: 7200 },
  { authorName: "ElundusCore", message: "peepoSad THE ELUNDUS CORE IS IMPLODING peepoSad", badges: [], delay: 7600 },
  { authorName: "ModMike", message: "please do not spam the elundus core message", badges: ["moderator"], delay: 8100 },
  { authorName: "Warlord1", message: "WAYTOODANK MY STREAMER WAYTOODANK", badges: ["vip"], delay: 8400 },
  { authorName: "bit_whale", message: "best stream on twitch peepoHappy", badges: [], isSuperChat: true, superChatAmount: "1000 BITS", superChatColor: "#9146ff", delay: 8800 },
  { authorName: "Stare_Andy", message: "Stare surely he has a plan", badges: [], delay: 9200 },
  { authorName: "forsen_boy", message: "forsen Pls", badges: [], delay: 9500 },
  { authorName: "speedrunner_pro", message: "that segment was so clean EZ", badges: [], delay: 9800 },
  { authorName: "ReactLegend", message: "TypeScript is actually amazing based BasedGod", badges: ["member"], delay: 10200 },
  { authorName: "super_fan", message: "ReactGod joined as Tier 2 Member!", badges: [], isSuperChat: true, superChatAmount: "MEMBER MILESTONE", superChatColor: "#10b981", delay: 10700 },
  { authorName: "viewer_99", message: "wait what? EZ", badges: [], delay: 11100 },
  { authorName: "FeelsDankMan_coder", message: "FeelsDankMan React 19 is cracked FeelsDankMan", badges: ["member"], delay: 11500 },
  { authorName: "xQc_Enjoyer", message: "peepoHappy peepoHappy peepoHappy", badges: ["subscriber"], delay: 11900 },
  { authorName: "donator_rich", message: "LOVE THE DASHBOARD LAYOUT! GOAT", badges: [], isSuperChat: true, superChatAmount: "$50.00", superChatColor: "#e91e63", delay: 12400 },
  { authorName: "baj_forsen", message: "forsen Pls", badges: [], delay: 12800 },
  { authorName: "Warlord1", message: "WAYTOODANK WAYTOODANK WAYTOODANK", badges: ["vip"], delay: 13100 },
  { authorName: "cat_jammer", message: "PartyParrot PartyParrot PartyParrot", badges: [], delay: 13400 },
  { authorName: "Based_viewer", message: "BasedGod absolute legend BasedGod", badges: ["member"], delay: 13700 },
  { authorName: "Stare_Andy", message: "what is the record? Stare", badges: [], delay: 14100 },
  { authorName: "copium_dealer", message: "FeelsDankMan next run is the one", badges: ["member"], delay: 14400 },
  { authorName: "speedrunner_pro", message: "peepoSad peepoSad peepoSad", badges: [], delay: 14700 },
  { authorName: "bit_whale", message: "keep up the grind!", badges: [], isSuperChat: true, superChatAmount: "500 BITS", superChatColor: "#9146ff", delay: 15100 },
  { authorName: "xqc_fan", message: "LET'S GO peepoHappy", badges: ["subscriber"], delay: 15500 },
  { authorName: "FeelsStrongMan_spammer", message: "FeelsStrongMan NO WAY FeelsStrongMan", badges: [], delay: 15800 },
  { authorName: "FeelsDankMan_coder", message: "FeelsDankMan bun is so fast FeelsDankMan", badges: ["member"], delay: 16200 },
  { authorName: "Sadge_guy", message: "peepoSad why are we here peepoSad", badges: [], delay: 16500 },
  { authorName: "sub_gifter", message: "gifted 1 sub to Warlord1!", badges: [], isSuperChat: true, superChatAmount: "GIFTED SUB", superChatColor: "#ff4b4b", delay: 16900 },
  { authorName: "EZ_gamer", message: "EZ game is too easy EZ", badges: ["vip"], delay: 17300 },
  { authorName: "forsen_clone_4", message: "forsen Pls forsenPls", badges: [], delay: 17600 },
  { authorName: "ReactLegend", message: "Jame Time Jame Time Jame Time", badges: ["member"], delay: 18000 },
  { authorName: "donator_prime", message: "CAN WE GET 100 CONCURRENT VIEWERS? EZ", badges: [], isSuperChat: true, superChatAmount: "$5.00", superChatColor: "#1565c0", delay: 18500 },
  { authorName: "ElundusCore", message: "peepoSad IT IS IMPLODING peepoSad", badges: [], delay: 18900 },
  { authorName: "cat_jammer", message: "PartyParrot PartyParrot PartyParrot", badges: [], delay: 19200 },
  { authorName: "Warlord1", message: "WAYTOODANK SO BAD WAYTOODANK", badges: ["vip"], delay: 19500 },
  { authorName: "xQc_Enjoyer", message: "peepoHappy peepoHappy peepoHappy", badges: ["subscriber"], delay: 19800 },
  { authorName: "copium_dealer", message: "FeelsDankMan surely he will not throw this one", badges: ["member"], delay: 20200 },
  { authorName: "Stare_Andy", message: "is he winning? Stare", badges: [], delay: 20500 },
  { authorName: "speedrunner_pro", message: "peepoSad peepoSad peepoSad", badges: [], delay: 20800 },
  { authorName: "ReactLegend", message: "Next.js 16 App Router is super clean BasedGod", badges: ["member"], delay: 21200 },
  { authorName: "super_fan", message: "ReactGod joined as Tier 3 Member!", badges: [], isSuperChat: true, superChatAmount: "NEW MEMBER", superChatColor: "#10b981", delay: 21700 },
  { authorName: "baj_forsen", message: "forsen Pls", badges: [], delay: 22100 },
  { authorName: "Warlord1", message: "WAYTOODANK WAYTOODANK WAYTOODANK", badges: ["vip"], delay: 22400 },
  { authorName: "FeelsDankMan_coder", message: "FeelsDankMan -m0nesy +molodoy FeelsDankMan", badges: ["member"], delay: 22800 },
  { authorName: "Sadge_guy", message: "peepoSad we are lost peepoSad", badges: [], delay: 23100 },
  { authorName: "xqc_fan", message: "peepoHappy peepoHappy peepoHappy", badges: ["subscriber"], delay: 23400 },
  { authorName: "bit_whale", message: "let's go warlord!", badges: [], isSuperChat: true, superChatAmount: "200 BITS", superChatColor: "#9146ff", delay: 23800 },
  { authorName: "cat_jammer", message: "PartyParrot PartyParrot PartyParrot", badges: [], delay: 24200 },
  { authorName: "EZ_gamer", message: "EZ Clap EZ life", badges: ["vip"], delay: 24500 },
  { authorName: "forsen_clone_4", message: "forsen Pls forsenPls", badges: [], delay: 24800 },
  { authorName: "donator_rich", message: "BEST OVERLAY IN THE WORLD peepoHappy", badges: [], isSuperChat: true, superChatAmount: "$20.00", superChatColor: "#e91e63", delay: 25300 },
  { authorName: "Stare_Andy", message: "what is going on? Stare", badges: [], delay: 25700 },
  { authorName: "copium_dealer", message: "FeelsDankMan he is just warming up guys", badges: ["member"], delay: 26000 },
  { authorName: "speedrunner_pro", message: "peepoSad peepoSad peepoSad", badges: [], delay: 26300 },
  { authorName: "ReactLegend", message: "BasedGod BasedGod BasedGod", badges: ["member"], delay: 26700 },
  { authorName: "Warlord1", message: "WAYTOODANK MY STREAMER EZ", badges: ["vip"], delay: 27100 },
  { authorName: "xQc_Enjoyer", message: "peepoHappy peepoHappy peepoHappy", badges: ["subscriber"], delay: 27500 },
  { authorName: "ElundusCore", message: "peepoSad THE CORE HAS IMPLODED peepoSad", badges: [], delay: 27900 },
  { authorName: "ModMike", message: "good game chat, see you in the next one", badges: ["moderator"], delay: 28400 },
  { authorName: "cat_jammer", message: "PartyParrot PartyParrot PartyParrot", badges: [], delay: 28800 }
];

export function getDemoMessages(): ChatMessage[] {
  return DEMO_MESSAGES.map((msg, i) => toChatMessage(msg, i));
}

export function getDemoMessagesWithDelays(): Array<{ message: ChatMessage; delay: number }> {
  return DEMO_MESSAGES.map((msg, i) => ({
    message: toChatMessage(msg, i),
    delay: msg.delay,
  }));
}

function generateId(index: number): string {
  return `demo-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateChannelId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `UC${Math.abs(hash).toString(36).slice(0, 22).padEnd(22, "0")}`;
}

function getAvatarUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEMO_AVATARS[Math.abs(hash) % DEMO_AVATARS.length];
}

function toChatMessage(msg: DemoMessage, index: number): ChatMessage {
  const messageParts = parseMessageParts(msg.message);
  return {
    id: generateId(index),
    source: "demo",
    authorName: msg.authorName,
    authorAvatarUrl: getAvatarUrl(msg.authorName),
    authorChannelId: generateChannelId(msg.authorName),
    message: msg.message,
    messageParts: messageParts,
    timestamp: new Date(),
    badges: msg.badges,
    isSuperChat: msg.isSuperChat || false,
    superChatAmount: msg.superChatAmount,
    superChatColor: msg.superChatColor,
    messageType: msg.isSuperChat ? "superChatEvent" : "textMessageEvent",
  };
}

export const DEMO_STREAM_INFO = {
  videoId: "demo-video-id",
  channelId: "UCbRP3c757lWg9M-U7TyEkXA",
  channelTitle: "Kappa Live",
  title: "[DEMO] xQc & Forsen Chat Battle - Speedrun Record Attempts",
  thumbnailUrl: "https://i.ytimg.com/vi/demo/hqdefault.jpg",
  concurrentViewers: "84,921",
  actualStartTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
};

export const DEMO_DURATION_MS = DEMO_MESSAGES[DEMO_MESSAGES.length - 1].delay + 2000;
