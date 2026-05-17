/**
 * Pre-recorded demo chat data for zero-API-cost demonstrations
 * Simulates a realistic tech stream chat
 */

import type { ChatMessage, BadgeType } from "@/types/youtube";

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
];

const DEMO_MESSAGES: DemoMessage[] = [
  { authorName: "streamer", message: "welcome to the stream chat!", badges: ["owner"], delay: 0 },
  { authorName: "CodeNinja42", message: "first!", badges: [], delay: 200 },
  { authorName: "ReactAndy", message: "lets gooo", badges: ["member"], delay: 400 },
  { authorName: "TypeScriptTom", message: "typescript supremacy", badges: [], delay: 800 },
  { authorName: "ModMike", message: "Chat rules: be nice, no spam", badges: ["moderator"], delay: 1200 },
  { authorName: "NextJsFan", message: "is this about the new app router?", badges: [], delay: 1800 },
  { authorName: "ServerlessSam", message: "KEKW", badges: [], delay: 2100 },
  { authorName: "EdgeLord99", message: "vercel edge functions are cracked", badges: ["member"], delay: 2500 },
  { authorName: "TailwindTina", message: "css in js is dead confirmed", badges: [], delay: 3000 },
  { authorName: "streamer", message: "ok so today we're looking at this sick new feature", badges: ["owner"], delay: 3500 },
  { authorName: "PrismaPatrick", message: "drizzle gang rise up", badges: [], delay: 4000 },
  { authorName: "ZodZach", message: "based take", badges: [], delay: 4300 },
  { authorName: "SupabaseSteve", message: "postgres is the goat", badges: ["member"], delay: 4800 },
  { authorName: "RedisRick", message: "upstash redis is so good for caching", badges: [], delay: 5200 },
  { authorName: "ModMike", message: "facts ^", badges: ["moderator"], delay: 5500 },
  { authorName: "AIAnnie", message: "can you show the ai integration?", badges: [], delay: 6000 },
  { authorName: "LLMLouis", message: "claude > gpt", badges: [], delay: 6400 },
  { authorName: "VimVince", message: "btw i use neovim", badges: [], delay: 6800 },
  { authorName: "DockerDan", message: "just containerize it bro", badges: [], delay: 7200 },
  { authorName: "K8sKyle", message: "skill issue", badges: [], delay: 7600 },
  { authorName: "MonorepoMike", message: "turborepo is insane", badges: ["member"], delay: 8000 },
  { authorName: "BunBenny", message: "bun install go brrrrr", badges: [], delay: 8400 },
  { authorName: "streamer", message: "lmao chat is wild today", badges: ["owner"], delay: 8800 },
  { authorName: "StreamerSimp", message: "love your content!", badges: [], isSuperChat: true, superChatAmount: "$5.00", superChatColor: "#1565c0", delay: 9200 },
  { authorName: "TRPCTony", message: "end to end typesafety is chef's kiss", badges: [], delay: 9600 },
  { authorName: "GraphQLGrace", message: "REST is dead", badges: [], delay: 10000 },
  { authorName: "RESTRandy", message: "GraphQL is overkill for most apps", badges: [], delay: 10400 },
  { authorName: "ModMike", message: "both are valid choices tbh", badges: ["moderator"], delay: 10800 },
  { authorName: "HonoHank", message: "hono is so underrated", badges: [], delay: 11200 },
  { authorName: "ElysiaElla", message: "elysia + bun = 🔥", badges: ["member"], delay: 11600 },
  { authorName: "SvelteSteve", message: "svelte 5 runes are wild", badges: [], delay: 12000 },
  { authorName: "SolidSophie", message: "signals > hooks", badges: [], delay: 12400 },
  { authorName: "streamer", message: "ok ok let me actually show the code now", badges: ["owner"], delay: 12800 },
  { authorName: "JuniorJim", message: "wait how do you do that?", badges: [], delay: 13200 },
  { authorName: "SeniorSarah", message: "read the docs", badges: [], delay: 13600 },
  { authorName: "BootcampBob", message: "i just graduated from a bootcamp, this is so helpful", badges: [], delay: 14000 },
  { authorName: "self_taught_dev", message: "freecodecamp gang", badges: [], delay: 14400 },
  { authorName: "CSSChris", message: "container queries tho", badges: [], delay: 14800 },
  { authorName: "AnimationAlex", message: "framer motion > react spring", badges: ["member"], delay: 15200 },
  { authorName: "MotionMaven", message: "motion.dev is the new hotness", badges: [], delay: 15600 },
  { authorName: "BigDonor", message: "keep up the great work!", badges: [], isSuperChat: true, superChatAmount: "$50.00", superChatColor: "#e91e63", delay: 16000 },
  { authorName: "streamer", message: "omg thank you BigDonor! 🙏", badges: ["owner"], delay: 16400 },
  { authorName: "lurker_2049", message: "finally commenting after 2 years", badges: [], delay: 16800 },
  { authorName: "ModMike", message: "welcome! glad you're here", badges: ["moderator"], delay: 17200 },
  { authorName: "FunctionalFred", message: "monads are just monoids in the category of endofunctors", badges: [], delay: 17600 },
  { authorName: "PragmaticPaul", message: "just ship it", badges: [], delay: 18000 },
  { authorName: "StartupStacy", message: "mvp first, scale later", badges: ["member"], delay: 18400 },
  { authorName: "EnterprisEarl", message: "we need 47 microservices", badges: [], delay: 18800 },
  { authorName: "streamer", message: "lol enterprise devs are different", badges: ["owner"], delay: 19200 },
  { authorName: "AgileAndy", message: "we had a 3 hour standup today", badges: [], delay: 19600 },
  { authorName: "RemoteRita", message: "work from home is the way", badges: [], delay: 20000 },
];

/**
 * Generate a unique ID for demo messages
 */
function generateId(index: number): string {
  return `demo-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Generate a fake channel ID from username
 */
function generateChannelId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `UC${Math.abs(hash).toString(36).slice(0, 22).padEnd(22, "0")}`;
}

/**
 * Get a deterministic avatar URL based on username
 */
function getAvatarUrl(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return DEMO_AVATARS[Math.abs(hash) % DEMO_AVATARS.length];
}

/**
 * Convert demo message to full ChatMessage
 */
function toChatMessage(msg: DemoMessage, index: number): ChatMessage {
  return {
    id: generateId(index),
    authorName: msg.authorName,
    authorAvatarUrl: getAvatarUrl(msg.authorName),
    authorChannelId: generateChannelId(msg.authorName),
    message: msg.message,
    timestamp: new Date(),
    badges: msg.badges,
    isSuperChat: msg.isSuperChat || false,
    superChatAmount: msg.superChatAmount,
    superChatColor: msg.superChatColor,
    messageType: msg.isSuperChat ? "superChatEvent" : "textMessageEvent",
  };
}

/**
 * Get all demo messages as ChatMessage array
 */
export function getDemoMessages(): ChatMessage[] {
  return DEMO_MESSAGES.map((msg, i) => toChatMessage(msg, i));
}

/**
 * Get demo messages with their intended delays
 */
export function getDemoMessagesWithDelays(): Array<{ message: ChatMessage; delay: number }> {
  return DEMO_MESSAGES.map((msg, i) => ({
    message: toChatMessage(msg, i),
    delay: msg.delay,
  }));
}

/**
 * Demo stream info
 */
export const DEMO_STREAM_INFO = {
  videoId: "demo-video-id",
  channelId: "UCbRP3c757lWg9M-U7TyEkXA",
  channelTitle: "Live Stream",
  title: "[DEMO] Building the Ultimate Chat Viewer",
  thumbnailUrl: "https://i.ytimg.com/vi/demo/hqdefault.jpg",
  concurrentViewers: "12,847",
  actualStartTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
};

/**
 * Total demo duration in ms (for looping)
 */
export const DEMO_DURATION_MS = DEMO_MESSAGES[DEMO_MESSAGES.length - 1].delay + 2000;
