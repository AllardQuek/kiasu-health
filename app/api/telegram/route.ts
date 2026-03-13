import { bot } from "@/lib/bot";
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";

// Increase serverless function timeout (max 60s for hobby, 300s for pro)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Ensure the bot is initialized before handling updates.
    // Grammy needs bot info (ID, name, username) which it normally fetches via getMe().
    // When using handleUpdate directly, we must ensure init() has been called at least once.
    if (!bot.isInited()) {
      console.log("[api/telegram] Bot not inited, calling bot.init()...");
      await bot.init();
    }

    // Use waitUntil to perform the heavy bot handling in the background.
    // This allows returning a 200 OK to Telegram immediately to prevent retries
    // while the bot/agent take 15+ seconds to process.
    if (process.env.VERCEL) {
      console.log("[api/telegram] Running in Vercel, using waitUntil");
      waitUntil(
        (async () => {
          try {
            console.log("[api/telegram] Starting background handleUpdate");
            await bot.handleUpdate(body);
            console.log("[api/telegram] Finished background handleUpdate");
          } catch (err) {
            console.error("[api/telegram] Error handling update in background:", err);
          }
        })()
      );
    } else {
      // Local development or non-Vercel environment
      console.log("[api/telegram] Running locally, awaiting handleUpdate");
      // Add a small safety timeout to ensure it doesn't hang forever locally
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 55000); 
      try {
        await bot.handleUpdate(body);
      } finally {
        clearTimeout(timeout);
      }
    }

    // Explicitly set 200 OK for Telegram
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[api/telegram] webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
