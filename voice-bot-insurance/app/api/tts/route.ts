import { NextRequest, NextResponse } from "next/server";
import {
  generateSpeech,
  rateToString,
  pitchToString,
  volumeToString,
} from "@/lib/tts";

/**
 * Normalize text for natural speech output
 * Converts symbols, abbreviations, and special characters to speakable words
 */
function normalizeTextForSpeech(text: string): string {
  let normalized = text;

  // Convert Indian Rupee symbol to words
  normalized = normalized.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|lac|crore|cr)?/gi, (_, amount, unit) => {
    const cleanAmount = amount.replace(/,/g, '');
    if (unit) {
      return `${cleanAmount} ${unit} rupees`;
    }
    return `${cleanAmount} rupees`;
  });
  
  // Handle standalone ₹ symbol
  normalized = normalized.replace(/₹/g, 'rupees ');

  // Convert percentages
  normalized = normalized.replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent');

  // Convert common abbreviations
  normalized = normalized.replace(/\bLIC\b/g, 'L I C');
  normalized = normalized.replace(/\bHDFC\b/g, 'H D F C');
  normalized = normalized.replace(/\bICICI\b/g, 'I C I C I');
  normalized = normalized.replace(/\bSBI\b/g, 'S B I');
  normalized = normalized.replace(/\bEMI\b/g, 'E M I');
  normalized = normalized.replace(/\bGST\b/g, 'G S T');
  normalized = normalized.replace(/\bKYC\b/g, 'K Y C');
  normalized = normalized.replace(/\bPAN\b/g, 'pan card');
  normalized = normalized.replace(/\bOTP\b/g, 'O T P');
  normalized = normalized.replace(/\bTP\b/g, 'third party');
  normalized = normalized.replace(/\bIDV\b/g, 'I D V');
  normalized = normalized.replace(/\bNCB\b/g, 'no claim bonus');

  // Convert special characters
  normalized = normalized.replace(/&/g, ' and ');
  normalized = normalized.replace(/\+/g, ' plus ');
  normalized = normalized.replace(/@/g, ' at ');
  normalized = normalized.replace(/\//g, ' or ');
  normalized = normalized.replace(/\*/g, '');
  normalized = normalized.replace(/#/g, ' number ');

  // Convert number formats (1,00,000 -> 1 lakh style already handled above)
  // Handle "X to Y" ranges
  normalized = normalized.replace(/(\d+)\s*-\s*(\d+)/g, '$1 to $2');

  // Remove markdown-style formatting
  normalized = normalized.replace(/\*\*(.*?)\*\*/g, '$1');
  normalized = normalized.replace(/__(.*?)__/g, '$1');
  normalized = normalized.replace(/\*(.*?)\*/g, '$1');
  normalized = normalized.replace(/_(.*?)_/g, '$1');

  // Remove bullet points and list markers
  normalized = normalized.replace(/^[\s]*[-•]\s*/gm, '');
  normalized = normalized.replace(/^[\s]*\d+\.\s*/gm, '');

  // Clean up extra spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, voice, rate, pitch, volume } = body as {
      text: string;
      voice?: string;
      rate?: number;
      pitch?: number;
      volume?: number;
    };

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Normalize text for natural speech
    const normalizedText = normalizeTextForSpeech(text);

    // Convert numeric values to Edge TTS format
    const options = {
      voice: voice || "en-US-JennyNeural",
      rate: rate ? rateToString(rate) : undefined,
      pitch: pitch ? pitchToString(pitch) : undefined,
      volume: volume ? volumeToString(volume) : undefined,
    };

    // Generate speech with normalized text
    const audioBuffer = await generateSpeech(normalizedText, options);

    // Return audio as MP3
    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 }
    );
  }
}
