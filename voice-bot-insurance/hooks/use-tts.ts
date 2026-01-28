"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { VoiceSettings } from "@/lib/speech";

interface UseTTSOptions {
  voiceSettings: VoiceSettings;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseTTSReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isLoading: boolean;
}

export function useTTS(options: UseTTSOptions): UseTTSReturn {
  const { voiceSettings, onStart, onEnd, onError } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const speak = useCallback(
    async (text: string) => {
      // Cancel any ongoing speech
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      setIsLoading(true);

      try {
        // Generate speech from API
        const response = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: voiceSettings.voiceURI || "en-US-JennyNeural",
            rate: voiceSettings.rate,
            pitch: voiceSettings.pitch,
            volume: voiceSettings.volume,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate speech");
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioUrlRef.current = audioUrl;

        // Create and play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          setIsSpeaking(true);
          onStart?.();
        };

        audio.onended = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          onEnd?.();
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = null;
          }
          onError?.(new Error("Audio playback failed"));
        };

        await audio.play();
      } catch (error) {
        console.error("TTS error:", error);
        onError?.(error instanceof Error ? error : new Error("TTS failed"));
      } finally {
        setIsLoading(false);
      }
    },
    [voiceSettings, onStart, onEnd, onError]
  );

  const cancel = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }

    setIsSpeaking(false);
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isLoading,
  };
}
