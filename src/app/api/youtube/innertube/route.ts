/**
 * SSE endpoint for InnerTube live chat
 * Uses YouTube.js to stream chat messages without API key or quota
 *
 * GET /api/youtube/innertube?videoId=XXX
 *
 * Sends Server-Sent Events:
 * - { type: "connected", streamInfo: { ... } }
 * - { type: "message", message: ChatMessage }
 * - { type: "error", message: string }
 * - { type: "end" }
 */

import type { NextRequest } from "next/server";
import { YTNodes } from "youtubei.js";
import { createInnerTube, transformInnerTubeItem } from "@/lib/innertube";

export const dynamic = "force-dynamic";

/** Max duration for Vercel serverless (seconds) */
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId");

  if (!videoId) {
    return Response.json(
      { status: "error", message: "videoId query parameter is required" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed
        }
      }

      try {
         const yt = await createInnerTube();
         const info = await yt.getInfo(videoId);

        // Check if video has live chat
        let livechat;
        try {
          livechat = info.getLiveChat();
        } catch {
          send({
            type: "error",
            code: "NO_LIVE_CHAT",
            message: "This video does not have an active live chat",
          });
          controller.close();
          return;
        }

        // Send stream info on connection
         const snippet = info.basic_info;
         send({
           type: "connected",
           streamInfo: {
             videoId,
             channelId: snippet.channel_id || "",
             channelTitle: snippet.author || "",
             title: snippet.title || "",
             thumbnailUrl: snippet.thumbnail?.[0]?.url,
             // Note: InnerTube API doesn't expose concurrent viewer count (YouTube removed public tracking)
             // Only official API has liveStreamingDetails.concurrentViewers
           },
         });

        // Handle chat updates
        livechat.on("chat-update", (action) => {
          if (action.is(YTNodes.AddChatItemAction)) {
            const chatAction = action.as(YTNodes.AddChatItemAction);
            const chatMessage = transformInnerTubeItem(chatAction.item);
            if (chatMessage) {
              send({
                type: "message",
                message: {
                  ...chatMessage,
                  timestamp: chatMessage.timestamp.toISOString(),
                },
              });
            }
          }
        });

        livechat.on("error", (err) => {
          send({
            type: "error",
            message: err instanceof Error ? err.message : "Live chat error",
          });
        });

        livechat.on("end", () => {
          send({ type: "end" });
          controller.close();
        });

        // Start the live chat
        livechat.start();

        // Cleanup when client disconnects
        request.signal.addEventListener("abort", () => {
          livechat.stop();
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to connect to InnerTube";
        send({ type: "error", code: "INNERTUBE_ERROR", message });
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
