import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";
import { NextResponse } from "next/server";

// Increase serverless function timeout (max 60s for hobby, 300s for pro)
export const maxDuration = 60;

const handleUpdate = webhookCallback(bot, "std/http");

export async function POST(request: Request) {
  try {
    // grammy's webhookCallback expects a standard Request
    const response = await handleUpdate(request);
    return response;
  } catch (err) {
    console.error("[api/telegram] webhook error:", err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}
