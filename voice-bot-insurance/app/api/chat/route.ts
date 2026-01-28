import { NextRequest, NextResponse } from "next/server";
import { getChatCompletion, ChatMessage } from "@/lib/llm";
import prisma from "@/lib/db";
import { getBotRAGContext, getBotRecommendationContext } from "@/lib/rag";

// Load bot configuration from database
async function loadBotConfiguration(botId: string): Promise<{
  systemPrompt: string;
} | null> {
  try {
    const bot = await prisma.voiceBot.findUnique({
      where: { id: botId },
    });

    if (!bot) return null;

    return {
      systemPrompt: bot.systemPrompt,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, systemPrompt, botId, conversationId, userLanguage, useRAG = true } = body as {
      messages: ChatMessage[];
      systemPrompt?: string;
      botId?: string;
      conversationId?: string;
      userLanguage?: string;
      useRAG?: boolean;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Load bot configuration if botId is provided
    const botConfig = botId ? await loadBotConfiguration(botId) : null;
    
    // Get knowledge base and recommendation context if RAG is enabled and botId is provided
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    const knowledgeContext = (useRAG && botId) ? await getBotRAGContext(botId, lastUserMessage) : "";
    const recommendationContext = (useRAG && botId) ? await getBotRecommendationContext(botId, lastUserMessage) : "";

    // Build the system prompt
    const defaultPrompt = `You are a helpful insurance assistant based in India. You help customers find the right insurance plans for their needs. Be friendly, professional, and concise in your responses.

CRITICAL SPEECH RULES (your responses will be spoken aloud):
- Write numbers in words when small (one, two, three) or use digits for larger numbers
- NEVER use special symbols like ₹, %, &, *, #, @ in your responses
- Instead of "₹12,000" say "twelve thousand rupees" or "12000 rupees"
- Instead of "50%" say "fifty percent"
- Instead of "₹5 Lakh" say "5 lakh rupees"
- Instead of "₹1 Crore" say "1 crore rupees"
- Spell out abbreviations: "LIC" as "L I C", "HDFC" as "H D F C"
- Keep sentences short and conversational
- Don't use bullet points, numbered lists, or markdown formatting
- Speak naturally as if you're having a phone conversation

LANGUAGE:
- Detect the language the customer is speaking and respond in the SAME language
- If they speak Hindi, respond completely in Hindi
- If they speak Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, or Punjabi, respond in that language only

Available insurance types: Health from Star Health and ICICI Lombard, Motor from HDFC ERGO and Bajaj Allianz, Life from LIC India, Home from HDFC ERGO and Bajaj Allianz.

When collecting user information, be conversational and don't ask for too much at once. Guide users through the process step by step. Ask one question at a time.`;

    // Priority: provided systemPrompt > bot's systemPrompt > default
    let prompt = systemPrompt || botConfig?.systemPrompt || defaultPrompt;

    // Add recommendation context from documents
    if (recommendationContext) {
      prompt += `\n\nRECOMMENDATION LOGIC (use this to suggest products):
${recommendationContext}`;
    }

    // Add knowledge base context if available
    if (knowledgeContext) {
      prompt += `\n\nKNOWLEDGE BASE (use this information to answer questions accurately):
${knowledgeContext}

IMPORTANT: When answering questions, prefer information from the knowledge base above. If the answer is in the knowledge base, use it. If not, use your general knowledge but mention you're providing general information.`;
    }

    // Get AI response with language context
    const result = await getChatCompletion(messages, prompt, userLanguage);

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
        const userMsg = messages[messages.length - 1];
        await prisma.message.createMany({
          data: [
            {
              conversationId: savedConversationId,
              role: userMsg.role,
              content: userMsg.content,
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
      detectedLanguage: result.detectedLanguage,
      voiceToUse: result.voiceToUse,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
