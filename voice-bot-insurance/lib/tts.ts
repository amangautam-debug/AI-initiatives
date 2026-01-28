import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";

// Curated list of natural-sounding voices for insurance sales
// Focus on Indian voices for Indian market
export const PREMIUM_VOICES = [
  // Indian English - Female
  {
    id: "en-IN-NeerjaNeural",
    name: "Neerja",
    gender: "female" as const,
    locale: "en-IN",
    language: "English (India)",
    description: "Professional Indian female voice - clear and confident",
  },
  {
    id: "en-IN-NeerjaExpressiveNeural",
    name: "Neerja (Expressive)",
    gender: "female" as const,
    locale: "en-IN",
    language: "English (India)",
    description: "Expressive Indian female voice - warm and engaging",
  },
  // Indian English - Male
  {
    id: "en-IN-PrabhatNeural",
    name: "Prabhat",
    gender: "male" as const,
    locale: "en-IN",
    language: "English (India)",
    description: "Professional Indian male voice - trustworthy",
  },
  // Hindi - Female
  {
    id: "hi-IN-SwaraNeural",
    name: "Swara",
    gender: "female" as const,
    locale: "hi-IN",
    language: "Hindi",
    description: "Natural Hindi female voice - friendly and warm",
  },
  // Hindi - Male
  {
    id: "hi-IN-MadhurNeural",
    name: "Madhur",
    gender: "male" as const,
    locale: "hi-IN",
    language: "Hindi",
    description: "Natural Hindi male voice - professional",
  },
  // Tamil - Female
  {
    id: "ta-IN-PallaviNeural",
    name: "Pallavi",
    gender: "female" as const,
    locale: "ta-IN",
    language: "Tamil",
    description: "Natural Tamil female voice",
  },
  // Tamil - Male
  {
    id: "ta-IN-ValluvarNeural",
    name: "Valluvar",
    gender: "male" as const,
    locale: "ta-IN",
    language: "Tamil",
    description: "Natural Tamil male voice",
  },
  // Telugu - Female
  {
    id: "te-IN-ShrutiNeural",
    name: "Shruti",
    gender: "female" as const,
    locale: "te-IN",
    language: "Telugu",
    description: "Natural Telugu female voice",
  },
  // Telugu - Male
  {
    id: "te-IN-MohanNeural",
    name: "Mohan",
    gender: "male" as const,
    locale: "te-IN",
    language: "Telugu",
    description: "Natural Telugu male voice",
  },
  // Kannada - Female
  {
    id: "kn-IN-SapnaNeural",
    name: "Sapna",
    gender: "female" as const,
    locale: "kn-IN",
    language: "Kannada",
    description: "Natural Kannada female voice",
  },
  // Kannada - Male
  {
    id: "kn-IN-GaganNeural",
    name: "Gagan",
    gender: "male" as const,
    locale: "kn-IN",
    language: "Kannada",
    description: "Natural Kannada male voice",
  },
  // Malayalam - Female
  {
    id: "ml-IN-SobhanaNeural",
    name: "Sobhana",
    gender: "female" as const,
    locale: "ml-IN",
    language: "Malayalam",
    description: "Natural Malayalam female voice",
  },
  // Malayalam - Male
  {
    id: "ml-IN-MidhunNeural",
    name: "Midhun",
    gender: "male" as const,
    locale: "ml-IN",
    language: "Malayalam",
    description: "Natural Malayalam male voice",
  },
  // Marathi - Female
  {
    id: "mr-IN-AarohiNeural",
    name: "Aarohi",
    gender: "female" as const,
    locale: "mr-IN",
    language: "Marathi",
    description: "Natural Marathi female voice",
  },
  // Marathi - Male
  {
    id: "mr-IN-ManoharNeural",
    name: "Manohar",
    gender: "male" as const,
    locale: "mr-IN",
    language: "Marathi",
    description: "Natural Marathi male voice",
  },
  // Bengali - Female
  {
    id: "bn-IN-TanishaaNeural",
    name: "Tanishaa",
    gender: "female" as const,
    locale: "bn-IN",
    language: "Bengali",
    description: "Natural Bengali female voice",
  },
  // Bengali - Male
  {
    id: "bn-IN-BashkarNeural",
    name: "Bashkar",
    gender: "male" as const,
    locale: "bn-IN",
    language: "Bengali",
    description: "Natural Bengali male voice",
  },
  // Gujarati - Female
  {
    id: "gu-IN-DhwaniNeural",
    name: "Dhwani",
    gender: "female" as const,
    locale: "gu-IN",
    language: "Gujarati",
    description: "Natural Gujarati female voice",
  },
  // Gujarati - Male
  {
    id: "gu-IN-NiranjanNeural",
    name: "Niranjan",
    gender: "male" as const,
    locale: "gu-IN",
    language: "Gujarati",
    description: "Natural Gujarati male voice",
  },
  // Punjabi - Female
  {
    id: "pa-IN-GurpreetNeural",
    name: "Gurpreet",
    gender: "female" as const,
    locale: "pa-IN",
    language: "Punjabi",
    description: "Natural Punjabi female voice",
  },
];

// Language detection helpers
export const SUPPORTED_LANGUAGES = [
  { code: "en-IN", name: "English (India)", voiceId: "en-IN-NeerjaNeural" },
  { code: "hi-IN", name: "Hindi", voiceId: "hi-IN-SwaraNeural" },
  { code: "ta-IN", name: "Tamil", voiceId: "ta-IN-PallaviNeural" },
  { code: "te-IN", name: "Telugu", voiceId: "te-IN-ShrutiNeural" },
  { code: "kn-IN", name: "Kannada", voiceId: "kn-IN-SapnaNeural" },
  { code: "ml-IN", name: "Malayalam", voiceId: "ml-IN-SobhanaNeural" },
  { code: "mr-IN", name: "Marathi", voiceId: "mr-IN-AarohiNeural" },
  { code: "bn-IN", name: "Bengali", voiceId: "bn-IN-TanishaaNeural" },
  { code: "gu-IN", name: "Gujarati", voiceId: "gu-IN-DhwaniNeural" },
  { code: "pa-IN", name: "Punjabi", voiceId: "pa-IN-GurpreetNeural" },
];

export interface TTSOptions {
  voice: string;
  rate?: string; // e.g., "+0%", "-10%", "+20%"
  pitch?: string; // e.g., "+0Hz", "-5Hz", "+10Hz"
  volume?: string; // e.g., "+0%", "-20%"
}

/**
 * Generate speech audio using Edge TTS
 * Returns audio buffer in MP3 format
 */
export async function generateSpeech(
  text: string,
  options: TTSOptions
): Promise<Buffer> {
  const tts = new MsEdgeTTS();

  // Set voice - default to Indian English
  await tts.setMetadata(
    options.voice || "en-IN-NeerjaNeural",
    OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3
  );

  // Generate speech with prosody options
  const { audioStream } = tts.toStream(text, {
    rate: options.rate || "+0%",
    pitch: options.pitch || "+0Hz",
    volume: options.volume || "+0%",
  });

  // Collect chunks into buffer
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    audioStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    audioStream.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    audioStream.on("error", (error: Error) => {
      reject(error);
    });
  });
}

/**
 * Get voice by ID
 */
export function getVoiceById(voiceId: string) {
  return PREMIUM_VOICES.find((v) => v.id === voiceId);
}

/**
 * Get voices by gender
 */
export function getVoicesByGender(gender: "male" | "female") {
  return PREMIUM_VOICES.filter((v) => v.gender === gender);
}

/**
 * Get voices by locale
 */
export function getVoicesByLocale(locale: string) {
  return PREMIUM_VOICES.filter((v) => v.locale === locale);
}

/**
 * Get voices by language
 */
export function getVoicesByLanguage(language: string) {
  return PREMIUM_VOICES.filter((v) => 
    v.language.toLowerCase().includes(language.toLowerCase())
  );
}

/**
 * Get appropriate voice for a language code
 */
export function getVoiceForLanguage(langCode: string, preferredGender: "male" | "female" = "female"): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
  if (lang) {
    // Try to find preferred gender voice
    const voices = PREMIUM_VOICES.filter(v => v.locale === langCode);
    const preferredVoice = voices.find(v => v.gender === preferredGender);
    return preferredVoice?.id || lang.voiceId;
  }
  return "en-IN-NeerjaNeural"; // Default to Indian English
}

/**
 * Convert rate number (0.5-2) to Edge TTS rate string
 */
export function rateToString(rate: number): string {
  const percentage = Math.round((rate - 1) * 100);
  return `${percentage >= 0 ? "+" : ""}${percentage}%`;
}

/**
 * Convert pitch number (0.5-1.5) to Edge TTS pitch string
 */
export function pitchToString(pitch: number): string {
  const hz = Math.round((pitch - 1) * 50);
  return `${hz >= 0 ? "+" : ""}${hz}Hz`;
}

/**
 * Convert volume number (0-1) to Edge TTS volume string
 */
export function volumeToString(volume: number): string {
  const percentage = Math.round((volume - 1) * 100);
  return `${percentage >= 0 ? "+" : ""}${percentage}%`;
}
