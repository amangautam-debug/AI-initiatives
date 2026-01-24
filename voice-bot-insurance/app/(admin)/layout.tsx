import Link from "next/link";
import { Bot, Phone, LayoutDashboard, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 p-4 flex flex-col">
        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">VoiceBot Admin</span>
          </Link>
        </div>

        <nav className="space-y-2 flex-1">
          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/admin">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/admin/bots">
              <Bot className="mr-2 h-4 w-4" />
              Voice Bots
            </Link>
          </Button>

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/admin/calls">
              <Phone className="mr-2 h-4 w-4" />
              Call History
            </Link>
          </Button>

          <Separator className="my-4" />

          <Button variant="ghost" className="w-full justify-start" asChild>
            <Link href="/admin/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </nav>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">View Consumer App</Link>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
