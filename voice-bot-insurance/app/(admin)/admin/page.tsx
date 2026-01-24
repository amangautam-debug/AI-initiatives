import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Phone, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/db";

async function getStats() {
  try {
    const [botCount, conversationCount, messageCount] = await Promise.all([
      prisma.voiceBot.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ]);

    return {
      bots: botCount,
      conversations: conversationCount,
      messages: messageCount,
    };
  } catch {
    return { bots: 0, conversations: 0, messages: 0 };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your voice bots and monitor conversations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bots}</div>
            <p className="text-xs text-muted-foreground">
              Active voice assistants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversations</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversations}</div>
            <p className="text-xs text-muted-foreground">
              Total voice sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.messages}</div>
            <p className="text-xs text-muted-foreground">
              Total interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Voice Bots</CardTitle>
            <CardDescription>
              Create and manage your AI voice assistants
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure voice settings, system prompts, and greeting messages for each bot.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/bots/new">Create New Bot</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/bots">View All Bots</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Call Management</CardTitle>
            <CardDescription>
              View call history and trigger new calls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Monitor active conversations, review transcripts, and analyze performance.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/admin/calls">View Calls</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">Test Voice Bot</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
