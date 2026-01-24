"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceSelector } from "@/components/voice/VoiceSelector";
import { VoiceSettings, defaultVoiceSettings } from "@/lib/speech";
import { Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotFormProps {
  bot?: {
    id: string;
    name: string;
    description: string | null;
    voiceId: string;
    voiceSettings: VoiceSettings;
    systemPrompt: string;
    greetingMessage: string;
    insuranceTypes: string[];
    isActive: boolean;
  };
}

const INSURANCE_TYPES = ["health", "auto", "life", "home"];

const DEFAULT_SYSTEM_PROMPT = `You are a friendly and professional insurance assistant. Your role is to help customers find the right insurance coverage for their needs.

Guidelines:
- Be conversational and warm, but professional
- Ask clarifying questions to understand the customer's needs
- Explain insurance options in simple, easy-to-understand terms
- Collect necessary information to provide accurate quotes
- Never pressure customers - let them make informed decisions
- If you don't know something, be honest and offer to connect them with a specialist

You can help with health, auto, life, and home insurance.`;

const DEFAULT_GREETING = "Hello! Welcome to our insurance service. I'm here to help you find the perfect coverage for your needs. What type of insurance are you interested in today?";

export function BotForm({ bot }: BotFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!bot;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: bot?.name || "",
    description: bot?.description || "",
    voiceId: bot?.voiceId || "",
    voiceSettings: bot?.voiceSettings || defaultVoiceSettings,
    systemPrompt: bot?.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    greetingMessage: bot?.greetingMessage || DEFAULT_GREETING,
    insuranceTypes: bot?.insuranceTypes || [],
    isActive: bot?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const url = isEditing ? `/api/bots/${bot.id}` : "/api/bots";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save bot");
      }

      toast({
        title: isEditing ? "Bot updated" : "Bot created",
        description: `${formData.name} has been ${isEditing ? "updated" : "created"} successfully.`,
      });

      router.push("/admin/bots");
      router.refresh();
    } catch (error) {
      console.error("Error saving bot:", error);
      toast({
        title: "Error",
        description: "Failed to save bot. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleInsuranceType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      insuranceTypes: prev.insuranceTypes.includes(type)
        ? prev.insuranceTypes.filter((t) => t !== type)
        : [...prev.insuranceTypes, type],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the bot&apos;s name and description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bot Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Health Insurance Assistant"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of what this bot does..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Insurance Types</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select the insurance types this bot can handle (leave empty for all)
              </p>
              <div className="flex flex-wrap gap-2">
                {INSURANCE_TYPES.map((type) => (
                  <Badge
                    key={type}
                    variant={
                      formData.insuranceTypes.includes(type)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer capitalize"
                    onClick={() => toggleInsuranceType(type)}
                  >
                    {type}
                    {formData.insuranceTypes.includes(type) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active</Label>
                <p className="text-sm text-muted-foreground">
                  Enable this bot for customer interactions
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Voice Settings */}
        <VoiceSelector
          settings={formData.voiceSettings}
          onChange={(voiceSettings) =>
            setFormData((prev) => ({
              ...prev,
              voiceSettings,
              voiceId: voiceSettings.voiceURI,
            }))
          }
          previewText={formData.greetingMessage || DEFAULT_GREETING}
        />
      </div>

      {/* Prompts */}
      <Card>
        <CardHeader>
          <CardTitle>Conversation Configuration</CardTitle>
          <CardDescription>
            Configure how the bot communicates with customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="greetingMessage">Greeting Message *</Label>
            <p className="text-sm text-muted-foreground">
              The first message the bot says when a call starts
            </p>
            <Textarea
              id="greetingMessage"
              value={formData.greetingMessage}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  greetingMessage: e.target.value,
                }))
              }
              placeholder="Hello! How can I help you today?"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt *</Label>
            <p className="text-sm text-muted-foreground">
              Instructions that define the bot&apos;s personality and behavior
            </p>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  systemPrompt: e.target.value,
                }))
              }
              placeholder="You are a helpful insurance assistant..."
              rows={12}
              className="font-mono text-sm"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/bots")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Bot" : "Create Bot"}
        </Button>
      </div>
    </form>
  );
}
