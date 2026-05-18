import { describe, test, expect } from "bun:test";
import {
  parseIrcMessage,
  parseTwitchMessage,
  getTwitchSubColor,
  getTwitchBitsColor,
} from "./twitch";
import { injectTwitchCheerEmotes, getTwitchCheerGemUrl } from "./emoji-parser";
import type { MessagePart } from "@/types/youtube";

describe("Twitch IRC and USERNOTICE Parser Tests", () => {
  test("should parse raw IRC lines correctly via parseIrcMessage", () => {
    const rawLine = "@badge-info=subscriber/6;badges=subscriber/6,premium/1;color=#00FF7F;display-name=Oxy;emotes=;id=1234-5678;mod=0;room-id=11111;subscriber=1;tmi-sent-ts=1507563000000;turbo=0;user-id=99999;user-type= :oxy!oxy@oxy.tmi.twitch.tv PRIVMSG #streamer :Hello world!";
    const parsed = parseIrcMessage(rawLine);
    
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.command).toBe("PRIVMSG");
      expect(parsed.nick).toBe("oxy");
      expect(parsed.tags.color).toBe("#00FF7F");
      expect(parsed.tags["display-name"]).toBe("Oxy");
      expect(parsed.tags.id).toBe("1234-5678");
      expect(parsed.trailing).toBe("Hello world!");
    }
  });

  test("should parse normal PRIVMSG into twitchMessageEvent", () => {
    const rawLine = "@badges=subscriber/1;color=#FF69B4;display-name=Tester;id=abc-123;tmi-sent-ts=1600000000000;user-id=12345 :tester!tester@tester.tmi.twitch.tv PRIVMSG #streamer :This is a test message";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("Tester");
      expect(msg.message).toBe("This is a test message");
      expect(msg.isSuperChat).toBe(false);
      expect(msg.messageType).toBe("twitchMessageEvent");
      expect(msg.authorColor).toBe("#FF69B4");
    }
  });

  test("should parse PRIVMSG with bits into superChatEvent with correct cheer levels", () => {
    const rawLine = "@badges=;bits=100;color=#0000FF;display-name=Cheerer;id=cheer-123;tmi-sent-ts=1600000000000;user-id=54321 :cheerer!cheerer@cheerer.tmi.twitch.tv PRIVMSG #streamer :cheer100 high tier cheer!";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("Cheerer");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("100 Bits");
      expect(msg.superChatColor).toBe(getTwitchBitsColor(100)); // Should be purple (#9146FF)
      expect(msg.messageType).toBe("superChatEvent");
      
      // Inline cheer gem validation
      expect(msg.messageParts).not.toBeUndefined();
      if (msg.messageParts) {
        expect(msg.messageParts[0].type).toBe("emoji");
        expect(msg.messageParts[0].value).toBe("cheer100");
        expect(msg.messageParts[0].emojiData?.imageUrl).toContain("purple");
      }
    }
  });

  test("should parse new subscription USERNOTICE events", () => {
    const rawLine = "@badges=subscriber/0;color=;display-name=NewSub;id=sub-123;login=newsub;msg-id=sub;msg-param-sub-plan=1000;system-msg=NewSub\\ssubscribed\\sat\\sTier\\s1.;tmi-sent-ts=1600000000000;user-id=1111 :tmi.twitch.tv USERNOTICE #streamer";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("NewSub");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("Tier 1 Sub");
      expect(msg.superChatColor).toBe(getTwitchSubColor("1000")); // purple (#9146FF)
      expect(msg.messageType).toBe("newSponsorEvent");
      expect(msg.message).toBe("NewSub subscribed at Tier 1.");
    }
  });

  test("should parse resubscription USERNOTICE events with custom user message", () => {
    const rawLine = "@badges=subscriber/12;color=#8A2BE2;display-name=LoyalFan;id=resub-123;login=loyalfan;msg-id=resub;msg-param-cumulative-months=12;msg-param-sub-plan=2000;system-msg=LoyalFan\\ssubscribed\\sfor\\s12\\smonths!;tmi-sent-ts=1600000000000;user-id=2222 :tmi.twitch.tv USERNOTICE #streamer :Stunning work on the stream, keep it up!";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("LoyalFan");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("RESUB (12m)");
      expect(msg.superChatColor).toBe(getTwitchSubColor("2000")); // Pink (#E91E63)
      expect(msg.messageType).toBe("memberMilestoneChatEvent");
      expect(msg.message).toBe("Stunning work on the stream, keep it up!");
    }
  });

  test("should parse gifted subscription USERNOTICE events", () => {
    const rawLine = "@badges=moderator/1;color=#008000;display-name=GenerousMod;id=gift-123;login=generousmod;msg-id=subgift;msg-param-recipient-display-name=LuckyViewer;msg-param-recipient-user-name=luckyviewer;msg-param-sub-plan=1000;system-msg=GenerousMod\\sgifted\\sa\\sTier\\s1\\ssubscription\\sto\\sLuckyViewer!;tmi-sent-ts=1600000000000;user-id=3333 :tmi.twitch.tv USERNOTICE #streamer";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("GenerousMod");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("GIFT SUB");
      expect(msg.superChatColor).toBe("#E91E63"); // Gift pink
      expect(msg.messageType).toBe("giftMembershipReceivedEvent");
      expect(msg.message).toBe("GenerousMod gifted a Tier 1 subscription to LuckyViewer!");
    }
  });

  test("should parse community mystery gifted subscription USERNOTICE events", () => {
    const rawLine = "@badges=broadcaster/1;color=#FF4500;display-name=Streamer;id=mass-gift-123;login=streamer;msg-id=submysterygift;msg-param-mass-gift-count=5;msg-param-sub-plan=1000;system-msg=Streamer\\sgifted\\s5\\sTier\\s1\\ssubscriptions\\sto\\sthe\\scommunity!;tmi-sent-ts=1600000000000;user-id=4444 :tmi.twitch.tv USERNOTICE #streamer";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("Streamer");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("GIFT 5 SUBS");
      expect(msg.superChatColor).toBe("#E91E63"); // Gift pink
      expect(msg.messageType).toBe("membershipGiftingEvent");
      expect(msg.message).toBe("Streamer gifted 5 Tier 1 subscriptions to the community!");
    }
  });

  test("should parse raid USERNOTICE events", () => {
    const rawLine = "@badges=;color=;display-name=FriendlyHost;id=raid-123;login=friendlyhost;msg-id=raid;msg-param-displayName=FriendlyHost;msg-param-login=friendlyhost;msg-param-viewerCount=42;system-msg=FriendlyHost\\sis\\sraiding\\swith\\s42\\sviewers!;tmi-sent-ts=1600000000000;user-id=5555 :tmi.twitch.tv USERNOTICE #streamer";
    const msg = parseTwitchMessage(rawLine);

    expect(msg).not.toBeNull();
    if (msg) {
      expect(msg.authorName).toBe("FriendlyHost");
      expect(msg.isSuperChat).toBe(true);
      expect(msg.superChatAmount).toBe("RAID (42)");
      expect(msg.superChatColor).toBe("#10B981"); // Emerald green
      expect(msg.messageType).toBe("newSponsorEvent");
      expect(msg.message).toBe("FriendlyHost is raiding with 42 viewers!");
    }
  });

  test("should inject animated cheer gem images for custom amount tiers via injectTwitchCheerEmotes", () => {
    const parts: MessagePart[] = [
      { type: "text", value: "Cheering cheer1 and cheer100 and cheer1000 and cheer5000 and cheer10000 and some normal text." }
    ];
    const injected = injectTwitchCheerEmotes(parts);
    
    expect(injected).toHaveLength(11);
    expect(injected[0].value).toBe("Cheering ");
    expect(injected[1].value).toBe("cheer1");
    expect(injected[1].emojiData?.imageUrl).toBe(getTwitchCheerGemUrl(1));
    expect(injected[3].value).toBe("cheer100");
    expect(injected[3].emojiData?.imageUrl).toBe(getTwitchCheerGemUrl(100));
    expect(injected[5].value).toBe("cheer1000");
    expect(injected[5].emojiData?.imageUrl).toBe(getTwitchCheerGemUrl(1000));
    expect(injected[7].value).toBe("cheer5000");
    expect(injected[7].emojiData?.imageUrl).toBe(getTwitchCheerGemUrl(5000));
    expect(injected[9].value).toBe("cheer10000");
    expect(injected[9].emojiData?.imageUrl).toBe(getTwitchCheerGemUrl(10000));
  });
});
