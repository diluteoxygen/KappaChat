/**
 * Example usage of the emoji-parser utility
 * 
 * This file demonstrates how to use the emoji parser in a real application.
 */

import {
  parseMessageForEmojis,
  hasEmojis,
  extractEmojiNames,
  getEmoteUnicode,
  hasEmoteMapping,
} from '../emoji-parser';
import type { MessagePart, EmojiData } from '@/types/youtube';

// Example 1: Basic parsing and rendering
function renderMessage(message: string): string {
  const parts = parseMessageForEmojis(message);
  
  return parts
    .map((part) => {
      if (part.type === 'text') {
        return part.value;
      }
      // For emoji, prefer Unicode if available, otherwise keep original code
      return part.emojiData?.unicode || part.value;
    })
    .join('');
}

console.log('Example 1: Basic rendering');
console.log(renderMessage("Hello :Kappa: world :PogChamp:"));
// Output: "Hello 🦎 world 😲"

// Example 2: Check if a message contains emojis before processing
function processMessageIfNeeded(message: string): string {
  if (!hasEmojis(message)) {
    return message; // Fast path for messages without emojis
  }
  
  // Process emojis
  return renderMessage(message);
}

console.log('\nExample 2: Conditional processing');
console.log(processMessageIfNeeded("No emojis here"));
console.log(processMessageIfNeeded("Has :Kappa: emoji"));

// Example 3: Extract emoji statistics
function getEmojiStats(message: string) {
  const emojiNames = extractEmojiNames(message);
  const uniqueEmojis = new Set(emojiNames);
  
  return {
    total: emojiNames.length,
    unique: uniqueEmojis.size,
    emojis: Array.from(uniqueEmojis),
  };
}

console.log('\nExample 3: Emoji statistics');
console.log(getEmojiStats(":Kappa: :PogChamp: :Kappa: :LUL:"));
// Output: { total: 4, unique: 3, emojis: ['Kappa', 'PogChamp', 'LUL'] }

// Example 4: Custom rendering with HTML/React
function renderMessageAsHTML(message: string): string {
  const parts = parseMessageForEmojis(message);
  
  return parts
    .map((part) => {
      if (part.type === 'text') {
        return escapeHTML(part.value);
      }
      
      const { name, unicode } = part.emojiData!;
      if (unicode) {
        return `<span class="emoji" title="${name}">${unicode}</span>`;
      }
      
      // For custom emotes without Unicode, you might use an image
      return `<img src="/emotes/${name}.png" alt="${name}" class="emote" />`;
    })
    .join('');
}

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

console.log('\nExample 4: HTML rendering');
console.log(renderMessageAsHTML("Check this out :Kappa: amazing!"));

// Example 5: React component example (pseudo-code)
interface MessageComponentProps {
  text: string;
}

function MessageComponent({ text }: MessageComponentProps) {
  const parts = parseMessageForEmojis(text);
  
  return parts.map((part, index) => {
    if (part.type === 'text') {
      return part.value; // or <span key={index}>{part.value}</span>
    }
    
    const { name, unicode } = part.emojiData!;
    if (unicode) {
      return unicode; // or <span key={index} className="emoji" title={name}>{unicode}</span>
    }
    
    // Custom emote fallback
    return `[${name}]`; // or <img key={index} src={...} alt={name} />
  });
}

// Example 6: Filtering messages with specific emotes
function containsEmote(message: string, emoteName: string): boolean {
  const emojis = extractEmojiNames(message);
  return emojis.includes(emoteName);
}

console.log('\nExample 6: Filter by emote');
console.log(containsEmote(":Kappa: hello", "Kappa")); // true
console.log(containsEmote("hello world", "Kappa")); // false

// Example 7: Validate emote names
function validateEmotes(message: string): { valid: string[]; invalid: string[] } {
  const emojiNames = extractEmojiNames(message);
  const valid: string[] = [];
  const invalid: string[] = [];
  
  for (const name of emojiNames) {
    if (hasEmoteMapping(name)) {
      valid.push(name);
    } else {
      invalid.push(name);
    }
  }
  
  return { valid, invalid };
}

console.log('\nExample 7: Validate emotes');
console.log(validateEmotes(":Kappa: :UnknownEmote: :PogChamp:"));
// Output: { valid: ['Kappa', 'PogChamp'], invalid: ['UnknownEmote'] }

// Example 8: Message part iteration for complex processing
function analyzeMessageParts(message: string) {
  const parts = parseMessageForEmojis(message);
  
  const analysis = {
    textParts: 0,
    emojiParts: 0,
    textLength: 0,
    emojisWithUnicode: 0,
    emojisWithoutUnicode: 0,
  };
  
  for (const part of parts) {
    if (part.type === 'text') {
      analysis.textParts++;
      analysis.textLength += part.value.length;
    } else {
      analysis.emojiParts++;
      if (part.emojiData?.unicode) {
        analysis.emojisWithUnicode++;
      } else {
        analysis.emojisWithoutUnicode++;
      }
    }
  }
  
  return analysis;
}

console.log('\nExample 8: Message analysis');
console.log(analyzeMessageParts("Hello :Kappa: :CustomEmote: world :PogChamp:"));

// Example 9: Performance optimization for bulk processing
function processBulkMessages(messages: string[]): Array<{ original: string; rendered: string }> {
  return messages.map((message) => ({
    original: message,
    rendered: renderMessage(message),
  }));
}

console.log('\nExample 9: Bulk processing');
const bulkMessages = [
  "First :Kappa:",
  "Second :PogChamp:",
  "Third message",
];
console.log(processBulkMessages(bulkMessages));

// Example 10: Type-safe usage with TypeScript
function processMessagePart(part: MessagePart): string {
  if (part.type === 'text') {
    return part.value;
  }
  
  // TypeScript knows this is an emoji part
  const emoji = part.emojiData!;
  return emoji.unicode || `:${emoji.name}:`;
}

console.log('\nExample 10: Type-safe processing');
const exampleParts = parseMessageForEmojis(":Kappa: test");
console.log(exampleParts.map(processMessagePart).join(''));
