# jChat Technical Breakdown (v2)

This document provides an in-depth analysis of how **jChat** handles its URL generation, dynamic styling, and chat overlay logic. This is designed to serve as a comprehensive reference for recreating similar functionality in other projects like `yt_chat`.

---

## 1. URL Generation & Parameters

The jChat setup page (`index.html`) acts as a configuration builder. It captures user settings via a form and encodes them into a URL that the `v2/` overlay parses.

### Parameter Mapping
When you click "Generate", the script gathers data from the form and uses `encodeQueryData` to append them to the base URL.

| Parameter | Type | Description | Values |
| :--- | :--- | :--- | :--- |
| `channel` | String | The Twitch username to connect to. | e.g., `xqc` |
| `size` | Integer | Font size preset. | `1` (Small), `2` (Medium), `3` (Large) |
| `font` | Integer | Font family index. | `0` to `11` (maps to `settings.js`) |
| `stroke` | Integer | Text outline thickness. | `0` (Off), `1` (Thin), `2` (Medium), `3` (Thick), `4` (Thicker) |
| `shadow` | Integer | Text shadow preset. | `0` (Off), `1` (Small), `2` (Medium), `3` (Large) |
| `bots` | Boolean | Whether to show messages from common bots. | `true` / `false` |
| `hide_commands` | Boolean | Whether to hide messages starting with `!`. | `true` / `false` |
| `hide_badges` | Boolean | Hide custom subscriber/special badges. | `true` / `false` |
| `animate` | Boolean | Enable smooth slide-up animation for messages. | `true` / `false` |
| `fade` | Integer | Time in seconds before a message disappears. | `false` or seconds (e.g., `30`) |
| `small_caps` | Boolean | Convert text to Small Caps style. | `true` / `false` |

### URL Constructor Logic
In `script.js`, the URL is built as follows:
```javascript
const generatedUrl = window.location.origin + window.location.pathname.replace('index.html', '') + 'v2/?channel=' + $channel.val();
const params = encodeQueryData(data);
$url.val(generatedUrl + '&' + params);
```

---

## 2. Dynamic Styling System

jChat uses a "Modular CSS" approach. Instead of calculating styles in JavaScript, it injects `<link>` tags dynamically based on the URL parameters.

### The `appendCSS` Pattern
In `v2/utils.js`, there is a helper function that handles style injection:
```javascript
function appendCSS(type, name) {
    $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        class: `chat_${type}`,
        href: `styles/${type}_${name}.css`
    }).appendTo("head");
}
```

### File Naming Convention
The filenames in the `v2/styles/` directory follow a strict naming convention to match the script's logic:
- **Fonts**: `font_BalooTammudu.css`, `font_Roboto.css`, etc.
- **Sizes**: `size_small.css`, `size_medium.css`, `size_large.css`.
- **Effects**: `stroke_thin.css`, `shadow_small.css`.

### Example: How `size=2` becomes CSS
1. User provides `size=2`.
2. Script looks up index 1 in the `sizes` array (from `settings.js`): `sizes[1] == 'medium'`.
3. Calls `appendCSS('size', 'medium')`.
4. Browser loads `v2/styles/size_medium.css`.

---

## 3. Visual Styling & Overlay Layout

The overlay is designed to be anchored at the bottom of the screen, with messages appearing and pushing older ones upward.

### Base Container (`style.css`)
The `#chat_container` is the heart of the overlay. It uses absolute positioning to stick to the bottom:
```css
#chat_container {
    width: calc(100% - 20px);
    padding: 10px;
    position: absolute;
    bottom: 0;
    overflow: hidden;
    background-color: transparent; /* Allows OBS transparency */
    color: white;
    font-weight: 800; /* Bold for readability */
    word-break: break-word;
}
```

### Typography Scaling (`size_*.css`)
Each size preset (Small, Medium, Large) controls not just the text size, but the entire vertical rhythm of the chat. For example, in **Large**:
- **Font Size**: `48px`
- **Line Height**: `75px` (Provides breathing room between messages)
- **Badges**: `40x40px`
- **Emotes**: Scaled up to `max-height: 60px` to match the text height.

### Text Effects
jChat achieves high readability over any background (gameplay, video) using two modular effects:
1. **Strokes**: Uses `-webkit-text-stroke: Xpx black;` to create a sharp outline around every letter.
2. **Shadows**: Uses `text-shadow: Xpx Xpx black;` for a softer "drop shadow" look.

### Element Alignment
To ensure everything looks professional:
- **Vertical Alignment**: All images (`.badge`, `.emote`, `.emoji`) use `vertical-align: middle;`. This keeps them perfectly centered with the text line.
- **Zero-Width Emotes**: jChat supports "layering" emotes (like sunglasses on a face). It uses a `.zero-width_container` with `display: inline-flex` and `position: absolute` for the layered emote to stack it correctly on top of the previous one.

---

## 4. Core Logic & Connection (v2)

The overlay (`v2/index.html`) is the actual engine. It uses WebSockets to connect directly to Twitch's IRC server.

### 1. Initialization (`Chat.load`)
Before connecting, the script must initialize the environment:
1. **Fetch Channel ID**: It calls an API (originally Twitch v5, now patched to `decapi.me`) to convert the username to a numeric ID.
2. **Load Emotes**: Uses the ID to fetch emotes from **BTTV**, **FrankerFaceZ**, and **7TV**.
3. **Inject Styles**: Parses the URL and calls `appendCSS` for each setting.
4. **Callback**: Once data is ready, it triggers the connection.

### 2. IRC Connection
It connects to `wss://irc-ws.chat.twitch.tv` using the `ReconnectingWebSocket` library for stability.
- **Protocol**: Anonymous login (justinfan) since it only needs to read messages.
- **Capabilities**: Requests `twitch.tv/commands` and `twitch.tv/tags` to get metadata like user colors, badges, and emote IDs.

### 3. Message Processing
When a message (`PRIVMSG`) arrives:
1. **Parsing**: `irc-message.js` converts the raw IRC string into a clean JSON object with tags.
2. **Filtering**: Checks if the user is blocked, if it's a bot (if `showBots` is false), or if it's a command.
3. **Rendering**:
   - Converts emote codes (e.g., `LUL`) into `<img>` tags.
   - Parses Twitter Emojis using `twemoji`.
   - Sanitizes HTML to prevent XSS.
   - Calculates "Brightness" for user colors (if a name color is too dark for a black background, it lightens it).

---

## 4. Message Rendering Flow

Every 200ms (`Chat.update`), the script checks for new messages in the queue and appends them to `#chat_container`.

### The DOM Structure
Each message is wrapped in a `chat_line` div:
```html
<div class="chat_line" data-nick="user" data-time="12345678" data-id="uuid">
    <span class="user_info">
        <img class="badge" src="..."> <!-- Badges -->
        <span class="nick" style="color: #FF0000;">Username</span> <!-- Name -->
        <span class="colon">:</span>
    </span>
    <span class="message">
        Hello World! <img class="emote" src="..."> <!-- Content -->
    </span>
</div>
```

### Smooth Animation Logic
If `animate=true`, the script does a clever trick:
1. Appends the message to a hidden "Auxiliary" div to calculate its height.
2. Appends an empty spacer div to the main container.
3. Animates that spacer from `height: 0` to the calculated height.
4. Replaces the spacer with the actual message content.

---

## 5. Customization Settings Reference

### Fonts (`settings.js`)
The `fonts` array defines the order. The URL parameter `font=2` refers to `fonts[2]`.
```javascript
const fonts = ['BalooTammudu', 'SegoeUI', 'Roboto', 'Lato', 'NotoSans', 'SourceCodePro', 'Impact', 'Comfortaa', 'DancingScript', 'IndieFlower', 'PressStart2P', 'Wallpoet'];
```

### Fade Logic
If `fade` is set (e.g., `fade=30`):
- Every update, it calculates `(Date.now() - messageTime) / 1000`.
- If it exceeds the limit, it triggers a jQuery `.fadeOut()` and `.remove()`.

---

## Recreating for YouTube Chat
If you are building a `yt_chat` version, you should:
1. **Adopt the Modular CSS**: Create separate CSS files for fonts and sizes. It makes customization extremely easy.
2. **URL Builders**: Use a setup page to generate URLs so users don't have to manually edit parameters.
3. **Tags & Metadata**: Like Twitch IRC tags, ensure your YouTube message parser captures user IDs, moderator status, and emote mappings.
4. **Reconnecting Logic**: Always use a reconnecting wrapper for your data source (WebSocket or Polling) to ensure the overlay doesn't die during a stream.
