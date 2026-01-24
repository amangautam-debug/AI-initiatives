import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Phone, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function ConsumerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">InsureVoice</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              href="/providers"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Providers
            </Link>
            <Link
              href="/call"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Talk to Agent
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/admin">Admin Portal</Link>
            </Button>
            <Button asChild>
              <Link href="/call">
                <Phone className="mr-2 h-4 w-4" />
                Get Quote
              </Link>
            </Button>
          </div>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/" className="text-lg font-medium">
                  Home
                </Link>
                <Link href="/providers" className="text-lg font-medium">
                  Providers
                </Link>
                <Link href="/call" className="text-lg font-medium">
                  Talk to Agent
                </Link>
                <hr className="my-4" />
                <Link href="/admin" className="text-lg font-medium">
                  Admin Portal
                </Link>
                <Button asChild className="mt-4">
                  <Link href="/call">
                    <Phone className="mr-2 h-4 w-4" />
                    Get Quote
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="font-bold">InsureVoice</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                AI-powered voice assistance for finding the perfect insurance coverage.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Insurance Types</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Health Insurance</li>
                <li>Auto Insurance</li>
                <li>Life Insurance</li>
                <li>Home Insurance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li>
                <li>Contact</li>
                <li>Careers</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>FAQs</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2024 InsureVoice. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
