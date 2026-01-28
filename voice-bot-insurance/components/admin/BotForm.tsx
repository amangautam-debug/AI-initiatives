"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { 
  Loader2, 
  X, 
  Upload, 
  FileText, 
  Trash2, 
  Plus, 
  MessageSquare, 
  BookOpen, 
  Lightbulb,
  Settings2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BotDocument {
  id: string;
  name: string;
  chunksCount: number;
  docType: string;
  createdAt: string;
}

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

const DEFAULT_SYSTEM_PROMPT = `You are a friendly and professional insurance assistant based in India. Your role is to help customers find the right insurance coverage for their needs.

CRITICAL SPEECH RULES (your responses will be spoken aloud):
- Write numbers in words when small (one, two, three) or use digits for larger numbers
- NEVER use special symbols like ₹, %, &, *, #, @ in your responses
- Instead of "₹12,000" say "twelve thousand rupees" or "12000 rupees"
- Keep sentences short and conversational
- Speak naturally as if you're having a phone conversation

LANGUAGE:
- Detect the language the customer is speaking and respond in the SAME language
- Support Hindi, English, Tamil, Telugu, Kannada, Malayalam, and other Indian languages

Guidelines:
- Be conversational and warm, but professional
- Ask clarifying questions to understand the customer's needs
- Explain insurance options in simple, easy-to-understand terms
- Never pressure customers - let them make informed decisions`;

const DEFAULT_GREETING = "Namaste! Welcome to our insurance service. I'm here to help you find the perfect coverage for your needs. What type of insurance are you interested in today?";

export function BotForm({ bot }: BotFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = !!bot;
  const knowledgeInputRef = useRef<HTMLInputElement>(null);
  const recommendationInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingKnowledge, setIsUploadingKnowledge] = useState(false);
  const [isUploadingRecommendation, setIsUploadingRecommendation] = useState(false);
  const [knowledgeDocs, setKnowledgeDocs] = useState<BotDocument[]>([]);
  const [recommendationDocs, setRecommendationDocs] = useState<BotDocument[]>([]);
  
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

  // Load documents if editing
  useEffect(() => {
    if (isEditing && bot?.id) {
      loadDocuments(bot.id);
    }
  }, [isEditing, bot?.id]);

  const loadDocuments = async (botId: string) => {
    try {
      console.log(`[LoadDocs] Loading documents for bot ${botId}...`);
      
      // Load knowledge documents
      const knowledgeRes = await fetch(`/api/bots/${botId}/documents?type=knowledge`);
      const knowledgeData = await knowledgeRes.json();
      console.log(`[LoadDocs] Knowledge docs:`, knowledgeData);
      setKnowledgeDocs(knowledgeData.documents || []);

      // Load recommendation documents
      const recRes = await fetch(`/api/bots/${botId}/documents?type=recommendation`);
      const recData = await recRes.json();
      console.log(`[LoadDocs] Recommendation docs:`, recData);
      setRecommendationDocs(recData.documents || []);
      
      console.log(`[LoadDocs] Loaded ${knowledgeData.documents?.length || 0} knowledge, ${recData.documents?.length || 0} recommendation docs`);
    } catch (error) {
      console.error("Failed to load documents:", error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    docType: "knowledge" | "recommendation"
  ) => {
    if (!isEditing || !bot?.id) {
      toast({
        title: "Save bot first",
        description: "Please save the bot before uploading documents.",
        variant: "destructive",
      });
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    const setUploading = docType === "knowledge" ? setIsUploadingKnowledge : setIsUploadingRecommendation;
    setUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      try {
        console.log(`[Upload] Uploading ${file.name} as ${docType}...`);
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("docType", docType);

        const response = await fetch(`/api/bots/${bot.id}/documents`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        console.log(`[Upload] Response:`, data);
        
        if (data.success) {
          successCount++;
          toast({
            title: "File uploaded",
            description: `${file.name} - ${data.document.chunksCount} chunks created`,
          });
        } else {
          failCount++;
          toast({
            title: "Upload failed",
            description: data.error || `Failed to upload ${file.name}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        failCount++;
        console.error(`Upload error for ${file.name}:`, error);
        toast({
          title: "Upload error",
          description: `Error uploading ${file.name}`,
          variant: "destructive",
        });
      }
    }

    console.log(`[Upload] Complete. Success: ${successCount}, Failed: ${failCount}`);
    
    // Reload documents
    console.log(`[Upload] Reloading documents for bot ${bot.id}...`);
    await loadDocuments(bot.id);
    
    setUploading(false);
    
    // Reset input
    if (docType === "knowledge" && knowledgeInputRef.current) {
      knowledgeInputRef.current.value = "";
    }
    if (docType === "recommendation" && recommendationInputRef.current) {
      recommendationInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!bot?.id) return;

    try {
      const response = await fetch(`/api/bots/${bot.id}/documents?documentId=${documentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadDocuments(bot.id);
        toast({
          title: "Document deleted",
          description: "The document has been removed.",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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

  // Document upload section component
  const DocumentUploadSection = ({
    docType,
    documents,
    isUploading,
    inputRef,
    title,
    description,
  }: {
    docType: "knowledge" | "recommendation";
    documents: BotDocument[];
    isUploading: boolean;
    inputRef: React.RefObject<HTMLInputElement>;
    title: string;
    description: string;
  }) => (
    <>
      {!isEditing ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="font-medium">Save bot first</p>
          <p className="text-sm">Create the bot to upload documents</p>
        </div>
      ) : (
        <>
          {/* Upload Section */}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              ref={inputRef}
              type="file"
              accept=".txt,.pdf,.json"
              multiple
              onChange={(e) => handleFileUpload(e, docType)}
              className="hidden"
            />
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h4 className="font-medium mb-1">{title}</h4>
            <p className="text-sm text-muted-foreground mb-3">{description}</p>
            <Button
              type="button"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Select Files
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Supported: PDF, TXT, JSON
            </p>
          </div>

          {/* Document List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Uploaded Documents</h4>
              <Badge variant="secondary">{documents.length} files</Badge>
            </div>
            
            {documents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground bg-muted/50 rounded-lg">
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.chunksCount} chunks
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="h-8 w-8 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </>
      )}
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info & Voice Settings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Basic Information
            </CardTitle>
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

            <div className="flex items-center justify-between pt-2">
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

      {/* Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Configuration</CardTitle>
          <CardDescription>
            Configure call script, knowledge base, and recommendation logic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="script" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="script" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Call Script
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="logic" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recommendation
              </TabsTrigger>
            </TabsList>

            {/* Call Script Tab */}
            <TabsContent value="script" className="space-y-4">
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
                <Label htmlFor="systemPrompt">System Prompt / Call Script *</Label>
                <p className="text-sm text-muted-foreground">
                  Instructions that define the bot&apos;s personality, behavior, and conversation flow
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
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
              </div>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="space-y-4">
              <DocumentUploadSection
                docType="knowledge"
                documents={knowledgeDocs}
                isUploading={isUploadingKnowledge}
                inputRef={knowledgeInputRef}
                title="Upload Knowledge Base Documents"
                description="Upload policy documents, FAQs, product guides"
              />
            </TabsContent>

            {/* Recommendation Logic Tab */}
            <TabsContent value="logic" className="space-y-4">
              <DocumentUploadSection
                docType="recommendation"
                documents={recommendationDocs}
                isUploading={isUploadingRecommendation}
                inputRef={recommendationInputRef}
                title="Upload Recommendation Documents"
                description="Upload recommendation rules, decision trees, product mapping"
              />
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 text-sm">Document Format Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Include customer profile → product recommendations</li>
                  <li>Add condition-based rules (e.g., &quot;For customers under 30...&quot;)</li>
                  <li>Include product comparisons and decision criteria</li>
                  <li>Add pricing tiers and budget recommendations</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
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
