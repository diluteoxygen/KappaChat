# Emoji Parser Utility

A robust TypeScript utility for parsing and processing Twitch-style emoji codes (`:emojiName:`) with Unicode mapping support.

## Features

✅ **Parse emoji codes** in the format `:emojiName:`  
✅ **Map to Unicode** - 70+ popular Twitch emotes mapped to Unicode equivalents  
✅ **Type-safe** - Full TypeScript support with exported interfaces  
✅ **Edge case handling** - Escaped colons, malformed codes, empty messages  
✅ **Performance optimized** - Efficient regex-based parsing  
✅ **Helper functions** - Extract names, check for emojis, validate mappings  

## Installation

The utility is already part of this project. Import from:

\`\`\`typescript
import { parseMessageForEmojis } from '@/lib/emoji-parser';
\`\`\`

## Basic Usage

### Parse a Message

\`\`\`typescript
import { parseMessageForEmojis } from '@/lib/emoji-parser';

const message = "Hello :Kappa: this is :PogChamp: amazing!";
const parts = parseMessageForEmojis(message);

// Returns:
// [
//   {type: 'text', value: 'Hello '},
//   {type: 'emoji', value: ':Kappa:', emojiData: {name: 'Kappa', unicode: '🦎'}},
//   {type: 'text', value: ' this is '},
//   {type: 'emoji', value: ':PogChamp:', emojiData: {name: 'PogChamp', unicode: '😲'}},
//   {type: 'text', value: ' amazing!'}
// ]
\`\`\`

### Render with Unicode

\`\`\`typescript
function renderMessage(message: string): string {
  const parts = parseMessageForEmojis(message);
  return parts
    .map(part => part.type === 'emoji' 
      ? (part.emojiData?.unicode || part.value)
      : part.value
    )
    .join('');
}

renderMessage("Hello :Kappa:"); // "Hello 🦎"
\`\`\`

## API Reference

### Main Functions

#### `parseMessageForEmojis(message: string): MessagePart[]`

Parses a message and returns an array of parts containing text and emoji segments.

**Parameters:**
- `message` - The message text to parse

**Returns:** Array of `MessagePart` objects

#### `hasEmojis(message: string): boolean`

Checks if a message contains any emoji codes.

**Parameters:**
- `message` - The message text to check

**Returns:** `true` if message contains at least one emoji code

#### `extractEmojiNames(message: string): string[]`

Extracts just the emoji names (without colons) from a message.

**Parameters:**
- `message` - The message text to parse

**Returns:** Array of emoji names

**Example:**
\`\`\`typescript
extractEmojiNames("Hello :Kappa: and :PogChamp:!"); 
// Returns: ['Kappa', 'PogChamp']
\`\`\`

#### `getEmoteUnicode(emoteName: string): string | undefined`

Gets the Unicode representation for a Twitch emote name.

**Parameters:**
- `emoteName` - The emote name (without colons)

**Returns:** Unicode emoji string or `undefined` if no mapping exists

**Example:**
\`\`\`typescript
getEmoteUnicode('Kappa'); // Returns: '🦎'
getEmoteUnicode('CustomEmote'); // Returns: undefined
\`\`\`

#### `hasEmoteMapping(emoteName: string): boolean`

Checks if an emote has a Unicode mapping.

**Parameters:**
- `emoteName` - The emote name (without colons)

**Returns:** `true` if mapping exists

### TypeScript Types

#### `MessagePart`

\`\`\`typescript
interface MessagePart {
  type: 'text' | 'emoji';
  value: string;
  emojiData?: EmojiData;
}
\`\`\`

#### `EmojiData`

\`\`\`typescript
interface EmojiData {
  name: string;      // Emote name without colons
  unicode?: string;  // Unicode equivalent (if available)
}
\`\`\`

## Supported Emotes

The parser includes mappings for 70+ popular Twitch emotes:

| Emote | Unicode | Emote | Unicode |
|-------|---------|-------|---------|
| Kappa | 🦎 | PogChamp | 😲 |
| LUL | 😂 | KEKW | 🤣 |
| PogChamp | 😲 | Pepega | 🤪 |
| 4Head | 😄 | monkaS | 😰 |
| BibleThump | 😢 | OMEGALUL | 🤣 |
| TriHard | 💪 | GIGACHAD | 💪 |
| ... and 60+ more! | | | |

See the source code for the complete list.

## Edge Cases Handled

### Escaped Colons
\`\`\`typescript
parseMessageForEmojis("\\:not:an:emoji:"); 
// Treats escaped colons as literal text
\`\`\`

### Malformed Codes
\`\`\`typescript
parseMessageForEmojis(":incomplete"); 
// Only parses valid :name: format
\`\`\`

### Unknown Emotes
\`\`\`typescript
parseMessageForEmojis(":CustomEmote:");
// Returns emoji part without unicode mapping
// {type: 'emoji', value: ':CustomEmote:', emojiData: {name: 'CustomEmote'}}
\`\`\`

### Empty/Whitespace
\`\`\`typescript
parseMessageForEmojis(""); // Returns []
parseMessageForEmojis("   "); // Returns [{type: 'text', value: '   '}]
\`\`\`

### Long Messages
Efficiently handles messages with 50+ emojis without performance degradation.

## React Example

\`\`\`typescript
import { parseMessageForEmojis } from '@/lib/emoji-parser';

function ChatMessage({ text }: { text: string }) {
  const parts = parseMessageForEmojis(text);
  
  return (
    <div className="message">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.value}</span>;
        }
        
        const { name, unicode } = part.emojiData!;
        if (unicode) {
          return (
            <span key={i} className="emoji" title={name}>
              {unicode}
            </span>
          );
        }
        
        // Fallback for custom emotes
        return (
          <img
            key={i}
            src={\`/emotes/\${name}.png\`}
            alt={name}
            className="custom-emote"
          />
        );
      })}
    </div>
  );
}
\`\`\`

## Performance Tips

1. **Check before parsing**: Use `hasEmojis()` to avoid unnecessary parsing
   \`\`\`typescript
   if (hasEmojis(message)) {
     const parts = parseMessageForEmojis(message);
     // ... process
   }
   \`\`\`

2. **Bulk processing**: Process arrays efficiently
   \`\`\`typescript
   const processed = messages.map(msg => ({
     original: msg,
     parts: parseMessageForEmojis(msg)
   }));
   \`\`\`

3. **Memoization**: Cache parsed results in React components
   \`\`\`typescript
   const parts = useMemo(() => parseMessageForEmojis(text), [text]);
   \`\`\`

## Testing

The utility includes comprehensive test coverage for:
- Basic emoji parsing
- Multiple emojis in one message
- Text-only messages
- Escaped colons
- Malformed codes
- Empty and whitespace messages
- Unknown emotes
- Long messages with many emojis

See `__examples__/emoji-parser.example.ts` for detailed examples.

## License

Part of the yt_chat project.
