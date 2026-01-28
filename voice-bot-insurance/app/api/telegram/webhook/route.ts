import { NextRequest, NextResponse } from "next/server";
import TelegramBot from "node-telegram-bot-api";
import { handleTelegramWebhook, initTelegramBot } from "@/lib/telegram";

// Verify webhook token
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";

// POST - Handle incoming Telegram updates
export async function POST(request: NextRequest) {
  try {
    // Verify secret token if configured
    const secretToken = request.headers.get("x-telegram-bot-api-secret-token");
    if (TELEGRAM_WEBHOOK_SECRET && secretToken !== TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure bot is initialized
    initTelegramBot();

    // Parse update
    const update = await request.json() as TelegramBot.Update;
    
    // Process update
    await handleTelegramWebhook(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Telegram Webhook] Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Telegram webhook endpoint is active" 
  });
}
