"use client";

import { useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Volume2, Play, Square, User, Loader2 } from "lucide-react";
import { VoiceSettings } from "@/lib/speech";

interface Voice {
  id: string;
  name: string;
  gender: "male" | "female";
  locale: string;
  description: string;
}

interface VoiceSelectorProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
  previewText?: string;
}

export function VoiceSelector({
  settings,
  onChange,
  previewText = "Hello! I'm your insurance assistant. How can I help you find the perfect coverage today?",
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load voices from API
  useEffect(() => {
    async function loadVoices() {
      try {
        const response = await fetch("/api/voices");
        if (response.ok) {
          const data = await response.json();
          setVoices(data);
          
          // Set default voice if not set
          if (!settings.voiceURI && data.length > 0) {
            onChange({
              ...settings,
              voiceURI: data[0].id,
              language: data[0].locale,
            });
          }
        }
      } catch (error) {
        console.error("Failed to load voices:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadVoices();
  }, []);

  const handleVoiceChange = (voiceId: string) => {
    const selectedVoice = voices.find((v) => v.id === voiceId);
    onChange({
      ...settings,
      voiceURI: voiceId,
      language: selectedVoice?.locale || settings.language,
    });
  };

  const handlePreview = async () => {
    if (isPreviewPlaying) {
      // Stop playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewLoading(true);

    try {
      // Generate speech from API
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: previewText,
          voice: settings.voiceURI,
          rate: settings.rate,
          pitch: settings.pitch,
          volume: settings.volume,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate speech");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPreviewPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPreviewPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setIsPreviewPlaying(true);
    } catch (error) {
      console.error("Preview error:", error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Filter voices by gender
  const filteredVoices = genderFilter === "all" 
    ? voices 
    : voices.filter((v) => v.gender === genderFilter);

  // Group voices by locale
  const voicesByLocale = filteredVoices.reduce((acc, voice) => {
    if (!acc[voice.locale]) {
      acc[voice.locale] = [];
    }
    acc[voice.locale].push(voice);
    return acc;
  }, {} as Record<string, Voice[]>);

  const localeNames: Record<string, string> = {
    "en-US": "American English",
    "en-GB": "British English",
    "en-AU": "Australian English",
    "en-IN": "Indian English",
  };

  const selectedVoice = voices.find((v) => v.id === settings.voiceURI);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading voices...</span>
          </div>
        ) : (
          <>
            {/* Gender Filter */}
            <div className="space-y-2">
              <Label>Voice Gender</Label>
              <div className="flex gap-2">
                <Button
                  variant={genderFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGenderFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={genderFilter === "female" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGenderFilter("female")}
                >
                  <User className="h-4 w-4 mr-1" />
                  Female
                </Button>
                <Button
                  variant={genderFilter === "male" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGenderFilter("male")}
                >
                  <User className="h-4 w-4 mr-1" />
                  Male
                </Button>
              </div>
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice">Voice</Label>
              <Select value={settings.voiceURI} onValueChange={handleVoiceChange}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(voicesByLocale).map(([locale, localeVoices]) => (
                    <div key={locale}>
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        {localeNames[locale] || locale}
                      </div>
                      {localeVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div className="flex items-center gap-2">
                            <span>{voice.name}</span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {voice.gender}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {selectedVoice && (
                <p className="text-sm text-muted-foreground">
                  {selectedVoice.description}
                </p>
              )}
            </div>

            {/* Speech Rate */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Speech Rate</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.rate.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[settings.rate]}
                onValueChange={([rate]) => onChange({ ...settings, rate })}
                min={0.5}
                max={2}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Slower</span>
                <span>Normal</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Pitch</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.pitch.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[settings.pitch]}
                onValueChange={([pitch]) => onChange({ ...settings, pitch })}
                min={0.5}
                max={1.5}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lower</span>
                <span>Normal</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Preview Button */}
            <Button
              variant="outline"
              onClick={handlePreview}
              className="w-full"
              disabled={!settings.voiceURI || isPreviewLoading}
            >
              {isPreviewLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : isPreviewPlaying ? (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop Preview
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Preview Voice
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Powered by Microsoft Neural Voices - Free & Realistic
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
