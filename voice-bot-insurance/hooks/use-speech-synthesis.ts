"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  VoiceSettings,
  defaultVoiceSettings,
  speak,
  cancelSpeech,
  isSpeechSynthesisSupported,
  getAvailableVoices,
} from "@/lib/speech";

interface UseSpeechSynthesisOptions {
  voiceSettings?: VoiceSettings;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSettings, setVoiceSettingsState] = useState<VoiceSettings>(
    options.voiceSettings || defaultVoiceSettings
  );

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load voices on mount
  useEffect(() => {
    setIsSupported(isSpeechSynthesisSupported());

    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);

      // Set default voice if not set
      if (!voiceSettings.voiceURI && availableVoices.length > 0) {
        const englishVoice = availableVoices.find((v) => v.lang.startsWith("en"));
        if (englishVoice) {
          setVoiceSettingsState((prev) => ({
            ...prev,
            voiceURI: englishVoice.voiceURI,
          }));
        }
      }
    };

    // Voices may load asynchronously
    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [voiceSettings.voiceURI]);

  const speakText = useCallback(
    (text: string) => {
      // Cancel any ongoing speech
      cancelSpeech();
      setIsSpeaking(true);

      utteranceRef.current = speak(
        text,
        voiceSettings,
        () => {
          setIsSpeaking(false);
          onEnd?.();
        },
        (error) => {
          setIsSpeaking(false);
          onError?.(error);
        }
      );
    },
    [voiceSettings, onEnd, onError]
  );

  const cancel = useCallback(() => {
    cancelSpeech();
    setIsSpeaking(false);
  }, []);

  const setVoiceSettings = useCallback((settings: Partial<VoiceSettings>) => {
    setVoiceSettingsState((prev) => ({ ...prev, ...settings }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
    };
  }, []);

  return {
    speak: speakText,
    cancel,
    isSpeaking,
    isSupported,
    voices,
    voiceSettings,
    setVoiceSettings,
  };
}
