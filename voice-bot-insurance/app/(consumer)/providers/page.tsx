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
import { Phone, ExternalLink, Shield } from "lucide-react";
import prisma from "@/lib/db";

async function getProviders() {
  try {
    const providers = await prisma.insuranceProvider.findMany({
      where: { isActive: true },
      include: {
        plans: {
          where: { isActive: true },
          orderBy: { premium: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    return providers.map((provider) => ({
      ...provider,
      planTypes: JSON.parse(provider.planTypes) as string[],
      plans: provider.plans.map((plan) => ({
        ...plan,
        features: JSON.parse(plan.features) as string[],
      })),
    }));
  } catch {
    return [];
  }
}

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Insurance Providers</h1>
        <p className="text-xl text-muted-foreground">
          Compare plans from top insurance providers and find the coverage that fits your needs
        </p>
      </div>

      {providers.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>No Providers Yet</CardTitle>
            <CardDescription>
              Insurance providers will appear here once they are added to the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              In the meantime, you can talk to our AI assistant to learn about available insurance options.
            </p>
            <Button asChild>
              <Link href="/call">
                <Phone className="mr-2 h-4 w-4" />
                Talk to AI Assistant
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                      {provider.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={provider.logoUrl}
                          alt={provider.name}
                          className="w-12 h-12 object-contain"
                        />
                      ) : (
                        <Shield className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </div>
                  </div>
                  {provider.website && (
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={provider.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {provider.planTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              {provider.plans.length > 0 && (
                <CardContent>
                  <h4 className="font-semibold mb-4">Available Plans</h4>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {provider.plans.map((plan) => (
                      <Card key={plan.id} className="bg-muted/50">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{plan.name}</CardTitle>
                            <Badge className="capitalize">{plan.type}</Badge>
                          </div>
                          <CardDescription>{plan.coverage}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <span className="text-3xl font-bold">
                              ${plan.premium}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          {plan.features.length > 0 && (
                            <ul className="text-sm space-y-1 mb-4">
                              {plan.features.slice(0, 3).map((feature, i) => (
                                <li key={i} className="text-muted-foreground">
                                  • {feature}
                                </li>
                              ))}
                            </ul>
                          )}
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href={`/call?planId=${plan.id}`}>
                              Get Quote
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card className="max-w-lg mx-auto p-8">
          <h3 className="text-xl font-semibold mb-2">Need Help Choosing?</h3>
          <p className="text-muted-foreground mb-4">
            Our AI assistant can help you compare plans and find the best option for your needs.
          </p>
          <Button size="lg" asChild>
            <Link href="/call">
              <Phone className="mr-2 h-4 w-4" />
              Talk to AI Assistant
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
