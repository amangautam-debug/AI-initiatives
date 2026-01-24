import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET single bot
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bot = await prisma.voiceBot.findUnique({
      where: { id },
    });

    if (!bot) {
      return NextResponse.json({ error: "Bot not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...bot,
      voiceSettings: JSON.parse(bot.voiceSettings),
      insuranceTypes: JSON.parse(bot.insuranceTypes),
    });
  } catch (error) {
    console.error("Error fetching bot:", error);
    return NextResponse.json(
      { error: "Failed to fetch bot" },
      { status: 500 }
    );
  }
}

// PUT update bot
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      description,
      voiceId,
      voiceSettings,
      systemPrompt,
      greetingMessage,
      insuranceTypes,
      isActive,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (voiceId !== undefined) updateData.voiceId = voiceId;
    if (voiceSettings !== undefined)
      updateData.voiceSettings = JSON.stringify(voiceSettings);
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (greetingMessage !== undefined)
      updateData.greetingMessage = greetingMessage;
    if (insuranceTypes !== undefined)
      updateData.insuranceTypes = JSON.stringify(insuranceTypes);
    if (isActive !== undefined) updateData.isActive = isActive;

    const bot = await prisma.voiceBot.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...bot,
      voiceSettings: JSON.parse(bot.voiceSettings),
      insuranceTypes: JSON.parse(bot.insuranceTypes),
    });
  } catch (error) {
    console.error("Error updating bot:", error);
    return NextResponse.json(
      { error: "Failed to update bot" },
      { status: 500 }
    );
  }
}

// DELETE bot
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.voiceBot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bot:", error);
    return NextResponse.json(
      { error: "Failed to delete bot" },
      { status: 500 }
    );
  }
}
