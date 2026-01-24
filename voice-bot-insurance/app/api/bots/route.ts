import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all bots
export async function GET() {
  try {
    const bots = await prisma.voiceBot.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Parse JSON fields
    const parsedBots = bots.map((bot) => ({
      ...bot,
      voiceSettings: JSON.parse(bot.voiceSettings),
      insuranceTypes: JSON.parse(bot.insuranceTypes),
    }));

    return NextResponse.json(parsedBots);
  } catch (error) {
    console.error("Error fetching bots:", error);
    return NextResponse.json(
      { error: "Failed to fetch bots" },
      { status: 500 }
    );
  }
}

// POST create new bot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      voiceId,
      voiceSettings,
      systemPrompt,
      greetingMessage,
      insuranceTypes,
      isActive = true,
    } = body;

    if (!name || !systemPrompt || !greetingMessage) {
      return NextResponse.json(
        { error: "Name, system prompt, and greeting message are required" },
        { status: 400 }
      );
    }

    const bot = await prisma.voiceBot.create({
      data: {
        name,
        description: description || "",
        voiceId: voiceId || "",
        voiceSettings: JSON.stringify(voiceSettings || {
          rate: 1,
          pitch: 1,
          volume: 1,
          language: "en-US",
        }),
        systemPrompt,
        greetingMessage,
        insuranceTypes: JSON.stringify(insuranceTypes || []),
        isActive,
      },
    });

    return NextResponse.json({
      ...bot,
      voiceSettings: JSON.parse(bot.voiceSettings),
      insuranceTypes: JSON.parse(bot.insuranceTypes),
    });
  } catch (error) {
    console.error("Error creating bot:", error);
    return NextResponse.json(
      { error: "Failed to create bot" },
      { status: 500 }
    );
  }
}
