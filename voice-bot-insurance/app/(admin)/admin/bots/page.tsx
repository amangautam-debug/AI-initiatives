import Link from "next/link";
import { Button } from "@/components/ui/button";
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
import { Plus, Edit, Trash2, Play } from "lucide-react";
import prisma from "@/lib/db";

async function getBots() {
  try {
    const bots = await prisma.voiceBot.findMany({
      orderBy: { createdAt: "desc" },
    });
    return bots.map((bot) => ({
      ...bot,
      insuranceTypes: JSON.parse(bot.insuranceTypes) as string[],
    }));
  } catch {
    return [];
  }
}

export default async function BotsPage() {
  const bots = await getBots();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Bots</h1>
          <p className="text-muted-foreground">
            Manage your AI voice assistants
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/bots/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Bot
          </Link>
        </Button>
      </div>

      {bots.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No bots yet</CardTitle>
            <CardDescription>
              Create your first voice bot to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin/bots/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Bot
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Bots</CardTitle>
            <CardDescription>
              {bots.length} bot{bots.length !== 1 ? "s" : ""} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Insurance Types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bots.map((bot) => (
                  <TableRow key={bot.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{bot.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {bot.description || "No description"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {bot.insuranceTypes.length > 0 ? (
                          bot.insuranceTypes.map((type) => (
                            <Badge key={type} variant="secondary">
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            All types
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bot.isActive ? "default" : "secondary"}>
                        {bot.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(bot.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/?botId=${bot.id}`} title="Test Bot">
                            <Play className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/bots/${bot.id}`} title="Edit Bot">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          title="Delete Bot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
