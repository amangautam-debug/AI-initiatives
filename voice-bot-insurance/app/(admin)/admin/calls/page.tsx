import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Clock } from "lucide-react";
import prisma from "@/lib/db";

async function getConversations() {
  try {
    const conversations = await prisma.conversation.findMany({
      include: {
        bot: {
          select: { name: true },
        },
        messages: {
          select: { id: true },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    });

    return conversations;
  } catch {
    return [];
  }
}

function formatDuration(start: Date, end: Date | null): string {
  if (!end) return "In progress";
  const durationMs = end.getTime() - start.getTime();
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default async function CallsPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call History</h1>
          <p className="text-muted-foreground">
            View and manage voice conversation history
          </p>
        </div>
        <Button variant="outline">
          <Phone className="mr-2 h-4 w-4" />
          Trigger Test Call
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter((c) => c.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter((c) => c.status === "completed").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No conversations yet. Start a voice call from the consumer app to see history here.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conversations.map((conversation) => (
                  <TableRow key={conversation.id}>
                    <TableCell className="font-medium">
                      {conversation.bot?.name || "Unknown Bot"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          conversation.status === "active"
                            ? "default"
                            : conversation.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {conversation.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{conversation.messages.length}</TableCell>
                    <TableCell>
                      {formatDuration(
                        conversation.startedAt,
                        conversation.endedAt
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(conversation.startedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
