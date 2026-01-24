"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VoiceBot } from "@/components/voice/VoiceBot";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Phone, Shield, AlertCircle } from "lucide-react";
import Link from "next/link";
import { VoiceSettings, defaultVoiceSettings } from "@/lib/speech";

interface Bot {
  id: string;
  name: string;
  description: string | null;
  voiceId: string;
  voiceSettings: VoiceSettings;
  systemPrompt: string;
  greetingMessage: string;
  insuranceTypes: string[];
  isActive: boolean;
}

function CallPageContent() {
  const searchParams = useSearchParams();
  const botId = searchParams.get("botId");
  const insuranceType = searchParams.get("type");

  const [bot, setBot] = useState<Bot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBot() {
      setIsLoading(true);
      setError(null);

      try {
        if (botId) {
          // Load specific bot
          const response = await fetch(`/api/bots/${botId}`);
          if (response.ok) {
            const data = await response.json();
            setBot(data);
          } else {
            setError("Bot not found");
          }
        } else {
          // Load first active bot or use default
          const response = await fetch("/api/bots");
          if (response.ok) {
            const bots = await response.json();
            if (bots.length > 0) {
              // Find bot matching insurance type if specified
              const matchingBot = insuranceType
                ? bots.find(
                    (b: Bot) =>
                      b.isActive &&
                      (b.insuranceTypes.length === 0 ||
                        b.insuranceTypes.includes(insuranceType))
                  )
                : bots.find((b: Bot) => b.isActive);

              if (matchingBot) {
                setBot(matchingBot);
              } else {
                // Use default bot configuration
                setBot(getDefaultBot(insuranceType));
              }
            } else {
              // No bots configured, use default
              setBot(getDefaultBot(insuranceType));
            }
          } else {
            setBot(getDefaultBot(insuranceType));
          }
        }
      } catch (err) {
        console.error("Error loading bot:", err);
        // Fall back to default bot
        setBot(getDefaultBot(insuranceType));
      } finally {
        setIsLoading(false);
      }
    }

    loadBot();
  }, [botId, insuranceType]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading voice assistant...</span>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !bot) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Error</CardTitle>
              </div>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/">Go Back Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Voice Consultation</h1>
          <p className="text-muted-foreground">
            Talk to our AI assistant to get personalized insurance recommendations
          </p>
          {insuranceType && (
            <Badge className="mt-2 capitalize">{insuranceType} Insurance</Badge>
          )}
        </div>

        {/* Voice Bot */}
        <VoiceBot
          botId={bot.id}
          botName={bot.name}
          voiceSettings={bot.voiceSettings}
          systemPrompt={bot.systemPrompt}
          greetingMessage={bot.greetingMessage}
          onConversationEnd={(messages) => {
            console.log("Conversation ended with", messages.length, "messages");
          }}
        />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Click &quot;Start Call&quot; to begin the conversation</li>
              <li>Allow microphone access when prompted</li>
              <li>Speak naturally - the AI will understand you</li>
              <li>Answer questions to get personalized quotes</li>
              <li>Click &quot;End Call&quot; when you&apos;re done</li>
            </ol>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <Shield className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function getDefaultBot(insuranceType: string | null): Bot {
  const typePrompt = insuranceType
    ? `You specialize in ${insuranceType} insurance.`
    : "You can help with health, auto, life, and home insurance.";

  return {
    id: "default",
    name: "Insurance Assistant",
    description: "AI-powered insurance assistant",
    voiceId: "",
    voiceSettings: defaultVoiceSettings,
    systemPrompt: `You are a friendly and professional insurance assistant. Your role is to help customers find the right insurance coverage for their needs.

${typePrompt}

Guidelines:
- Be conversational and warm, but professional
- Ask clarifying questions to understand the customer's needs
- Explain insurance options in simple, easy-to-understand terms
- Collect necessary information to provide accurate quotes (name, age, coverage needs)
- Never pressure customers - let them make informed decisions
- Keep responses concise - this is a voice conversation

When a customer expresses interest in a specific plan, help them understand the coverage and pricing. If they want to proceed, collect their contact information for follow-up.`,
    greetingMessage: insuranceType
      ? `Hello! Welcome to our ${insuranceType} insurance service. I'm here to help you find the perfect coverage. What brings you here today?`
      : "Hello! Welcome to InsureVoice. I'm your AI insurance assistant. I can help you find the right coverage for health, auto, life, or home insurance. What type of insurance are you interested in today?",
    insuranceTypes: insuranceType ? [insuranceType] : [],
    isActive: true,
  };
}

export default function CallPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <CallPageContent />
    </Suspense>
  );
}
