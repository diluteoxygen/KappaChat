/**
 * Emoji Parser Utility
 * 
 * Parses message text to detect and process emoji codes (like :PogChamp:, :Kappa:, etc.)
 * and maps common Twitch emotes to Unicode equivalents where possible.
 */

import type { EmojiData, MessagePart } from "@/types/youtube";

/**
 * Mapping of common Twitch emote codes to Unicode emoji equivalents
 * or descriptive alternatives when no direct Unicode equivalent exists
 */
const TWITCH_EMOTE_MAP: Record<string, string> = {
  // Popular Twitch emotes with Unicode equivalents
  'Kappa': '🦎',
  'PogChamp': '😲',
  'LUL': '😂',
  'KEKW': '🤣',
  'TriHard': '💪',
  '4Head': '😄',
  'BibleThump': '😢',
  'Kreygasm': '😍',
  'DansGame': '🤢',
  'SwiftRage': '😡',
  'NotLikeThis': '😰',
  'FailFish': '🤦',
  'VoHiYo': '👋',
  'PJSalt': '🧂',
  'MrDestructoid': '🤖',
  'BabyRage': '😭',
  'WutFace': '😨',
  'Jebaited': '🎣',
  'ResidentSleeper': '😴',
  'GivePLZ': '🙏',
  'TakeNRG': '⚡',
  'CoolStoryBob': '📖',
  'ThunBeast': '🦍',
  'TBAngel': '😇',
  'SeemsGood': '👍',
  'BlessRNG': '🍀',
  'FrankerZ': '🐕',
  'RalpherZ': '🐕',
  'OhMyDog': '🐶',
  'EleGiggle': '😆',
  'KappaPride': '🏳️‍🌈',
  'CoolCat': '😺',
  'CorgiDerp': '🐕',
  'SeriousSloth': '🦥',
  'TwitchUnity': '💜',
  'POGGERS': '😮',
  'Pepega': '🤪',
  'monkaS': '😰',
  'monkaW': '😱',
  'PepeHands': '😢',
  'WeirdChamp': '😬',
  'Sadge': '😔',
  'Copium': '💊',
  'Hopium': '✨',
  'Clap': '👏',
  'OMEGALUL': '🤣',
  'LULW': '😂',
  'PepeLaugh': '😏',
  'FeelsGoodMan': '😊',
  'FeelsBadMan': '☹️',
  'FeelsOkayMan': '🙂',
  'GachiGASM': '😩',
  'widepeepoHappy': '😊',
  'peepoShy': '☺️',
  'Pog': '😮',
  'PagMan': '😳',
  'BASED': '💯',
  'Aware': '👁️',
  'Clueless': '🤔',
  'Susge': '🤨',
  'GIGACHAD': '💪',
  'EZ': '😎',
  'KEKL': '😆',
  'KEKWait': '⏰',
  'Madge': '😠',
  'Okayge': '👌',
  'PauseChamp': '⏸️',
  'Stare': '👀',
  'monkaHmm': '🤔',
  'WAYTOODANK': '🔥',
  'pepeD': '🎵',
  'catJAM': '🎶',
  'NOTED': '📝',
  'SOY': '😱',
  'HACKERMANS': '💻',
  'FeelsDankMan': '😏',
  'forsenCD': '💿',
  'Okayga': '👌',
  'COCKA': '🐔',
};

/**
 * Mapping of built-in YouTube live chat system emotes to Unicode emoji equivalents.
 * Supports pandemic era health emotes and standard/hidden YouTube gaming emotes.
 */
const YOUTUBE_EMOTE_MAP: Record<string, string> = {
  // COVID-19 Era / Health Awareness Emotes (March 2020)
  'stayhome': '🏡',
  'elbowbump': '💪',
  'elbowcough': '🤧',
  'washhands': '🧼',
  'dothefive': '✋',
  'socialdist': '↔️',
  'shelterin': '🏠',
  'virtualhug': '🤗',
  'goodvibes': '✨',
  'thanksdoc': '🩺',
  'yougotthis': '💪',
  'videocall': '📹',
  'chillwcat': '🐱',
  'chillwdog': '🐶',
  'learning': '📚',
  'sanitizer': '🧴',
  'takeout': '🥡',
  'hydrate': '🥛',

  // Standard & Hidden YouTube Gaming / Platform Emotes
  'buffering': '🔄',
  'oops': '🤭',
  'yt': '▶️',
  'ytg': '🎮',
  'awesome': '😎',
  'gar': '😓',
  'jakepeter': '😇',
  'wormyellowred': '🐛',
  'wormredblue': '🐛',
  'wormorangegreen': '🐛',
};

/**
 * Regular expression to match emoji codes in the format :emojiName:
 * - Must start with an unescaped colon
 * - Contains one or more word characters (letters, numbers, underscores)
 * - Must end with a closing colon
 * - Uses negative lookbehind to exclude escaped colons
 */
const EMOJI_CODE_REGEX = /(?<!\\):([a-zA-Z0-9_]+):/g;

/**
 * Parses a message string and extracts emoji codes, converting them to structured parts
 * 
 * @param message - The message text to parse
 * @returns Array of message parts containing text segments and emoji data
 * 
 * @example
 * ```typescript
 * const parts = parseMessageForEmojis("Hello :Kappa: world!");
 * // Returns:
 * // [
 * //   {type: 'text', value: 'Hello '},
 * //   {type: 'emoji', value: ':Kappa:', emojiData: {name: 'Kappa', unicode: '🦎'}},
 * //   {type: 'text', value: ' world!'}
 * // ]
 * ```
 */
export function parseMessageForEmojis(message: string): MessagePart[] {
  // Handle edge cases: empty or whitespace-only messages
  if (!message || typeof message !== 'string') {
    return [];
  }

  // If message is only whitespace, return as single text part
  if (message.trim() === '') {
    return [{ type: 'text', value: message }];
  }

  const parts: MessagePart[] = [];
  let lastIndex = 0;

  // Create a new regex instance to reset lastIndex for each call
  const regex = new RegExp(EMOJI_CODE_REGEX.source, EMOJI_CODE_REGEX.flags);
  let match: RegExpExecArray | null;

  // Iterate through all emoji code matches
  while ((match = regex.exec(message)) !== null) {
    const matchIndex = match.index;
    const fullMatch = match[0]; // Full match including colons (e.g., ":Kappa:")
    const emojiName = match[1]; // Captured group without colons (e.g., "Kappa")

    // Add text part before the emoji if there's any content
    if (matchIndex > lastIndex) {
      const textValue = message.substring(lastIndex, matchIndex);
      parts.push({
        type: 'text',
        value: textValue,
      });
    }

    // Add emoji part
    const unicode = TWITCH_EMOTE_MAP[emojiName] || YOUTUBE_EMOTE_MAP[emojiName.toLowerCase()];
    parts.push({
      type: 'emoji',
      value: fullMatch,
      emojiData: {
        name: emojiName,
        unicode,
      },
    });

    lastIndex = regex.lastIndex;
  }

  // Add remaining text after the last emoji
  if (lastIndex < message.length) {
    const textValue = message.substring(lastIndex);
    parts.push({
      type: 'text',
      value: textValue,
    });
  }

  // If no emojis were found, return the entire message as text
  if (parts.length === 0) {
    return [{ type: 'text', value: message }];
  }

  return parts;
}

/**
 * Helper function to check if a message contains any emoji codes
 * 
 * @param message - The message text to check
 * @returns True if the message contains at least one emoji code
 */
export function hasEmojis(message: string): boolean {
  if (!message || typeof message !== 'string') {
    return false;
  }
  const regex = new RegExp(EMOJI_CODE_REGEX.source, EMOJI_CODE_REGEX.flags);
  return regex.test(message);
}

/**
 * Helper function to extract just the emoji names from a message
 * 
 * @param message - The message text to parse
 * @returns Array of emoji names found in the message
 * 
 * @example
 * ```typescript
 * const emojis = extractEmojiNames("Hello :Kappa: and :PogChamp:!");
 * // Returns: ['Kappa', 'PogChamp']
 * ```
 */
export function extractEmojiNames(message: string): string[] {
  if (!message || typeof message !== 'string') {
    return [];
  }

  const regex = new RegExp(EMOJI_CODE_REGEX.source, EMOJI_CODE_REGEX.flags);
  const names: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(message)) !== null) {
    names.push(match[1]);
  }

  return names;
}

/**
 * Helper function to get the Unicode representation of a Twitch emote
 * 
 * @param emoteName - The name of the emote (without colons)
 * @returns The Unicode equivalent or undefined if no mapping exists
 * 
 * @example
 * ```typescript
 * const unicode = getEmoteUnicode('Kappa');
 * // Returns: '🦎'
 * ```
 */
export function getEmoteUnicode(emoteName: string): string | undefined {
  return TWITCH_EMOTE_MAP[emoteName] || YOUTUBE_EMOTE_MAP[emoteName.toLowerCase()];
}

/**
 * Helper function to check if an emote has a Unicode mapping
 * 
 * @param emoteName - The name of the emote (without colons)
 * @returns True if the emote has a Unicode mapping
 */
export function hasEmoteMapping(emoteName: string): boolean {
  return emoteName in TWITCH_EMOTE_MAP || emoteName.toLowerCase() in YOUTUBE_EMOTE_MAP;
}

/**
 * Extracts message parts from a message object with runs structure (from youtubei.js)
 * Handles both text runs and emoji runs with image URLs
 * 
 * @param message - The message object that may contain runs array with text/emoji data
 * @returns Array of message parts with text and emoji (including image URLs for YouTube emotes)
 * 
 * @example
 * ```typescript
 * const message = {
 *   runs: [
 *     { text: "Hello " },
 *     { emoji: { emojiId: "UCkszU2WH9gy1mb0dV-11UJg/jPgfY5j2IIud29sP3ZeA4Ag", image: { thumbnails: [{url: "https://..."}]} } },
 *     { text: " world" }
 *   ]
 * };
 * const parts = extractMessageRuns(message);
 * // Returns parts with emoji including imageUrl
 * ```
 */
export function extractMessageRuns(message: any): MessagePart[] {
  // Check if message has runs structure
  if (!message || !Array.isArray(message.runs)) {
    return [];
  }

  const parts: MessagePart[] = [];

  for (const run of message.runs) {
    // Emoji run (youtubei.js stores custom emote thumbnails in emoji.image[])
    if (run.emoji) {
      const emoji = run.emoji;
      const imageUrl = Array.isArray(emoji.image) && emoji.image.length > 0
        ? emoji.image[emoji.image.length - 1]?.url
        : undefined;

      parts.push({
        type: 'emoji',
        value: emoji.shortcuts?.[0] || emoji.text || emoji.emoji_id || 'emote',
        emojiData: {
          name: emoji.shortcuts?.[0] || emoji.emoji_id || 'custom-emote',
          imageUrl,
        },
      });
      continue;
    }

    // Text run
    if (run.text) {
      const textParts = parseMessageForEmojis(run.text);
      parts.push(...textParts);
    }
  }

  return parts;
}

/**
 * Parses Twitch native emotes from the IRC emotes tag and splits the text into MessageParts.
 * @param text The raw message text
 * @param emotesTag The raw emotes tag (e.g., "25:0-4,12-16/1902:6-10")
 * @returns Array of MessagePart
 */
export function parseTwitchEmotes(text: string, emotesTag: string): MessagePart[] {
  if (!emotesTag) {
    return parseMessageForEmojis(text);
  }

  // Parse emotesTag into a list of { id, start, end }
  const emotePlacements: { id: string; start: number; end: number }[] = [];
  const emoteGroups = emotesTag.split('/');
  for (const group of emoteGroups) {
    const [id, positions] = group.split(':');
    if (!id || !positions) continue;
    const ranges = positions.split(',');
    for (const range of ranges) {
      const [start, end] = range.split('-');
      if (start !== undefined && end !== undefined) {
        emotePlacements.push({
          id,
          start: parseInt(start, 10),
          end: parseInt(end, 10),
        });
      }
    }
  }

  // Sort placements by start index
  emotePlacements.sort((a, b) => a.start - b.start);

  const parts: MessagePart[] = [];
  let currentIndex = 0;

  for (const placement of emotePlacements) {
    // Add text before the emote
    if (placement.start > currentIndex) {
      const textBefore = text.substring(currentIndex, placement.start);
      // We still parse for Unicode emojis in the text part
      parts.push(...parseMessageForEmojis(textBefore));
    }

    // Add the emote
    const emoteText = text.substring(placement.start, placement.end + 1);
    parts.push({
      type: 'emoji',
      value: emoteText,
      emojiData: {
        name: emoteText,
        imageUrl: `https://static-cdn.jtvnw.net/emoticons/v2/${placement.id}/default/dark/1.0`,
      },
    });

    currentIndex = placement.end + 1;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const textAfter = text.substring(currentIndex);
    parts.push(...parseMessageForEmojis(textAfter));
  }

  return parts;
}

/**
 * Scans text MessageParts and replaces known 7TV emote names with emoji parts.
 * @param parts The original message parts (already containing Twitch native emotes)
 * @param emotesMap The map of 7TV emote names to image URLs
 * @returns A new array of MessageParts with 7TV emotes injected
 */
export function inject7TVEmotes(parts: MessagePart[], emotesMap: Record<string, string>): MessagePart[] {
  if (!emotesMap || Object.keys(emotesMap).length === 0) return parts;

  const newParts: MessagePart[] = [];

  for (const part of parts) {
    if (part.type === 'emoji') {
      if (part.emojiData && !part.emojiData.imageUrl && !part.emojiData.unicode) {
        const emoteValue = part.value; // e.g. ":tf:"
        const emoteName = part.emojiData.name; // e.g. "tf"
        const mappedUrl = emotesMap[emoteValue] || (emoteName ? emotesMap[emoteName] : undefined);
        if (mappedUrl) {
          newParts.push({
            ...part,
            emojiData: {
              ...part.emojiData,
              imageUrl: mappedUrl,
            },
          });
          continue;
        }
      }
      newParts.push(part);
      continue;
    }

    if (part.type !== 'text' || !part.value) {
      newParts.push(part);
      continue;
    }

    const words = part.value.split(/(\s+)/); // Split by whitespace but keep the whitespace
    for (const word of words) {
      if (emotesMap[word]) {
        newParts.push({
          type: 'emoji',
          value: word,
          emojiData: {
            name: word,
            imageUrl: emotesMap[word],
          },
        });
      } else {
        // We could optimize this by combining adjacent text parts
        const lastPart = newParts[newParts.length - 1];
        if (lastPart && lastPart.type === 'text') {
          lastPart.value += word;
        } else {
          newParts.push({ type: 'text', value: word });
        }
      }
    }
  }

  return newParts;
}

/**
 * Resolves standard Twitch static/animated cheer gem GIF CDN URLs based on bits amount
 */
export function getTwitchCheerGemUrl(amount: number): string {
  if (amount >= 10000) {
    return "https://static-cdn.jtvnw.net/bits/dark/animated/red/1.gif";
  } else if (amount >= 5000) {
    return "https://static-cdn.jtvnw.net/bits/dark/animated/blue/1.gif";
  } else if (amount >= 1000) {
    return "https://static-cdn.jtvnw.net/bits/dark/animated/teal/1.gif";
  } else if (amount >= 100) {
    return "https://static-cdn.jtvnw.net/bits/dark/animated/purple/1.gif";
  } else {
    return "https://static-cdn.jtvnw.net/bits/dark/animated/gray/1.gif";
  }
}

/**
 * Scans text MessageParts and replaces Twitch cheer words (e.g. cheer100, kappa1000)
 * with animated cheer gem emojis.
 */
export function injectTwitchCheerEmotes(parts: MessagePart[]): MessagePart[] {
  const newParts: MessagePart[] = [];
  const cheerRegex = /^([a-zA-Z]+)([1-9][0-9]*)$/;

  for (const part of parts) {
    if (part.type !== 'text' || !part.value) {
      newParts.push(part);
      continue;
    }

    const words = part.value.split(/(\s+)/); // Split by whitespace but keep the whitespace
    for (const word of words) {
      const match = word.match(cheerRegex);
      if (match) {
        const amount = parseInt(match[2], 10);
        // Common global cheermotes include: cheer, kappa, biblethump, kreygasm, etc.
        // We support any alpha prefix + number as a valid cheermote to automatically support all broadcaster custom cheermotes.
        const imageUrl = getTwitchCheerGemUrl(amount);
        newParts.push({
          type: 'emoji',
          value: word,
          emojiData: {
            name: word,
            imageUrl,
          },
        });
      } else {
        const lastPart = newParts[newParts.length - 1];
        if (lastPart && lastPart.type === 'text') {
          lastPart.value += word;
        } else {
          newParts.push({ type: 'text', value: word });
        }
      }
    }
  }

  return newParts;
}
