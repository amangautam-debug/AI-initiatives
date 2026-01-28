import TelegramBot from "node-telegram-bot-api";
import { getChatCompletion, ChatMessage } from "./llm";
import { getBotRAGContext, getBotRecommendationContext } from "./rag";
import prisma from "./db";
import OpenAI from "openai";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { Readable } from "stream";

// Telegram Bot Token from environment
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";

// OpenAI client for transcription
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Singleton bot instance
let botInstance: TelegramBot | null = null;

// In-memory conversation history (use Redis/DB in production)
const conversationHistory: Map<number, ChatMessage[]> = new Map();

// User preferences (voice mode on/off)
const userVoiceMode: Map<number, boolean> = new Map();

interface BotConfig {
  id: string;
  systemPrompt: string;
}

// Get the first active bot configuration
async function getActiveBotConfig(): Promise<BotConfig | null> {
  try {
    const bot = await prisma.voiceBot.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!bot) return null;

    return {
      id: bot.id,
      systemPrompt: bot.systemPrompt,
    };
  } catch {
    return null;
  }
}

// Build system prompt with config and RAG
async function buildSystemPrompt(userMessage: string): Promise<{ prompt: string; botId: string | null }> {
  const botConfig = await getActiveBotConfig();
  const knowledgeContext = botConfig ? await getBotRAGContext(botConfig.id, userMessage) : "";
  const recommendationContext = botConfig ? await getBotRecommendationContext(botConfig.id, userMessage) : "";

  const defaultPrompt = `You are a helpful insurance assistant based in India. You help customers find the right insurance plans for their needs. Be friendly, professional, and concise in your responses.

IMPORTANT RULES:
- Keep responses concise (under 200 words) for chat format
- Use simple language
- Don't use markdown formatting heavily
- Be conversational and helpful

LANGUAGE:
- Detect the language the customer is using and respond in the SAME language
- Support Hindi, English, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi

Available insurance types: Health, Motor, Life, Home from various Indian providers.`;

  let prompt = botConfig?.systemPrompt?.trim() ? botConfig.systemPrompt : defaultPrompt;

  // Add recommendation context from documents
  if (recommendationContext) {
    prompt += `\n\nRECOMMENDATION LOGIC:\n${recommendationContext}`;
  }

  // Add knowledge base context
  if (knowledgeContext) {
    prompt += `\n\nKNOWLEDGE BASE (use this to answer accurately):\n${knowledgeContext}`;
  }

  return { prompt, botId: botConfig?.id || null };
}

// Process incoming message
async function processMessage(chatId: number, text: string): Promise<string> {
  try {
    // Get or create conversation history
    let history = conversationHistory.get(chatId) || [];
    
    // Add user message to history
    history.push({ role: "user", content: text });
    
    // Keep only last 10 messages for context
    if (history.length > 10) {
      history = history.slice(-10);
    }
    conversationHistory.set(chatId, history);

    // Build system prompt with RAG
    const { prompt } = await buildSystemPrompt(text);

    // Get AI response
    const result = await getChatCompletion(history, prompt);

    // Add assistant response to history
    history.push({ role: "assistant", content: result.message });
    conversationHistory.set(chatId, history);

    return result.message;
  } catch (error) {
    console.error("[Telegram] Error processing message:", error);
    return "Sorry, I encountered an error. Please try again.";
  }
}

// Download file from Telegram
async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  if (!botInstance) throw new Error("Bot not initialized");
  
  const file = await botInstance.getFile(fileId);
  const filePath = file.file_path;
  
  if (!filePath) throw new Error("File path not found");
  
  const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
  
  const response = await fetch(fileUrl);
  const arrayBuffer = await response.arrayBuffer();
  
  return Buffer.from(arrayBuffer);
}

// Transcribe voice message using OpenAI Whisper
async function transcribeVoice(audioBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    // Determine file extension from mime type
    let extension = "ogg";
    if (mimeType.includes("mpeg")) extension = "mp3";
    else if (mimeType.includes("wav")) extension = "wav";
    else if (mimeType.includes("ogg")) extension = "ogg";
    
    // Create a File object for OpenAI using Uint8Array
    const uint8Array = new Uint8Array(audioBuffer);
    const file = new File([uint8Array], `voice.${extension}`, { type: mimeType });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });
    
    console.log("[Telegram] Transcribed:", transcription.text);
    return transcription.text;
  } catch (error) {
    console.error("[Telegram] Transcription error:", error);
    throw error;
  }
}

// Generate voice message using Edge TTS
async function generateVoiceMessage(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  
  // Use Indian English voice
  await tts.setMetadata("hi-IN-SwaraNeural", OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  
  const { audioStream } = await tts.toStream(text);
  
  // Convert stream to buffer
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    (audioStream as Readable).on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    (audioStream as Readable).on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    
    (audioStream as Readable).on("error", reject);
  });
}

// Initialize the bot with polling (for development)
export function initTelegramBot(): TelegramBot | null {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("[Telegram] Bot token not configured. Set TELEGRAM_BOT_TOKEN in .env");
    return null;
  }

  if (botInstance) {
    return botInstance;
  }

  try {
    botInstance = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

    console.log("[Telegram] Bot initialized with polling");

    // Handle /start command
    botInstance.onText(/\/start/, async (msg) => {
      const chatId = msg.chat.id;
      const firstName = msg.from?.first_name || "there";
      
      // Clear conversation history
      conversationHistory.delete(chatId);
      
      const welcomeMessage = `🙏 Namaste ${firstName}!

Welcome to InsureBot - your AI insurance assistant.

I can help you with:
• Finding the right insurance plan
• Understanding policy details
• Comparing different options
• Answering your insurance questions

🎤 *Voice Messages Supported!*
Send me a voice message and I'll respond with voice too!

Type /help for available commands.`;

      await botInstance?.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
    });

    // Handle /help command
    botInstance.onText(/\/help/, async (msg) => {
      const chatId = msg.chat.id;
      
      const helpMessage = `📋 *Available Commands*

/start - Start a new conversation
/help - Show this help message
/clear - Clear conversation history
/voice - Toggle voice response mode

💬 *How to use*
• Type your questions naturally
• Or send a voice message! 🎤

🎙️ *Voice Mode*
Send a voice message and I'll reply with voice!

🌐 *Supported Languages*
English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi`;

      await botInstance?.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
    });

    // Handle /clear command
    botInstance.onText(/\/clear/, async (msg) => {
      const chatId = msg.chat.id;
      conversationHistory.delete(chatId);
      await botInstance?.sendMessage(chatId, "✅ Conversation history cleared. Let's start fresh!");
    });

    // Handle /voice command - toggle voice mode
    botInstance.onText(/\/voice/, async (msg) => {
      const chatId = msg.chat.id;
      const currentMode = userVoiceMode.get(chatId) ?? true;
      userVoiceMode.set(chatId, !currentMode);
      
      if (!currentMode) {
        await botInstance?.sendMessage(chatId, "🔊 Voice mode enabled! I'll respond with voice messages.");
      } else {
        await botInstance?.sendMessage(chatId, "📝 Voice mode disabled. I'll respond with text only.");
      }
    });

    // Handle voice messages
    botInstance.on("voice", async (msg) => {
      const chatId = msg.chat.id;
      const voice = msg.voice;
      
      console.log("[Telegram] Received voice message from", chatId);
      
      if (!voice) {
        console.log("[Telegram] No voice data in message");
        return;
      }
      
      try {
        console.log("[Telegram] Voice file_id:", voice.file_id, "duration:", voice.duration);
        
        // Show recording action
        await botInstance?.sendChatAction(chatId, "record_voice");
        
        // Download voice file
        console.log("[Telegram] Downloading voice file...");
        const audioBuffer = await downloadTelegramFile(voice.file_id);
        console.log("[Telegram] Downloaded", audioBuffer.length, "bytes");
        
        // Transcribe
        console.log("[Telegram] Transcribing...");
        const transcribedText = await transcribeVoice(audioBuffer, voice.mime_type || "audio/ogg");
        console.log("[Telegram] Transcription result:", transcribedText);
        
        if (!transcribedText || transcribedText.trim().length === 0) {
          await botInstance?.sendMessage(chatId, "Sorry, I couldn't understand that. Please try again.");
          return;
        }
        
        // Show typing indicator
        await botInstance?.sendChatAction(chatId, "typing");
        
        // Process message
        const response = await processMessage(chatId, transcribedText);
        
        // Check if user wants voice response
        const voiceMode = userVoiceMode.get(chatId) ?? true;
        
        if (voiceMode) {
          // Generate and send voice response
          await botInstance?.sendChatAction(chatId, "upload_voice");
          
          try {
            const voiceBuffer = await generateVoiceMessage(response);
            
            // Send as audio file (MP3 format from Edge TTS)
            await botInstance?.sendAudio(chatId, voiceBuffer, {
              title: "Voice Response",
              performer: "InsureBot",
            }, {
              filename: "response.mp3",
              contentType: "audio/mpeg",
            });
            
            // Also send text for reference
            await botInstance?.sendMessage(chatId, `📝 ${response}`);
          } catch (ttsError) {
            console.error("[Telegram] TTS error:", ttsError);
            // Fallback to text
            await botInstance?.sendMessage(chatId, response);
          }
        } else {
          // Send text response
          await botInstance?.sendMessage(chatId, `🎤 You said: "${transcribedText}"\n\n${response}`);
        }
        
      } catch (error) {
        console.error("[Telegram] Voice processing error:", error);
        await botInstance?.sendMessage(chatId, "Sorry, I had trouble processing your voice message. Please try again or send a text message.");
      }
    });

    // Handle regular text messages
    botInstance.on("message", async (msg) => {
      // Skip commands and voice messages
      if (msg.text?.startsWith("/")) return;
      if (msg.voice) return;
      
      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) {
        return;
      }

      // Show typing indicator
      await botInstance?.sendChatAction(chatId, "typing");

      // Process message and get response
      const response = await processMessage(chatId, text);

      // Send response
      await botInstance?.sendMessage(chatId, response);
    });

    // Handle errors
    botInstance.on("polling_error", (error) => {
      console.error("[Telegram] Polling error:", error.message);
    });

    return botInstance;
  } catch (error) {
    console.error("[Telegram] Failed to initialize bot:", error);
    return null;
  }
}

// Stop the bot
export function stopTelegramBot(): void {
  if (botInstance) {
    botInstance.stopPolling();
    botInstance = null;
    console.log("[Telegram] Bot stopped");
  }
}

// Get bot instance
export function getTelegramBot(): TelegramBot | null {
  return botInstance;
}

// Webhook handler for production (alternative to polling)
export async function handleTelegramWebhook(update: TelegramBot.Update): Promise<void> {
  if (!botInstance) {
    console.error("[Telegram] Bot not initialized");
    return;
  }

  const message = update.message;
  if (!message) return;

  const chatId = message.chat.id;

  // Handle voice messages
  if (message.voice) {
    try {
      await botInstance.sendChatAction(chatId, "record_voice");
      
      const audioBuffer = await downloadTelegramFile(message.voice.file_id);
      const transcribedText = await transcribeVoice(audioBuffer, message.voice.mime_type || "audio/ogg");
      
      if (!transcribedText) {
        await botInstance.sendMessage(chatId, "Sorry, I couldn't understand that.");
        return;
      }
      
      await botInstance.sendChatAction(chatId, "typing");
      const response = await processMessage(chatId, transcribedText);
      
      const voiceMode = userVoiceMode.get(chatId) ?? true;
      
      if (voiceMode) {
        try {
          const voiceBuffer = await generateVoiceMessage(response);
          await botInstance.sendVoice(chatId, voiceBuffer);
        } catch {
          await botInstance.sendMessage(chatId, response);
        }
      } else {
        await botInstance.sendMessage(chatId, response);
      }
    } catch (error) {
      console.error("[Telegram] Voice webhook error:", error);
      await botInstance.sendMessage(chatId, "Error processing voice message.");
    }
    return;
  }

  // Handle text messages
  const text = message.text;
  if (!text) return;

  // Handle commands
  if (text === "/start") {
    conversationHistory.delete(chatId);
    const firstName = message.from?.first_name || "there";
    await botInstance.sendMessage(chatId, `🙏 Namaste ${firstName}! Welcome to InsureBot. Send text or voice messages!`);
    return;
  }

  if (text === "/clear") {
    conversationHistory.delete(chatId);
    await botInstance.sendMessage(chatId, "✅ Conversation cleared!");
    return;
  }

  if (text === "/voice") {
    const currentMode = userVoiceMode.get(chatId) ?? true;
    userVoiceMode.set(chatId, !currentMode);
    await botInstance.sendMessage(chatId, !currentMode ? "🔊 Voice mode ON" : "📝 Voice mode OFF");
    return;
  }

  if (text.startsWith("/")) return;

  // Process regular message
  await botInstance.sendChatAction(chatId, "typing");
  const response = await processMessage(chatId, text);
  await botInstance.sendMessage(chatId, response);
}
