"use client";

import { useEffect, useState } from "react";
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
import { Volume2, Play } from "lucide-react";
import { VoiceSettings, getAvailableVoices, speak, cancelSpeech } from "@/lib/speech";

interface VoiceSelectorProps {
  settings: VoiceSettings;
  onChange: (settings: VoiceSettings) => void;
  previewText?: string;
}

export function VoiceSelector({
  settings,
  onChange,
  previewText = "Hello! I'm your insurance assistant. How can I help you today?",
}: VoiceSelectorProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = getAvailableVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleVoiceChange = (voiceURI: string) => {
    const selectedVoice = voices.find((v) => v.voiceURI === voiceURI);
    onChange({
      ...settings,
      voiceURI,
      language: selectedVoice?.lang || settings.language,
    });
  };

  const handlePreview = () => {
    if (isPreviewPlaying) {
      cancelSpeech();
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewPlaying(true);
    speak(
      previewText,
      settings,
      () => setIsPreviewPlaying(false),
      () => setIsPreviewPlaying(false)
    );
  };

  // Group voices by language
  const voicesByLanguage = voices.reduce((acc, voice) => {
    const lang = voice.lang.split("-")[0];
    if (!acc[lang]) {
      acc[lang] = [];
    }
    acc[lang].push(voice);
    return acc;
  }, {} as Record<string, SpeechSynthesisVoice[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="voice">Voice</Label>
          <Select value={settings.voiceURI} onValueChange={handleVoiceChange}>
            <SelectTrigger id="voice">
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(voicesByLanguage).map(([lang, langVoices]) => (
                <div key={lang}>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    {lang.toUpperCase()}
                  </div>
                  {langVoices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Speech Rate */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Speech Rate</Label>
            <span className="text-sm text-muted-foreground">{settings.rate.toFixed(1)}x</span>
          </div>
          <Slider
            value={[settings.rate]}
            onValueChange={([rate]) => onChange({ ...settings, rate })}
            min={0.5}
            max={2}
            step={0.1}
          />
        </div>

        {/* Pitch */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Pitch</Label>
            <span className="text-sm text-muted-foreground">{settings.pitch.toFixed(1)}</span>
          </div>
          <Slider
            value={[settings.pitch]}
            onValueChange={([pitch]) => onChange({ ...settings, pitch })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        {/* Volume */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Volume</Label>
            <span className="text-sm text-muted-foreground">{Math.round(settings.volume * 100)}%</span>
          </div>
          <Slider
            value={[settings.volume]}
            onValueChange={([volume]) => onChange({ ...settings, volume })}
            min={0}
            max={1}
            step={0.1}
          />
        </div>

        {/* Preview Button */}
        <Button
          variant="outline"
          onClick={handlePreview}
          className="w-full"
          disabled={!settings.voiceURI}
        >
          <Play className="h-4 w-4 mr-2" />
          {isPreviewPlaying ? "Stop Preview" : "Preview Voice"}
        </Button>
      </CardContent>
    </Card>
  );
}
