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
  Phone,
  Shield,
  Heart,
  Car,
  Home,
  Users,
  CheckCircle,
  ArrowRight,
  Mic,
} from "lucide-react";
import prisma from "@/lib/db";

async function getActiveBots() {
  try {
    const bots = await prisma.voiceBot.findMany({
      where: { isActive: true },
      take: 4,
    });
    return bots.map((bot) => ({
      ...bot,
      insuranceTypes: JSON.parse(bot.insuranceTypes) as string[],
    }));
  } catch {
    return [];
  }
}

const insuranceTypes = [
  {
    id: "health",
    name: "Health Insurance",
    description: "Comprehensive medical coverage for you and your family",
    icon: Heart,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
  },
  {
    id: "auto",
    name: "Auto Insurance",
    description: "Protection for your vehicle against accidents and theft",
    icon: Car,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "life",
    name: "Life Insurance",
    description: "Secure your family's future with life coverage",
    icon: Users,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "home",
    name: "Home Insurance",
    description: "Protect your home and belongings from unexpected events",
    icon: Home,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

const features = [
  "AI-powered voice assistance",
  "Compare multiple providers instantly",
  "Get personalized quotes in minutes",
  "24/7 available assistance",
  "No paperwork hassle",
  "Secure and confidential",
];

export default async function HomePage() {
  const bots = await getActiveBots();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              AI-Powered Insurance Platform
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Find Your Perfect Insurance with{" "}
              <span className="text-primary">Voice AI</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Talk to our AI assistant to explore insurance options, compare plans, 
              and get instant quotes. No forms, no waiting – just natural conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/call">
                  <Mic className="mr-2 h-5 w-5" />
                  Start Voice Call
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/providers">
                  View All Providers
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Insurance Types */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Insurance Coverage Options</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose from a variety of insurance types to protect what matters most to you
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {insuranceTypes.map((type) => (
              <Card
                key={type.id}
                className="hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${type.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                  </div>
                  <CardTitle>{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground" asChild>
                    <Link href={`/call?type=${type.id}`}>
                      Get Quote
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Why Choose Our AI Voice Platform?
              </h2>
              <p className="text-muted-foreground mb-8">
                Our AI-powered platform makes finding the right insurance easier than ever. 
                Simply speak naturally and let our assistant guide you through the process.
              </p>
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <Card className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Voice Assistant</h3>
                    <p className="text-sm text-muted-foreground">Ready to help</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      &quot;Hello! I&apos;m here to help you find the perfect insurance. 
                      What type of coverage are you looking for today?&quot;
                    </p>
                  </div>
                  <div className="bg-primary/10 p-3 rounded-lg ml-8">
                    <p className="text-sm">
                      &quot;I&apos;m interested in health insurance for my family.&quot;
                    </p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">
                      &quot;Great choice! I can help you compare family health plans. 
                      How many family members need coverage?&quot;
                    </p>
                  </div>
                </div>
                <Button className="w-full mt-6" asChild>
                  <Link href="/call">
                    <Mic className="mr-2 h-4 w-4" />
                    Start Conversation
                  </Link>
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Available Bots */}
      {bots.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our AI Assistants</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Choose an assistant specialized in your insurance needs
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {bots.map((bot) => (
                <Card key={bot.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{bot.name}</CardTitle>
                    <CardDescription>
                      {bot.description || "Insurance assistant"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bot.insuranceTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {bot.insuranceTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs capitalize">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={`/call?botId=${bot.id}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Talk Now
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Coverage?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start a voice conversation now and get personalized insurance recommendations in minutes.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/call">
              <Phone className="mr-2 h-5 w-5" />
              Start Free Consultation
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
