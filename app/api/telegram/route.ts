import { bot } from "@/lib/bot";
import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";

// Increase serverless function timeout (max 60s for hobby, 300s for pro)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Use waitUntil to perform the heavy bot handling in the background.
    // This allows returning a 200 OK to Telegram immediately to prevent retries
    // while the bot/agent take 15+ seconds to process.
    if (process.env.VERCEL) {
      waitUntil(
        (async () => {
          try {
            await bot.handleUpdate(body);
          } catch (err) {
            console.error("Error handling update in background:", err);
          }
        })()
      );
    } else {
      // Local development or non-Vercel environment
      await bot.handleUpdate(body);
    }

    // Explicitly set 200 OK for Telegram
    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error("[api/telegram] webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
