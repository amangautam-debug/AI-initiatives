// Web Speech API Types and Utilities

export interface VoiceSettings {
  voiceURI: string;
  rate: number;      // 0.5 - 2
  pitch: number;     // 0 - 2
  volume: number;    // 0 - 1
  language: string;  // en-US, en-GB, etc.
}

export const defaultVoiceSettings: VoiceSettings = {
  voiceURI: "",
  rate: 1,
  pitch: 1,
  volume: 1,
  language: "en-US",
};

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

// Check if Web Speech API is supported
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

// Get the SpeechRecognition constructor
export function getSpeechRecognition(): typeof SpeechRecognition | null {
  if (typeof window === "undefined") return null;
  return (
    (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ||
    (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition ||
    null
  );
}

// Get all available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

// Get voices by language
export function getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
  const voices = getAvailableVoices();
  return voices.filter((voice) => voice.lang.startsWith(language));
}

// Speak text using speech synthesis
export function speak(
  text: string,
  settings: VoiceSettings,
  onEnd?: () => void,
  onError?: (error: Error) => void
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported()) {
    onError?.(new Error("Speech synthesis not supported"));
    return null;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Find the voice by URI
  const voices = getAvailableVoices();
  const selectedVoice = voices.find((v) => v.voiceURI === settings.voiceURI);
  
  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }
  
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  utterance.lang = settings.language;

  utterance.onend = () => onEnd?.();
  utterance.onerror = (event) => onError?.(new Error(event.error));

  window.speechSynthesis.speak(utterance);
  return utterance;
}

// Cancel any ongoing speech
export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

// Pause speech
export function pauseSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
}

// Resume speech
export function resumeSpeech(): void {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
}

// Check if currently speaking
export function isSpeaking(): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  return window.speechSynthesis.speaking;
}
