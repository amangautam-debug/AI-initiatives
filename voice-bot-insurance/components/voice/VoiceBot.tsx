"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2, FileText, X, Settings, Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Supported Indian languages with their codes and names
const SUPPORTED_LANGUAGES = [
  { code: "auto", name: "Auto-detect", nativeName: "🔄 Auto" },
  { code: "en-IN", name: "English", nativeName: "English" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिंदी" },
  { code: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "ta-IN", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te-IN", name: "Telugu", nativeName: "తెలుగు" },
  { code: "ml-IN", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "mr-IN", name: "Marathi", nativeName: "मराठी" },
  { code: "bn-IN", name: "Bengali", nativeName: "বাংলা" },
  { code: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
];

// Language detection patterns (Unicode ranges and common words)
const LANGUAGE_PATTERNS: { code: string; patterns: RegExp[] }[] = [
  { code: "hi-IN", patterns: [/[\u0900-\u097F]/, /\b(kya|hai|hain|aap|mujhe|chahiye|kaise|nahi|haan|theek|dhanyavaad)\b/i] },
  { code: "kn-IN", patterns: [/[\u0C80-\u0CFF]/] },
  { code: "ta-IN", patterns: [/[\u0B80-\u0BFF]/] },
  { code: "te-IN", patterns: [/[\u0C00-\u0C7F]/] },
  { code: "ml-IN", patterns: [/[\u0D00-\u0D7F]/] },
  { code: "mr-IN", patterns: [/[\u0900-\u097F]/, /\b(aahe|nahi|kay|kasa|mala|tumhi)\b/i] },
  { code: "bn-IN", patterns: [/[\u0980-\u09FF]/] },
  { code: "gu-IN", patterns: [/[\u0A80-\u0AFF]/] },
  { code: "pa-IN", patterns: [/[\u0A00-\u0A7F]/] },
];

// Detect language from text
function detectLanguageFromText(text: string): string | null {
  for (const { code, patterns } of LANGUAGE_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return code;
      }
    }
  }
  return null; // Default to English if no pattern matches
}
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useVoiceActivity } from "@/hooks/use-voice-activity";
import { VoiceSettings } from "@/lib/speech";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  type: "info" | "speech" | "tts" | "api" | "error" | "interrupt" | "vad";
  message: string;
}

interface VoiceBotProps {
  botId: string;
  botName: string;
  voiceSettings: VoiceSettings;
  systemPrompt: string;
  greetingMessage: string;
  onConversationEnd?: (messages: Message[]) => void;
}

export function VoiceBot({
  botId,
  botName,
  voiceSettings,
  systemPrompt,
  greetingMessage,
  onConversationEnd,
}: VoiceBotProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("en-IN");
  const [showTranscript, setShowTranscript] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [micLevel, setMicLevel] = useState(0);
  const [rawMicLevel, setRawMicLevel] = useState(0);
  
  // VAD settings (adjustable)
  const [vadThreshold, setVadThreshold] = useState(0.12);
  const [vadFrames, setVadFrames] = useState(10);
  const [vadGracePeriod, setVadGracePeriod] = useState(1500);
  const [vadCooldown, setVadCooldown] = useState(3000);
  
  // Fast mode - uses browser TTS (instant but less natural)
  const [fastMode, setFastMode] = useState(false);
  
  // Selected language for speech recognition (auto = auto-detect)
  const [selectedLanguage, setSelectedLanguage] = useState<string>("auto");
  // Actual language being used (detected or selected)
  const [activeLanguage, setActiveLanguage] = useState<string>("en-IN");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasProcessedRef = useRef<string | null>(null);
  
  // Use refs for state that callbacks need
  const stateRef = useRef({
    isCallActive: false,
    isMuted: false,
    isSpeaking: false,
    isProcessing: false,
  });

  // Update refs when state changes
  useEffect(() => {
    stateRef.current.isCallActive = isCallActive;
    stateRef.current.isMuted = isMuted;
    stateRef.current.isSpeaking = isSpeaking;
    stateRef.current.isProcessing = isProcessing;
  }, [isCallActive, isMuted, isSpeaking, isProcessing]);

  // Logging function - stable reference
  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev.slice(-100), {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      type,
      message,
    }]);
    console.log(`[VoiceBot ${type.toUpperCase()}] ${message}`);
  }, []);

  // Cancel speech and start listening
  const cancelSpeech = useCallback(() => {
    addLog("interrupt", "🛑 Stopping bot");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
    setIsTTSLoading(false);
    
    // Start listening after interrupt
    if (stateRef.current.isCallActive && !stateRef.current.isMuted) {
      addLog("info", "Starting listener after interrupt");
      setTimeout(() => {
        if (!stateRef.current.isSpeaking && !stateRef.current.isProcessing) {
          startListeningRef.current();
        }
      }, 500);
    }
  }, [addLog]);

  // Track when audio started to ignore VAD briefly
  const audioStartTimeRef = useRef<number>(0);
  const lastInterruptTimeRef = useRef<number>(0);

  // VAD settings refs for callbacks
  const vadGracePeriodRef = useRef(vadGracePeriod);
  const vadCooldownRef = useRef(vadCooldown);
  useEffect(() => {
    vadGracePeriodRef.current = vadGracePeriod;
    vadCooldownRef.current = vadCooldown;
  }, [vadGracePeriod, vadCooldown]);

  // Voice Activity Detection
  const {
    isActive: isVoiceActive,
    start: startVAD,
    stop: stopVAD,
    rawLevel,
    updateSettings: updateVADSettings,
  } = useVoiceActivity({
    threshold: vadThreshold,
    consecutiveFrames: vadFrames,
    debug: false,
    onVoiceStart: () => {
      // Only trigger interrupt when bot is actually speaking
      if (!stateRef.current.isSpeaking) {
        return;
      }
      
      const now = Date.now();
      
      // Ignore VAD based on grace period setting
      if (now - audioStartTimeRef.current < vadGracePeriodRef.current) {
        addLog("vad", `Ignored (grace: ${vadGracePeriodRef.current}ms)`);
        return;
      }
      
      // Prevent rapid re-interrupts based on cooldown setting
      if (now - lastInterruptTimeRef.current < vadCooldownRef.current) {
        addLog("vad", `Ignored (cooldown: ${vadCooldownRef.current}ms)`);
        return;
      }
      
      addLog("vad", "🎙️ Voice detected - interrupting");
      lastInterruptTimeRef.current = now;
      addLog("interrupt", ">>> VOICE INTERRUPT <<<");
      cancelSpeech();
    },
    onLevelChange: (level) => {
      setMicLevel(level);
    },
  });

  // Update VAD settings when sliders change
  useEffect(() => {
    updateVADSettings({ threshold: vadThreshold, consecutiveFrames: vadFrames });
  }, [vadThreshold, vadFrames, updateVADSettings]);

  // Update raw level
  useEffect(() => {
    setRawMicLevel(rawLevel);
  }, [rawLevel]);

  // Get voice for language - maps language codes to Edge TTS voices
  const getVoiceForLanguage = useCallback((langCode: string): string => {
    const voiceMap: Record<string, string> = {
      "en-IN": "en-IN-NeerjaNeural",
      "hi-IN": "hi-IN-SwaraNeural",
      "kn-IN": "kn-IN-SapnaNeural",
      "ta-IN": "ta-IN-PallaviNeural",
      "te-IN": "te-IN-ShrutiNeural",
      "ml-IN": "ml-IN-SobhanaNeural",
      "mr-IN": "mr-IN-AarohiNeural",
      "bn-IN": "bn-IN-TanishaaNeural",
      "gu-IN": "gu-IN-DhwaniNeural",
      "pa-IN": "pa-IN-GurpreetNeural",
    };
    return voiceMap[langCode] || voiceSettings.voiceURI || "en-IN-NeerjaNeural";
  }, [voiceSettings.voiceURI]);

  // Refs to store function references for speech recognition callbacks
  const handleUserMessageRef = useRef<(transcript: string) => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});

  // Track speech recognition state
  const speechRestartCountRef = useRef(0);
  const lastSpeechTimeRef = useRef(0);
  const hasLoggedListeningRef = useRef(false);

  // Speech recognition
  const {
    isListening,
    isSupported: isRecognitionSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: activeLanguage, // Use active language for speech recognition
    confidenceThreshold: 0.3,
    minTranscriptLength: 2,
    debug: false,
    onStart: () => {
      // Always log when speech recognition starts (for debugging)
      const langName = SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.name || activeLanguage;
      const autoTag = selectedLanguage === "auto" ? " [Auto]" : "";
      addLog("speech", `🎤 Listening (${langName}${autoTag})...`);
      hasLoggedListeningRef.current = true;
      speechRestartCountRef.current = 0; // Reset on successful start
    },
    onResult: (transcript, isFinal, confidence) => {
      if (isFinal) {
        addLog("speech", `✓ "${transcript}" (${(confidence * 100).toFixed(0)}%)`);
        lastSpeechTimeRef.current = Date.now();
        hasLoggedListeningRef.current = false; // Log again after speech
        handleUserMessageRef.current(transcript);
      } else {
        setCurrentTranscript(transcript);
      }
    },
    onError: (error) => {
      if (error === "no-speech") {
        // Normal - just no speech detected, will restart
      } else if (error !== "aborted") {
        addLog("error", `Speech error: ${error}`);
      }
    },
    onEnd: () => {
      const { isCallActive, isMuted, isSpeaking, isProcessing } = stateRef.current;
      
      // Don't restart if we shouldn't be listening
      if (!isCallActive || isMuted || isSpeaking || isProcessing) {
        return;
      }
      
      // Limit restarts to prevent infinite loop
      speechRestartCountRef.current++;
      if (speechRestartCountRef.current > 20) {
        // Too many restarts - wait longer
        addLog("speech", `Pausing (${speechRestartCountRef.current} restarts)`);
        setTimeout(() => {
          speechRestartCountRef.current = 0;
          if (stateRef.current.isCallActive && !stateRef.current.isMuted && 
              !stateRef.current.isSpeaking && !stateRef.current.isProcessing) {
            startListeningRef.current();
          }
        }, 3000);
        return;
      }
      
      // Normal restart with delay
      setTimeout(() => {
        if (stateRef.current.isCallActive && !stateRef.current.isMuted && 
            !stateRef.current.isSpeaking && !stateRef.current.isProcessing) {
          startListeningRef.current();
        }
      }, 500);
    },
  });

  // Update refs
  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  // Browser TTS (fast mode) - uses native speechSynthesis
  const speakWithBrowserTTS = useCallback((text: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve(false);
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = activeLanguage; // Set the language
      utterance.rate = voiceSettings.rate || 1;
      utterance.pitch = voiceSettings.pitch || 1;
      utterance.volume = voiceSettings.volume || 1;
      
      // Try to find a voice matching the active language
      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(v => v.lang === activeLanguage || v.lang.startsWith(activeLanguage.split('-')[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        addLog("tts", "🔊 Playing (fast)");
        setIsTTSLoading(false);
        setIsSpeaking(true);
        audioStartTimeRef.current = Date.now();
      };

      utterance.onend = () => {
        addLog("tts", "🔊 Done");
        setIsSpeaking(false);
        
        const { isCallActive, isMuted } = stateRef.current;
        if (isCallActive && !isMuted) {
          hasLoggedListeningRef.current = false;
          setTimeout(() => {
            addLog("info", "Starting speech recognition...");
            startListeningRef.current();
          }, 200);
        }
        resolve(true);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsTTSLoading(false);
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [voiceSettings, activeLanguage, addLog]);

  // Edge TTS (high quality mode)
  const speakWithEdgeTTS = useCallback(async (text: string, voiceOverride?: string): Promise<boolean> => {
    try {
      // Use active language for voice
      const voiceToUse = voiceOverride || getVoiceForLanguage(activeLanguage);
      
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice: voiceToUse,
          rate: voiceSettings.rate,
          pitch: voiceSettings.pitch,
          volume: voiceSettings.volume,
        }),
      });

      if (!response.ok) throw new Error(`TTS: ${response.status}`);

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      return new Promise((resolve) => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onplay = () => {
          addLog("tts", "🔊 Playing");
          setIsTTSLoading(false);
          setIsSpeaking(true);
          audioStartTimeRef.current = Date.now();
        };

        audio.onended = () => {
          addLog("tts", "🔊 Done");
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          
          const { isCallActive, isMuted } = stateRef.current;
          if (isCallActive && !isMuted) {
            hasLoggedListeningRef.current = false;
            setTimeout(() => {
              addLog("info", "Starting speech recognition...");
              startListeningRef.current();
            }, 200);
          }
          resolve(true);
        };

        audio.onerror = () => {
          setIsSpeaking(false);
          setIsTTSLoading(false);
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        };

        audio.play().catch(() => {
          setIsTTSLoading(false);
          setIsSpeaking(false);
          resolve(false);
        });
      });
    } catch (error) {
      addLog("error", `TTS: ${error}`);
      return false;
    }
  }, [voiceSettings, activeLanguage, getVoiceForLanguage, addLog]);

  // Main speak function - chooses between fast and quality mode
  const speak = useCallback(async (text: string, voiceOverride?: string): Promise<boolean> => {
    const truncatedText = text.length > 40 ? text.substring(0, 40) + "..." : text;
    addLog("tts", `🔊 "${truncatedText}"`);
    setIsTTSLoading(true);
    stopListening();
    
    if (fastMode) {
      // Fast mode - browser TTS (instant)
      return speakWithBrowserTTS(text);
    } else {
      // Quality mode - Edge TTS (better voice)
      return speakWithEdgeTTS(text, voiceOverride);
    }
  }, [fastMode, speakWithBrowserTTS, speakWithEdgeTTS, addLog, stopListening]);

  // Handle user message
  const handleUserMessage = useCallback(async (transcript: string) => {
    const trimmed = transcript.trim();
    if (!trimmed || hasProcessedRef.current === trimmed || stateRef.current.isProcessing) {
      return;
    }

    hasProcessedRef.current = trimmed;
    setIsProcessing(true);
    setCurrentTranscript("");
    stopListening();
    
    // Auto-detect language from transcript if in auto mode
    if (selectedLanguage === "auto") {
      const detectedLang = detectLanguageFromText(trimmed);
      if (detectedLang && detectedLang !== activeLanguage) {
        const langName = SUPPORTED_LANGUAGES.find(l => l.code === detectedLang)?.name;
        addLog("info", `🌐 Detected: ${langName}`);
        setActiveLanguage(detectedLang);
        setDetectedLanguage(detectedLang);
      }
    }
    
    addLog("info", `📤 "${trimmed}"`);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          systemPrompt,
          botId,
          conversationId: conversationIdRef.current,
          userLanguage: detectedLanguage,
        }),
      });

      const data = await response.json();
      addLog("api", `📥 "${data.message?.substring(0, 40)}..."`);

      if (data.conversationId) conversationIdRef.current = data.conversationId;
      
      // Update language from API response if in auto mode
      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
        if (selectedLanguage === "auto" && data.detectedLanguage !== activeLanguage) {
          const langName = SUPPORTED_LANGUAGES.find(l => l.code === data.detectedLanguage)?.name;
          addLog("info", `🌐 Switching to: ${langName}`);
          setActiveLanguage(data.detectedLanguage);
        }
      }

      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      }]);

      setIsProcessing(false);
      hasProcessedRef.current = null;

      await speak(data.message, data.voiceToUse);
      
    } catch (error) {
      addLog("error", `API: ${error}`);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, please try again.",
        timestamp: new Date(),
      }]);
      setIsProcessing(false);
      hasProcessedRef.current = null;
      
      if (stateRef.current.isCallActive && !stateRef.current.isMuted) {
        setTimeout(() => startListeningRef.current(), 300);
      }
    }
  }, [messages, systemPrompt, botId, speak, detectedLanguage, selectedLanguage, activeLanguage, addLog, stopListening]);

  // Update handler ref
  useEffect(() => {
    handleUserMessageRef.current = handleUserMessage;
  }, [handleUserMessage]);

  // Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Start call
  const startCall = useCallback(async () => {
    addLog("info", "══════ CALL STARTED ══════");
    
    setIsCallActive(true);
    setMessages([]);
    setLogs([]);
    conversationIdRef.current = null;
    hasProcessedRef.current = null;
    hasLoggedListeningRef.current = false;
    speechRestartCountRef.current = 0;

    const vadStarted = await startVAD();
    addLog("vad", vadStarted ? "✓ VAD active" : "✗ VAD failed");

    const greeting: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: greetingMessage,
      timestamp: new Date(),
    };
    setMessages([greeting]);
    
    await speak(greetingMessage);
  }, [greetingMessage, speak, startVAD, addLog]);

  // End call
  const endCall = useCallback(() => {
    addLog("info", "══════ CALL ENDED ══════");
    
    setIsCallActive(false);
    stopListening();
    stopVAD();
    cancelSpeech();
    setCurrentTranscript("");
    setIsProcessing(false);
    hasProcessedRef.current = null;
    hasLoggedListeningRef.current = false;
    speechRestartCountRef.current = 0;
    onConversationEnd?.(messages);
  }, [stopListening, stopVAD, cancelSpeech, messages, onConversationEnd, addLog]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      addLog("info", "🎤 Unmuted");
      setIsMuted(false);
      startVAD();
      startListening();
    } else {
      addLog("info", "🔇 Muted");
      setIsMuted(true);
      stopListening();
      stopVAD();
    }
  }, [isMuted, startVAD, stopVAD, startListening, stopListening, addLog]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      stopVAD();
    };
  }, [stopVAD]);

  if (!isRecognitionSupported) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Use Chrome or Edge for voice features.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex gap-4 max-w-6xl mx-auto">
      <Card className="flex-1 max-w-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isCallActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )} />
              <CardTitle>{botName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isCallActive && (
                <>
                  <Badge 
                    variant="outline" 
                    className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setShowSettings(true)}
                    title="Click to change language"
                  >
                    {selectedLanguage === "auto" ? "🔄" : "🌐"} {SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.nativeName || "English"}
                    {selectedLanguage === "auto" && <span className="ml-1 text-[10px] opacity-70">(auto)</span>}
                  </Badge>
                  <Badge 
                    variant={isListening ? "default" : isSpeaking ? "secondary" : "outline"}
                    className={cn(
                      isListening && "bg-green-600",
                      isSpeaking && isVoiceActive && "bg-orange-500"
                    )}
                  >
                    {isProcessing ? "🤔 Thinking" :
                     isTTSLoading ? "⏳ Loading" :
                     isSpeaking && isVoiceActive ? "🛑 Interrupting" :
                     isSpeaking ? "🔊 Speaking" : 
                     isListening ? "🎤 Listening" : 
                     "Ready"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTranscript(!showTranscript)}
                    className="h-8 w-8"
                    title="Show Logs"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={showSettings ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    className="h-8 w-8"
                    title="VAD Settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[400px] p-4">
            {messages.length === 0 && !isCallActive ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Click &quot;Start Call&quot; to begin
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}

                {currentTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-primary/50 text-primary-foreground italic">
                      🎤 {currentTranscript}
                    </div>
                  </div>
                )}

                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {isCallActive && (
            <div className="border-t p-4 bg-muted/30">
              <div className="flex items-center justify-center gap-3">
                {/* Mic Level */}
                <div className="flex items-center gap-2 w-24">
                  <Mic className={cn("h-4 w-4", isVoiceActive ? "text-green-500" : "text-gray-400")} />
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all", isVoiceActive ? "bg-green-500" : "bg-blue-400")}
                      style={{ width: `${Math.min(micLevel * 400, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <span className="text-sm">
                  {isSpeaking ? (isVoiceActive ? "Stopping..." : "Speak to interrupt") :
                   isListening ? "Listening..." :
                   isProcessing ? "Processing..." :
                   isMuted ? "Muted" : "Ready"}
                </span>
              </div>
            </div>
          )}

          <div className="border-t p-4">
            <div className="flex items-center justify-center gap-4">
              {!isCallActive ? (
                <Button onClick={startCall} size="lg" className="gap-2">
                  <Phone className="h-5 w-5" />
                  Start Call
                </Button>
              ) : (
                <>
                  <Button
                    variant={isMuted ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleMute}
                    className="h-12 w-12 rounded-full"
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>

                  <Button variant="destructive" size="lg" onClick={endCall} className="gap-2">
                    <PhoneOff className="h-5 w-5" />
                    End Call
                  </Button>

                  <Button
                    variant={isSpeaking ? "destructive" : "outline"}
                    size="icon"
                    onClick={cancelSpeech}
                    className="h-12 w-12 rounded-full"
                    disabled={!isSpeaking}
                  >
                    {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VAD Settings Panel */}
      {showSettings && isCallActive && (
        <Card className="w-80">
          <CardHeader className="border-b py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">VAD Tuning</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <label className="text-sm font-medium">Language</label>
              </div>
              <Select 
                value={selectedLanguage} 
                onValueChange={(value) => {
                  setSelectedLanguage(value);
                  // If specific language selected (not auto), set it as active
                  if (value !== "auto") {
                    setActiveLanguage(value);
                    const langName = SUPPORTED_LANGUAGES.find(l => l.code === value)?.name;
                    addLog("info", `🌐 Language set to: ${langName}`);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.nativeName}</span>
                        <span className="text-muted-foreground text-xs">({lang.name})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your language for speech recognition. The bot will understand and respond in this language.
              </p>
            </div>

            {/* Fast Mode Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Fast Mode</div>
                  <div className="text-xs text-muted-foreground">
                    {fastMode ? "Browser TTS (instant)" : "Edge TTS (natural)"}
                  </div>
                </div>
                <Button
                  variant={fastMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFastMode(!fastMode)}
                  className={cn(fastMode && "bg-green-600 hover:bg-green-700")}
                >
                  {fastMode ? "⚡ ON" : "OFF"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Fast mode reduces latency but uses less natural voice.
              </p>
            </div>

            {/* Live Mic Level Display */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Live Mic Level</div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Raw: {rawMicLevel.toFixed(3)}</span>
                  <span>Adjusted: {micLevel.toFixed(3)}</span>
                </div>
                <div className="h-6 bg-gray-200 rounded relative overflow-hidden">
                  {/* Threshold line */}
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${Math.min(vadThreshold * 200, 100)}%` }}
                  />
                  {/* Level bar */}
                  <div 
                    className={cn(
                      "h-full transition-all duration-75",
                      micLevel > vadThreshold ? "bg-green-500" : "bg-blue-400"
                    )}
                    style={{ width: `${Math.min(micLevel * 200, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0</span>
                  <span className="text-red-500">Threshold: {vadThreshold.toFixed(2)}</span>
                  <span>0.5</span>
                </div>
              </div>
              <div className={cn(
                "text-center py-1 rounded text-sm font-medium",
                isVoiceActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              )}>
                {isVoiceActive ? "🎙️ VOICE DETECTED" : "No voice"}
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Threshold</label>
                <span className="text-sm text-muted-foreground">{vadThreshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[vadThreshold]}
                onValueChange={([v]) => setVadThreshold(v)}
                min={0.02}
                max={0.5}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Higher = less sensitive. Increase if detecting noise.
              </p>
            </div>

            {/* Consecutive Frames Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Required Frames</label>
                <span className="text-sm text-muted-foreground">{vadFrames} (~{Math.round(vadFrames * 33)}ms)</span>
              </div>
              <Slider
                value={[vadFrames]}
                onValueChange={([v]) => setVadFrames(v)}
                min={3}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Consecutive frames above threshold. Higher = longer sound required.
              </p>
            </div>

            {/* Grace Period Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Grace Period</label>
                <span className="text-sm text-muted-foreground">{vadGracePeriod}ms</span>
              </div>
              <Slider
                value={[vadGracePeriod]}
                onValueChange={([v]) => setVadGracePeriod(v)}
                min={500}
                max={3000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Ignore VAD for this long after bot starts speaking.
              </p>
            </div>

            {/* Cooldown Slider */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Cooldown</label>
                <span className="text-sm text-muted-foreground">{vadCooldown}ms</span>
              </div>
              <Slider
                value={[vadCooldown]}
                onValueChange={([v]) => setVadCooldown(v)}
                min={1000}
                max={5000}
                step={500}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Wait this long between interrupts.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.05);
                    setVadFrames(5);
                    setVadGracePeriod(800);
                    setVadCooldown(1500);
                  }}
                  className="text-xs"
                >
                  🎤 Very Sensitive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.08);
                    setVadFrames(8);
                    setVadGracePeriod(1000);
                    setVadCooldown(2000);
                  }}
                  className="text-xs"
                >
                  🔊 Sensitive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.12);
                    setVadFrames(10);
                    setVadGracePeriod(1500);
                    setVadCooldown(3000);
                  }}
                  className="text-xs"
                >
                  ⚖️ Balanced
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.18);
                    setVadFrames(12);
                    setVadGracePeriod(2000);
                    setVadCooldown(3500);
                  }}
                  className="text-xs"
                >
                  🔇 Less Sensitive
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.25);
                    setVadFrames(15);
                    setVadGracePeriod(2500);
                    setVadCooldown(4000);
                  }}
                  className="text-xs"
                >
                  🛡️ Strict
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setVadThreshold(0.35);
                    setVadFrames(20);
                    setVadGracePeriod(3000);
                    setVadCooldown(5000);
                  }}
                  className="text-xs"
                >
                  🚫 Very Strict
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Start with &quot;Strict&quot; if getting false triggers
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Panel */}
      {showTranscript && isCallActive && (
        <Card className="w-80">
          <CardHeader className="border-b py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Logs</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowTranscript(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] p-2">
              <div className="space-y-1 font-mono text-xs">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      "p-1 rounded",
                      log.type === "error" && "bg-red-100 text-red-800",
                      log.type === "interrupt" && "bg-orange-100 text-orange-800 font-bold",
                      log.type === "vad" && "bg-yellow-100 text-yellow-800",
                      log.type === "speech" && "bg-blue-50 text-blue-800",
                      log.type === "tts" && "bg-green-50 text-green-800",
                      log.type === "api" && "bg-purple-50 text-purple-800",
                      log.type === "info" && "bg-gray-50 text-gray-800"
                    )}
                  >
                    <span className="opacity-50">{log.timestamp.toLocaleTimeString()}</span> {log.message}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
