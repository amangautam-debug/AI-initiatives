"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getSpeechRecognition, isSpeechRecognitionSupported } from "@/lib/speech";

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  confidenceThreshold?: number;
  minTranscriptLength?: number;
  onResult?: (transcript: string, isFinal: boolean, confidence: number) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  onStart?: () => void;
  debug?: boolean;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  lastConfidence: number;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = "en-IN",
    continuous = true,
    interimResults = true,
    confidenceThreshold = 0.3,
    minTranscriptLength = 2,
    onResult,
    onError,
    onEnd,
    onStart,
    debug = false,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastConfidence, setLastConfidence] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const lastStartTimeRef = useRef(0);
  const restartCountRef = useRef(0);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const log = useCallback((message: string, data?: unknown) => {
    if (debug) {
      const timestamp = new Date().toLocaleTimeString();
      console.log(`[Speech ${timestamp}] ${message}`, data ?? "");
    }
  }, [debug]);

  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  const stopListening = useCallback(() => {
    // Clear any pending restart
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      log("Stopping speech recognition");
      try {
        recognitionRef.current.abort(); // Use abort instead of stop for immediate halt
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    setInterimTranscript("");
  }, [log]);

  const startListening = useCallback(() => {
    // Prevent rapid restarts (debounce 500ms)
    const now = Date.now();
    if (now - lastStartTimeRef.current < 500) {
      log("Too soon to restart, debouncing");
      return;
    }

    // Prevent infinite restart loops
    if (restartCountRef.current > 5) {
      log("Too many restart attempts, cooling down");
      restartCountRef.current = 0;
      // Wait 2 seconds before allowing restart
      restartTimeoutRef.current = setTimeout(() => {
        restartCountRef.current = 0;
      }, 2000);
      return;
    }

    // Stop existing recognition first
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore
      }
      recognitionRef.current = null;
      isListeningRef.current = false;
    }

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) {
      onError?.("Speech recognition not supported");
      return;
    }

    lastStartTimeRef.current = now;
    restartCountRef.current++;
    log("Starting speech recognition", { language, continuous });

    const recognition = new SpeechRecognitionClass();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      log("Speech recognition ACTIVE");
      setIsListening(true);
      isListeningRef.current = true;
      restartCountRef.current = 0; // Reset on successful start
      onStart?.();
    };

    recognition.onaudiostart = () => {
      log("Microphone active");
    };

    recognition.onspeechstart = () => {
      log("User speaking...");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interim = "";
      let highestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence || 0.8;

        if (result.isFinal) {
          if (confidence >= confidenceThreshold && text.trim().length >= minTranscriptLength) {
            finalTranscript += text;
            highestConfidence = Math.max(highestConfidence, confidence);
            log(`✓ Accepted: "${text}" (${(confidence * 100).toFixed(0)}%)`);
          }
        } else {
          interim += text;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setLastConfidence(highestConfidence);
        onResult?.(finalTranscript.trim(), true, highestConfidence);
      }

      setInterimTranscript(interim);
      if (interim && interim.trim().length >= minTranscriptLength) {
        onResult?.(interim, false, 0);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      log(`Error: ${event.error}`);
      
      // Don't report aborted errors (they're intentional)
      if (event.error === "aborted") {
        setIsListening(false);
        isListeningRef.current = false;
        return;
      }

      // Handle specific errors
      if (event.error === "no-speech") {
        // Normal - user didn't speak
        log("No speech detected");
      } else {
        onError?.(event.error);
      }
      
      setIsListening(false);
      isListeningRef.current = false;
    };

    recognition.onend = () => {
      log("Speech recognition ended");
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript("");
      recognitionRef.current = null;
      onEnd?.();
    };

    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (e) {
      log("Failed to start", e);
      recognitionRef.current = null;
      isListeningRef.current = false;
    }
  }, [language, continuous, interimResults, confidenceThreshold, minTranscriptLength, onResult, onError, onEnd, onStart, log]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    lastConfidence,
  };
}
