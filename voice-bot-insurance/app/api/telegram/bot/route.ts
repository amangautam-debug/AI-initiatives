import { NextRequest, NextResponse } from "next/server";
import { initTelegramBot, stopTelegramBot, getTelegramBot } from "@/lib/telegram";

// GET - Get bot status
export async function GET() {
  const bot = getTelegramBot();
  
  return NextResponse.json({
    active: !!bot,
    mode: bot ? "polling" : "inactive",
    configured: !!process.env.TELEGRAM_BOT_TOKEN,
  });
}

// POST - Start the bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action } = body as { action?: string };

    if (action === "stop") {
      stopTelegramBot();
      return NextResponse.json({ 
        success: true, 
        message: "Telegram bot stopped" 
      });
    }

    // Default action is start
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN not configured in .env" },
        { status: 400 }
      );
    }

    const bot = initTelegramBot();
    
    if (bot) {
      return NextResponse.json({ 
        success: true, 
        message: "Telegram bot started with polling mode" 
      });
    } else {
      return NextResponse.json(
        { error: "Failed to start bot" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Telegram Bot API] Error:", error);
    return NextResponse.json(
      { error: "Failed to manage bot" },
      { status: 500 }
    );
  }
}
