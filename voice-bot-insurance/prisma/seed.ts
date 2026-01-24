import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import path from "path";

// Create Prisma client with better-sqlite3 adapter
// Database is in project root (file:./dev.db in .env)
const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  await prisma.message.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.policy.deleteMany();
  await prisma.insurancePlan.deleteMany();
  await prisma.insuranceProvider.deleteMany();
  await prisma.voiceBot.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  console.log("📦 Creating insurance providers...");

  // Create Insurance Providers
  const healthFirst = await prisma.insuranceProvider.create({
    data: {
      name: "HealthFirst Insurance",
      logoUrl: "",
      description: "Leading provider of comprehensive health coverage for individuals and families",
      website: "https://example.com/healthfirst",
      planTypes: JSON.stringify(["health"]),
      isActive: true,
    },
  });

  const autoShield = await prisma.insuranceProvider.create({
    data: {
      name: "AutoShield Insurance",
      logoUrl: "",
      description: "Trusted auto insurance with excellent customer service",
      website: "https://example.com/autoshield",
      planTypes: JSON.stringify(["auto"]),
      isActive: true,
    },
  });

  const lifeSecure = await prisma.insuranceProvider.create({
    data: {
      name: "LifeSecure Insurance",
      logoUrl: "",
      description: "Protecting families with reliable life insurance solutions",
      website: "https://example.com/lifesecure",
      planTypes: JSON.stringify(["life"]),
      isActive: true,
    },
  });

  const homeGuard = await prisma.insuranceProvider.create({
    data: {
      name: "HomeGuard Insurance",
      logoUrl: "",
      description: "Complete protection for your home and belongings",
      website: "https://example.com/homeguard",
      planTypes: JSON.stringify(["home"]),
      isActive: true,
    },
  });

  console.log("📋 Creating insurance plans...");

  // Health Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: healthFirst.id,
        name: "Basic Health",
        type: "health",
        coverage: "Essential medical coverage including doctor visits and emergency care",
        premium: 199,
        details: JSON.stringify({
          deductible: 2500,
          outOfPocketMax: 7500,
          coinsurance: "80/20",
        }),
        features: JSON.stringify([
          "Doctor visits covered",
          "Emergency room coverage",
          "Prescription drug coverage",
          "Preventive care included",
        ]),
        isActive: true,
      },
      {
        providerId: healthFirst.id,
        name: "Premium Health",
        type: "health",
        coverage: "Comprehensive coverage with lower deductibles and wider network",
        premium: 349,
        details: JSON.stringify({
          deductible: 1000,
          outOfPocketMax: 5000,
          coinsurance: "90/10",
        }),
        features: JSON.stringify([
          "All Basic Health features",
          "Lower deductible",
          "Mental health coverage",
          "Specialist visits covered",
          "Vision and dental included",
        ]),
        isActive: true,
      },
      {
        providerId: healthFirst.id,
        name: "Family Health Plus",
        type: "health",
        coverage: "Complete family coverage with pediatric care and maternity benefits",
        premium: 599,
        details: JSON.stringify({
          deductible: 1500,
          outOfPocketMax: 6000,
          coinsurance: "85/15",
        }),
        features: JSON.stringify([
          "All Premium Health features",
          "Pediatric care included",
          "Maternity coverage",
          "Family wellness programs",
          "24/7 telehealth access",
        ]),
        isActive: true,
      },
    ],
  });

  // Auto Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: autoShield.id,
        name: "Liability Basic",
        type: "auto",
        coverage: "State-minimum liability coverage for budget-conscious drivers",
        premium: 89,
        details: JSON.stringify({
          bodilyInjury: "25/50",
          propertyDamage: 25000,
          uninsuredMotorist: false,
        }),
        features: JSON.stringify([
          "Bodily injury liability",
          "Property damage liability",
          "Legal defense coverage",
        ]),
        isActive: true,
      },
      {
        providerId: autoShield.id,
        name: "Comprehensive Auto",
        type: "auto",
        coverage: "Full coverage including collision and comprehensive protection",
        premium: 179,
        details: JSON.stringify({
          bodilyInjury: "100/300",
          propertyDamage: 100000,
          collision: 500,
          comprehensive: 250,
        }),
        features: JSON.stringify([
          "All Liability Basic features",
          "Collision coverage",
          "Comprehensive coverage",
          "Rental car reimbursement",
          "Roadside assistance",
        ]),
        isActive: true,
      },
      {
        providerId: autoShield.id,
        name: "Premium Protection",
        type: "auto",
        coverage: "Maximum protection with lowest deductibles and premium perks",
        premium: 249,
        details: JSON.stringify({
          bodilyInjury: "250/500",
          propertyDamage: 250000,
          collision: 250,
          comprehensive: 100,
        }),
        features: JSON.stringify([
          "All Comprehensive Auto features",
          "New car replacement",
          "Gap coverage",
          "Accident forgiveness",
          "Vanishing deductible",
        ]),
        isActive: true,
      },
    ],
  });

  // Life Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: lifeSecure.id,
        name: "Term Life 10",
        type: "life",
        coverage: "10-year term life insurance with affordable premiums",
        premium: 25,
        details: JSON.stringify({
          term: 10,
          coverageAmount: 100000,
          renewableOption: true,
        }),
        features: JSON.stringify([
          "$100,000 death benefit",
          "10-year level premium",
          "Convertible to whole life",
          "No medical exam option",
        ]),
        isActive: true,
      },
      {
        providerId: lifeSecure.id,
        name: "Term Life 20",
        type: "life",
        coverage: "20-year term life insurance for long-term family protection",
        premium: 45,
        details: JSON.stringify({
          term: 20,
          coverageAmount: 250000,
          renewableOption: true,
        }),
        features: JSON.stringify([
          "$250,000 death benefit",
          "20-year level premium",
          "Convertible to whole life",
          "Accelerated death benefit",
          "Waiver of premium rider",
        ]),
        isActive: true,
      },
      {
        providerId: lifeSecure.id,
        name: "Whole Life Classic",
        type: "life",
        coverage: "Permanent life insurance with cash value accumulation",
        premium: 150,
        details: JSON.stringify({
          term: "lifetime",
          coverageAmount: 500000,
          cashValue: true,
        }),
        features: JSON.stringify([
          "$500,000 death benefit",
          "Lifetime coverage",
          "Cash value growth",
          "Dividend eligible",
          "Loan availability",
        ]),
        isActive: true,
      },
    ],
  });

  // Home Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: homeGuard.id,
        name: "Basic Home",
        type: "home",
        coverage: "Essential dwelling coverage for homeowners",
        premium: 80,
        details: JSON.stringify({
          dwellingCoverage: 150000,
          personalProperty: 50000,
          liability: 100000,
        }),
        features: JSON.stringify([
          "Dwelling protection",
          "Personal property coverage",
          "Liability protection",
          "Additional living expenses",
        ]),
        isActive: true,
      },
      {
        providerId: homeGuard.id,
        name: "Standard Home",
        type: "home",
        coverage: "Comprehensive coverage for your home and belongings",
        premium: 130,
        details: JSON.stringify({
          dwellingCoverage: 300000,
          personalProperty: 100000,
          liability: 300000,
        }),
        features: JSON.stringify([
          "All Basic Home features",
          "Extended personal property",
          "Increased liability limits",
          "Water backup coverage",
          "Identity theft protection",
        ]),
        isActive: true,
      },
      {
        providerId: homeGuard.id,
        name: "Premium Home",
        type: "home",
        coverage: "Maximum protection with replacement cost coverage",
        premium: 200,
        details: JSON.stringify({
          dwellingCoverage: 500000,
          personalProperty: 200000,
          liability: 500000,
        }),
        features: JSON.stringify([
          "All Standard Home features",
          "Replacement cost coverage",
          "Scheduled personal property",
          "Equipment breakdown",
          "Umbrella liability option",
          "Green rebuild option",
        ]),
        isActive: true,
      },
    ],
  });

  console.log("🤖 Creating voice bots...");

  // Create Voice Bots
  await prisma.voiceBot.create({
    data: {
      name: "General Insurance Assistant",
      description: "Helps customers with all types of insurance inquiries",
      voiceId: "",
      voiceSettings: JSON.stringify({
        rate: 1,
        pitch: 1,
        volume: 1,
        language: "en-US",
      }),
      systemPrompt: `You are a friendly and professional insurance assistant named Alex. Your role is to help customers find the right insurance coverage for their needs.

You can help with:
- Health Insurance: Plans from HealthFirst Insurance ($199-$599/month)
- Auto Insurance: Plans from AutoShield Insurance ($89-$249/month)
- Life Insurance: Plans from LifeSecure Insurance ($25-$150/month)
- Home Insurance: Plans from HomeGuard Insurance ($80-$200/month)

Guidelines:
- Be conversational, warm, and professional
- Ask clarifying questions to understand needs
- Explain options in simple terms
- Collect name, age, and contact info when appropriate
- Never pressure - let customers decide
- Keep responses concise for voice conversation

When quoting, mention the range of plans available and help narrow down based on their budget and needs.`,
      greetingMessage: "Hello! I'm Alex, your insurance assistant. I can help you find the perfect coverage for health, auto, life, or home insurance. What type of insurance are you looking for today?",
      insuranceTypes: JSON.stringify([]),
      isActive: true,
    },
  });

  await prisma.voiceBot.create({
    data: {
      name: "Health Insurance Specialist",
      description: "Specialized assistant for health insurance inquiries",
      voiceId: "",
      voiceSettings: JSON.stringify({
        rate: 1,
        pitch: 1.1,
        volume: 1,
        language: "en-US",
      }),
      systemPrompt: `You are a health insurance specialist named Sarah. You help customers find the right health coverage from HealthFirst Insurance.

Available Plans:
1. Basic Health - $199/month
   - Essential coverage, $2,500 deductible
   - Doctor visits, ER, prescriptions, preventive care

2. Premium Health - $349/month  
   - Comprehensive, $1,000 deductible
   - Mental health, specialists, vision & dental included

3. Family Health Plus - $599/month
   - Complete family coverage
   - Pediatric, maternity, 24/7 telehealth

Guidelines:
- Understand their health needs and family situation
- Ask about current coverage and what's missing
- Explain deductibles, copays, and networks simply
- Collect name, age, family size for accurate quotes
- Be empathetic about health concerns`,
      greetingMessage: "Hi there! I'm Sarah, your health insurance specialist. I'm here to help you find the right health coverage for you and your family. To get started, can you tell me a bit about your current health coverage situation?",
      insuranceTypes: JSON.stringify(["health"]),
      isActive: true,
    },
  });

  await prisma.voiceBot.create({
    data: {
      name: "Auto Insurance Advisor",
      description: "Expert in auto insurance coverage options",
      voiceId: "",
      voiceSettings: JSON.stringify({
        rate: 1,
        pitch: 0.9,
        volume: 1,
        language: "en-US",
      }),
      systemPrompt: `You are an auto insurance advisor named Mike. You help customers find the right auto coverage from AutoShield Insurance.

Available Plans:
1. Liability Basic - $89/month
   - State-minimum coverage
   - Bodily injury, property damage

2. Comprehensive Auto - $179/month
   - Full coverage with collision
   - Rental car, roadside assistance

3. Premium Protection - $249/month
   - Maximum protection
   - New car replacement, gap, accident forgiveness

Guidelines:
- Ask about their vehicle (make, model, year)
- Understand driving habits and mileage
- Explain liability vs comprehensive simply
- Collect driver info for accurate quotes
- Mention discounts for safe driving, bundling`,
      greetingMessage: "Hey! I'm Mike from AutoShield Insurance. I'm here to help you get the right auto coverage. First off, what kind of vehicle are you looking to insure?",
      insuranceTypes: JSON.stringify(["auto"]),
      isActive: true,
    },
  });

  console.log("👤 Creating admin user...");

  await prisma.admin.create({
    data: {
      email: "admin@insure-voice.com",
      name: "Admin User",
      role: "super_admin",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - ${4} insurance providers`);
  console.log(`   - ${12} insurance plans`);
  console.log(`   - ${3} voice bots`);
  console.log(`   - ${1} admin user`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
