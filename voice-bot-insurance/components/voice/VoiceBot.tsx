"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { VoiceSettings } from "@/lib/speech";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Speech synthesis hook
  const {
    speak,
    cancel: cancelSpeech,
    isSpeaking,
    isSupported: isSynthesisSupported,
  } = useSpeechSynthesis({
    voiceSettings,
    onEnd: () => {
      // After bot finishes speaking, start listening
      if (isCallActive && !isMuted) {
        startListening();
      }
    },
  });

  // Speech recognition hook
  const {
    isListening,
    isSupported: isRecognitionSupported,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    language: voiceSettings.language,
    onResult: (transcript, isFinal) => {
      if (isFinal) {
        handleUserMessage(transcript);
      } else {
        setCurrentTranscript(transcript);
      }
    },
    onError: (error) => {
      console.error("Speech recognition error:", error);
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle user message
  const handleUserMessage = useCallback(
    async (transcript: string) => {
      if (!transcript.trim()) return;

      stopListening();
      setCurrentTranscript("");

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: transcript,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Get AI response
      setIsProcessing(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            systemPrompt,
            botId,
            conversationId: conversationIdRef.current,
          }),
        });

        const data = await response.json();

        if (data.conversationId) {
          conversationIdRef.current = data.conversationId;
        }

        // Add assistant message
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Speak the response
        speak(data.message);
      } catch (error) {
        console.error("Error getting AI response:", error);
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "I'm sorry, I'm having trouble processing your request. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        speak(errorMessage.content);
      } finally {
        setIsProcessing(false);
      }
    },
    [messages, systemPrompt, botId, speak, stopListening]
  );

  // Start call
  const startCall = useCallback(() => {
    setIsCallActive(true);
    setMessages([]);
    conversationIdRef.current = null;

    // Add greeting message and speak it
    const greeting: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: greetingMessage,
      timestamp: new Date(),
    };
    setMessages([greeting]);
    speak(greetingMessage);
  }, [greetingMessage, speak]);

  // End call
  const endCall = useCallback(() => {
    setIsCallActive(false);
    stopListening();
    cancelSpeech();
    setCurrentTranscript("");
    onConversationEnd?.(messages);
  }, [stopListening, cancelSpeech, messages, onConversationEnd]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (isMuted) {
      setIsMuted(false);
      if (!isSpeaking && !isProcessing) {
        startListening();
      }
    } else {
      setIsMuted(true);
      stopListening();
    }
  }, [isMuted, isSpeaking, isProcessing, startListening, stopListening]);

  // Check browser support
  if (!isSynthesisSupported || !isRecognitionSupported) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Your browser doesn&apos;t support voice features. Please use Chrome or Edge for the best
            experience.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-3 h-3 rounded-full",
                isCallActive ? "bg-green-500 animate-pulse" : "bg-gray-300"
              )}
            />
            <CardTitle>{botName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isCallActive && (
              <>
                <Badge variant={isListening ? "default" : "secondary"}>
                  {isListening ? "Listening..." : isSpeaking ? "Speaking..." : "Ready"}
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <ScrollArea className="h-[400px] p-4">
          {messages.length === 0 && !isCallActive ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Click &quot;Start Call&quot; to begin your conversation
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
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p>{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {/* Current transcript (interim) */}
              {currentTranscript && (
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-lg px-4 py-2 bg-primary/50 text-primary-foreground">
                    <p className="italic">{currentTranscript}</p>
                  </div>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Voice Activity Indicator */}
        {isCallActive && (
          <div className="border-t p-4">
            <div className="flex items-center justify-center gap-1 h-8">
              {isListening && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-primary rounded-full animate-pulse"
                      style={{
                        height: `${Math.random() * 24 + 8}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </>
              )}
              {isSpeaking && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Volume2 className="h-4 w-4" />
                  <span className="text-sm">Bot is speaking...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Controls */}
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

                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endCall}
                  className="gap-2"
                >
                  <PhoneOff className="h-5 w-5" />
                  End Call
                </Button>

                <Button
                  variant={isSpeaking ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => (isSpeaking ? cancelSpeech() : null)}
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
  );
}
