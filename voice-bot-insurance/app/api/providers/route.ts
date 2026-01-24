import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET all providers
export async function GET() {
  try {
    const providers = await prisma.insuranceProvider.findMany({
      where: { isActive: true },
      include: {
        plans: {
          where: { isActive: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Parse JSON fields
    const parsedProviders = providers.map((provider) => ({
      ...provider,
      planTypes: JSON.parse(provider.planTypes),
      plans: provider.plans.map((plan) => ({
        ...plan,
        details: JSON.parse(plan.details),
        features: JSON.parse(plan.features),
      })),
    }));

    return NextResponse.json(parsedProviders);
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

// POST create new provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, logoUrl, description, website, planTypes, isActive = true } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const provider = await prisma.insuranceProvider.create({
      data: {
        name,
        logoUrl: logoUrl || "",
        description: description || "",
        website: website || "",
        planTypes: JSON.stringify(planTypes || []),
        isActive,
      },
    });

    return NextResponse.json({
      ...provider,
      planTypes: JSON.parse(provider.planTypes),
    });
  } catch (error) {
    console.error("Error creating provider:", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
