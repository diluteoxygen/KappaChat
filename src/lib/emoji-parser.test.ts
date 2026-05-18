import { describe, test, expect } from "bun:test";
import {
  parseMessageForEmojis,
  hasEmojis,
  extractEmojiNames,
  getEmoteUnicode,
  hasEmoteMapping,
} from "./emoji-parser";

describe("YouTube and Twitch Emoji Parser Tests", () => {
  // Test basic Twitch emote mapping
  test("should map popular Twitch emotes to Unicode", () => {
    expect(getEmoteUnicode("Kappa")).toBe("🦎");
    expect(getEmoteUnicode("PogChamp")).toBe("😲");
    expect(hasEmoteMapping("Kappa")).toBe(true);
  });

  // Test YouTube system/hidden emotes
  test("should map native YouTube system emotes case-insensitively", () => {
    // Exact match (lowercase key in map)
    expect(getEmoteUnicode("gar")).toBe("😓");
    expect(hasEmoteMapping("gar")).toBe(true);

    // Case-insensitive lookup (camel/pascal casing in chat)
    expect(getEmoteUnicode("Gar")).toBe("😓");
    expect(getEmoteUnicode("GAR")).toBe("😓");
    expect(hasEmoteMapping("Gar")).toBe(true);

    // Standard platform emotes
    expect(getEmoteUnicode("stayhome")).toBe("🏡");
    expect(getEmoteUnicode("StayHome")).toBe("🏡");
    expect(getEmoteUnicode("buffering")).toBe("🔄");
    expect(getEmoteUnicode("Buffering")).toBe("🔄");
    expect(getEmoteUnicode("awesome")).toBe("😎");
    expect(getEmoteUnicode("Awesome")).toBe("😎");
  });

  // Test full message parsing
  test("should parse YouTube emotes inside chat text", () => {
    const text = "Hello :gar: this is :StayHome: and :buffering:!";
    const parts = parseMessageForEmojis(text);

    expect(parts).toHaveLength(7);
    expect(parts[0]).toEqual({ type: "text", value: "Hello " });
    expect(parts[1]).toEqual({
      type: "emoji",
      value: ":gar:",
      emojiData: { name: "gar", unicode: "😓" },
    });
    expect(parts[2]).toEqual({ type: "text", value: " this is " });
    expect(parts[3]).toEqual({
      type: "emoji",
      value: ":StayHome:",
      emojiData: { name: "StayHome", unicode: "🏡" },
    });
    expect(parts[4]).toEqual({ type: "text", value: " and " });
    expect(parts[5]).toEqual({
      type: "emoji",
      value: ":buffering:",
      emojiData: { name: "buffering", unicode: "🔄" },
    });
    expect(parts[6]).toEqual({ type: "text", value: "!" });
  });

  // Test hasEmojis helper
  test("should detect presence of emojis in text", () => {
    expect(hasEmojis("No emojis here")).toBe(false);
    expect(hasEmojis("Check this out :gar:")).toBe(true);
    expect(hasEmojis("And :StayHome: too")).toBe(true);
  });

  // Test extractEmojiNames helper
  test("should extract emoji names without colons", () => {
    const names = extractEmojiNames("Hello :gar: and :StayHome: and :Kappa:");
    expect(names).toEqual(["gar", "StayHome", "Kappa"]);
  });

  // Test third-party emote injection (7TV, BTTV, FFZ)
  test("should correctly inject third-party emotes from map", () => {
    const { inject7TVEmotes } = require("./emoji-parser");
    const originalParts = [
      { type: "text", value: "This is a catJAM and peepoHappy moment!" }
    ];
    const emotesMap = {
      "catJAM": "https://cdn.7tv.app/emote/123/2x.webp",
      "peepoHappy": "https://cdn.7tv.app/emote/456/2x.webp"
    };

    const injected = inject7TVEmotes(originalParts, emotesMap);

    expect(injected).toHaveLength(5);
    expect(injected[0]).toEqual({ type: "text", value: "This is a " });
    expect(injected[1]).toEqual({
      type: "emoji",
      value: "catJAM",
      emojiData: { name: "catJAM", imageUrl: "https://cdn.7tv.app/emote/123/2x.webp" }
    });
    expect(injected[2]).toEqual({ type: "text", value: " and " });
    expect(injected[3]).toEqual({
      type: "emoji",
      value: "peepoHappy",
      emojiData: { name: "peepoHappy", imageUrl: "https://cdn.7tv.app/emote/456/2x.webp" }
    });
    expect(injected[4]).toEqual({ type: "text", value: " moment!" });
  });

  // Test colon-bound emote injection (e.g. :tf:)
  test("should correctly inject emotes that are parsed as emoji parts but have colon names (like :tf:)", () => {
    const { inject7TVEmotes } = require("./emoji-parser");
    const originalParts = [
      {
        type: "emoji",
        value: ":tf:",
        emojiData: { name: "tf", unicode: undefined }
      }
    ];
    const emotesMap = {
      ":tf:": "https://cdn.betterttv.net/emote/123/2x"
    };

    const injected = inject7TVEmotes(originalParts, emotesMap);

    expect(injected).toHaveLength(1);
    expect(injected[0].type).toBe("emoji");
    expect(injected[0].emojiData.imageUrl).toBe("https://cdn.betterttv.net/emote/123/2x");
  });
});

