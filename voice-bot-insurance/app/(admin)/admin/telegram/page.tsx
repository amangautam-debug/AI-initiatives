"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  MessageCircle, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle
} from "lucide-react";

interface BotStatus {
  active: boolean;
  mode: string;
  configured: boolean;
}

export default function TelegramPage() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/telegram/bot");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to fetch status:", error);
    }
  };

  const handleAction = async (action: "start" | "stop") => {
    setIsLoading(true);
    setActionMessage(null);

    try {
      const response = await fetch("/api/telegram/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "stop" ? "stop" : undefined }),
      });

      const data = await response.json();

      if (data.success) {
        setActionMessage({ type: "success", text: data.message });
      } else {
        setActionMessage({ type: "error", text: data.error || "Action failed" });
      }

      await fetchStatus();
    } catch (error) {
      console.error("Action failed:", error);
      setActionMessage({ type: "error", text: "Failed to perform action" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setActionMessage({ type: "success", text: "Copied to clipboard!" });
    setTimeout(() => setActionMessage(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageCircle className="h-8 w-8" />
          Telegram Bot
        </h1>
        <p className="text-muted-foreground">
          Configure and manage your Telegram bot integration
        </p>
      </div>

      {actionMessage && (
        <Alert variant={actionMessage.type === "error" ? "destructive" : "default"}>
          {actionMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          <AlertDescription>{actionMessage.text}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Bot Status
              <Button variant="ghost" size="icon" onClick={fetchStatus}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Current state of your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={status.active ? "default" : "secondary"}>
                    {status.active ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Mode</span>
                  <Badge variant="outline">{status.mode}</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Token Configured</span>
                  <Badge variant={status.configured ? "default" : "destructive"}>
                    {status.configured ? "Yes" : "No"}
                  </Badge>
                </div>

                <div className="pt-4 flex gap-2">
                  {status.active ? (
                    <Button
                      variant="destructive"
                      onClick={() => handleAction("stop")}
                      disabled={isLoading}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4 mr-2" />
                      )}
                      Stop Bot
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleAction("start")}
                      disabled={isLoading || !status.configured}
                      className="w-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Start Bot
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Loading status...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
            <CardDescription>How to configure your Telegram bot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Create a bot with BotFather</p>
                  <p className="text-sm text-muted-foreground">
                    Open Telegram and message @BotFather
                  </p>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => window.open("https://t.me/BotFather", "_blank")}
                  >
                    Open BotFather <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Send /newbot command</p>
                  <p className="text-sm text-muted-foreground">
                    Follow the prompts to name your bot
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Copy the bot token</p>
                  <p className="text-sm text-muted-foreground">
                    BotFather will give you a token like:
                  </p>
                  <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                    123456789:ABCdefGHIjklMNOpqrsTUVwxyz
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Add to .env file</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                      TELEGRAM_BOT_TOKEN=your_token_here
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyToClipboard("TELEGRAM_BOT_TOKEN=")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Restart the server & Start bot</p>
                  <p className="text-sm text-muted-foreground">
                    Click the &quot;Start Bot&quot; button above
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Card */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Features</CardTitle>
          <CardDescription>What your Telegram bot can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">🤖 AI Conversations</h4>
              <p className="text-sm text-muted-foreground">
                Uses your configured call script and recommendation logic
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">📚 RAG-Powered</h4>
              <p className="text-sm text-muted-foreground">
                Answers based on your uploaded knowledge base documents
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">🌐 Multi-Language</h4>
              <p className="text-sm text-muted-foreground">
                Supports Hindi, English, Tamil, Telugu, and more
              </p>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Commands Available</AlertTitle>
            <AlertDescription>
              <code>/start</code> - Start conversation | 
              <code>/help</code> - Show help | 
              <code>/clear</code> - Clear history
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
