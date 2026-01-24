import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, ChatMessage } from "@/lib/llm";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt, botId, conversationId } = body as {
      messages: ChatMessage[];
      systemPrompt: string;
      botId: string;
      conversationId?: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Default system prompt if not provided
    const defaultPrompt = `You are a helpful insurance assistant. You help customers find the right insurance plans for their needs. Be friendly, professional, and concise in your responses. Ask clarifying questions when needed to provide accurate recommendations.

Available insurance types: Health, Auto, Life, Home.

When collecting user information, be conversational and don't ask for too much at once. Guide users through the process step by step.`;

    const prompt = systemPrompt || defaultPrompt;

    // Get AI response
    const result = await getChatCompletion(messages, prompt);

    // Store conversation in database (optional, for analytics)
    let savedConversationId = conversationId;
    
    try {
      if (!conversationId && botId) {
        // Create new conversation
        const conversation = await prisma.conversation.create({
          data: {
            botId,
            status: "active",
          },
        });
        savedConversationId = conversation.id;
      }

      // Save messages
      if (savedConversationId) {
        const lastUserMessage = messages[messages.length - 1];
        await prisma.message.createMany({
          data: [
            {
              conversationId: savedConversationId,
              role: lastUserMessage.role,
              content: lastUserMessage.content,
            },
            {
              conversationId: savedConversationId,
              role: "assistant",
              content: result.message,
            },
          ],
        });
      }
    } catch (dbError) {
      // Log but don't fail the request if DB operations fail
      console.error("Database error:", dbError);
    }

    return NextResponse.json({
      message: result.message,
      functionResults: result.functionResults,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
