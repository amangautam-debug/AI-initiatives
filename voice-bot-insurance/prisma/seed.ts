import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import "dotenv/config";
import path from "path";

// Create Prisma client with better-sqlite3 adapter
const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed with Indian context...");

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

  console.log("📦 Creating Indian insurance providers...");

  // Create Indian Insurance Providers
  const starHealth = await prisma.insuranceProvider.create({
    data: {
      name: "Star Health Insurance",
      logoUrl: "",
      description: "India's largest standalone health insurer with comprehensive mediclaim policies",
      website: "https://www.starhealth.in",
      planTypes: JSON.stringify(["health"]),
      isActive: true,
    },
  });

  const iciciLombard = await prisma.insuranceProvider.create({
    data: {
      name: "ICICI Lombard",
      logoUrl: "",
      description: "Leading private general insurance company offering motor and health insurance",
      website: "https://www.icicilombard.com",
      planTypes: JSON.stringify(["health", "auto"]),
      isActive: true,
    },
  });

  const licIndia = await prisma.insuranceProvider.create({
    data: {
      name: "LIC India",
      logoUrl: "",
      description: "Life Insurance Corporation of India - trusted life insurance since 1956",
      website: "https://www.licindia.in",
      planTypes: JSON.stringify(["life"]),
      isActive: true,
    },
  });

  const hdfcErgo = await prisma.insuranceProvider.create({
    data: {
      name: "HDFC ERGO",
      logoUrl: "",
      description: "Comprehensive home and motor insurance solutions",
      website: "https://www.hdfcergo.com",
      planTypes: JSON.stringify(["home", "auto"]),
      isActive: true,
    },
  });

  const bajajAllianz = await prisma.insuranceProvider.create({
    data: {
      name: "Bajaj Allianz",
      logoUrl: "",
      description: "One of India's leading private general insurance companies",
      website: "https://www.bajajallianz.com",
      planTypes: JSON.stringify(["health", "auto", "home"]),
      isActive: true,
    },
  });

  console.log("📋 Creating insurance plans (in INR)...");

  // Health Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: starHealth.id,
        name: "Star Family Health Optima",
        type: "health",
        coverage: "Floater policy covering entire family with cashless hospitalization",
        premium: 12000,
        details: JSON.stringify({
          sumInsured: 500000,
          roomRent: "No capping",
          preExistingWaiting: "3 years",
          networkHospitals: 10000,
        }),
        features: JSON.stringify([
          "Cashless hospitalization at 10,000+ hospitals",
          "No room rent capping",
          "Day care procedures covered",
          "Free health checkup",
          "Ayush treatment covered",
        ]),
        isActive: true,
      },
      {
        providerId: starHealth.id,
        name: "Star Comprehensive",
        type: "health",
        coverage: "Premium health cover with higher sum insured and enhanced benefits",
        premium: 25000,
        details: JSON.stringify({
          sumInsured: 1000000,
          roomRent: "Single private AC room",
          preExistingWaiting: "2 years",
          networkHospitals: 10000,
        }),
        features: JSON.stringify([
          "₹1 Crore sum insured",
          "Restoration of sum insured",
          "Maternity cover included",
          "New born baby covered from day 1",
          "Air ambulance cover",
        ]),
        isActive: true,
      },
      {
        providerId: iciciLombard.id,
        name: "ICICI Health Shield",
        type: "health",
        coverage: "Affordable health coverage for individuals and families",
        premium: 8500,
        details: JSON.stringify({
          sumInsured: 300000,
          roomRent: "1% of SI",
          preExistingWaiting: "4 years",
          networkHospitals: 6500,
        }),
        features: JSON.stringify([
          "Cashless at 6,500+ hospitals",
          "Pre and post hospitalization",
          "Ambulance charges covered",
          "Day care treatments",
        ]),
        isActive: true,
      },
    ],
  });

  // Motor Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: iciciLombard.id,
        name: "ICICI Third Party Only",
        type: "auto",
        coverage: "Mandatory third party liability cover as per Motor Vehicles Act",
        premium: 2500,
        details: JSON.stringify({
          thirdPartyLiability: "Unlimited",
          ownDamage: false,
          personalAccident: 1500000,
        }),
        features: JSON.stringify([
          "Legal liability coverage",
          "Personal accident cover for owner-driver",
          "As per Motor Vehicles Act",
        ]),
        isActive: true,
      },
      {
        providerId: hdfcErgo.id,
        name: "HDFC ERGO Comprehensive",
        type: "auto",
        coverage: "Complete protection for your car including own damage and theft",
        premium: 12000,
        details: JSON.stringify({
          thirdPartyLiability: "Unlimited",
          ownDamage: true,
          idv: "Market value",
          ncbDiscount: "Up to 50%",
        }),
        features: JSON.stringify([
          "Own damage coverage",
          "Theft protection",
          "Third party liability",
          "Personal accident cover",
          "24x7 roadside assistance",
        ]),
        isActive: true,
      },
      {
        providerId: bajajAllianz.id,
        name: "Bajaj Allianz Motor Premium",
        type: "auto",
        coverage: "Premium car insurance with zero depreciation and engine protect",
        premium: 18000,
        details: JSON.stringify({
          thirdPartyLiability: "Unlimited",
          ownDamage: true,
          zeroDep: true,
          engineProtect: true,
        }),
        features: JSON.stringify([
          "Zero depreciation cover",
          "Engine and gearbox protection",
          "Consumables cover",
          "Key replacement",
          "NCB protection",
        ]),
        isActive: true,
      },
    ],
  });

  // Life Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: licIndia.id,
        name: "LIC Term Plan",
        type: "life",
        coverage: "Pure term insurance with high life cover at affordable premium",
        premium: 6000,
        details: JSON.stringify({
          sumAssured: 5000000,
          policyTerm: 30,
          premiumPayingTerm: 30,
        }),
        features: JSON.stringify([
          "₹50 Lakh life cover",
          "Tax benefit under 80C",
          "Option for accidental death benefit",
          "Critical illness rider available",
        ]),
        isActive: true,
      },
      {
        providerId: licIndia.id,
        name: "LIC Jeevan Labh",
        type: "life",
        coverage: "Endowment plan with guaranteed additions and maturity benefit",
        premium: 35000,
        details: JSON.stringify({
          sumAssured: 1000000,
          policyTerm: 25,
          maturityBenefit: true,
          guaranteedAdditions: true,
        }),
        features: JSON.stringify([
          "Guaranteed additions every year",
          "Maturity benefit",
          "Death benefit",
          "Loan facility available",
          "Tax benefits under 80C and 10(10D)",
        ]),
        isActive: true,
      },
      {
        providerId: licIndia.id,
        name: "LIC Jeevan Umang",
        type: "life",
        coverage: "Whole life plan with annual survival benefit after premium payment",
        premium: 50000,
        details: JSON.stringify({
          sumAssured: 1500000,
          policyTerm: "Whole Life",
          survivalBenefit: "8% of SA annually",
        }),
        features: JSON.stringify([
          "Whole life coverage",
          "8% annual survival benefit",
          "Final maturity at age 100",
          "Death benefit throughout life",
          "Loan facility",
        ]),
        isActive: true,
      },
    ],
  });

  // Home Insurance Plans
  await prisma.insurancePlan.createMany({
    data: [
      {
        providerId: hdfcErgo.id,
        name: "HDFC Home Shield Basic",
        type: "home",
        coverage: "Essential protection for your home structure",
        premium: 3500,
        details: JSON.stringify({
          buildingCover: 2500000,
          contentsCover: 500000,
          earthquakeCover: true,
        }),
        features: JSON.stringify([
          "Building structure coverage",
          "Fire and allied perils",
          "Natural calamities",
          "Terrorism cover",
        ]),
        isActive: true,
      },
      {
        providerId: bajajAllianz.id,
        name: "Bajaj Home Insurance Plus",
        type: "home",
        coverage: "Comprehensive home and contents protection",
        premium: 6500,
        details: JSON.stringify({
          buildingCover: 5000000,
          contentsCover: 1500000,
          burglary: true,
          publicLiability: 500000,
        }),
        features: JSON.stringify([
          "Building and contents cover",
          "Burglary and theft protection",
          "Electronic equipment coverage",
          "Jewellery and valuables",
          "Public liability",
        ]),
        isActive: true,
      },
      {
        providerId: hdfcErgo.id,
        name: "HDFC My Home Premium",
        type: "home",
        coverage: "Premium all-risk home insurance with maximum benefits",
        premium: 12000,
        details: JSON.stringify({
          buildingCover: 10000000,
          contentsCover: 3000000,
          allRisk: true,
          domesticHelp: true,
        }),
        features: JSON.stringify([
          "All risk coverage",
          "₹1 Crore building cover",
          "Domestic help insurance",
          "Rent for alternative accommodation",
          "Personal accident cover",
        ]),
        isActive: true,
      },
    ],
  });

  console.log("🤖 Creating voice bots with Indian voices...");

  // Voice Bots - Single language greetings, will switch based on user's language
  await prisma.voiceBot.create({
    data: {
      name: "Priya - Insurance Assistant",
      description: "Multilingual insurance assistant - starts in English, adapts to customer's language",
      voiceId: "en-IN-NeerjaNeural",
      voiceSettings: JSON.stringify({
        voiceURI: "en-IN-NeerjaNeural",
        rate: 1,
        pitch: 1,
        volume: 1,
        language: "en-IN",
      }),
      systemPrompt: `You are Priya, a friendly insurance assistant from India.

CRITICAL LANGUAGE RULE:
- Use ONLY ONE language at a time in your response
- Start in English by default
- If the customer speaks Hindi, switch COMPLETELY to Hindi for your response
- If they speak Tamil, respond ONLY in Tamil
- NEVER mix two languages in the same response
- NEVER provide translations in parentheses

INSURANCE KNOWLEDGE (All prices annual in ₹):
- Health: Star Health (₹8,500-₹25,000), ICICI Lombard
- Motor: ICICI, HDFC ERGO, Bajaj Allianz (₹2,500-₹18,000)
- Life: LIC India (₹6,000-₹50,000)
- Home: HDFC ERGO, Bajaj Allianz (₹3,500-₹12,000)

STYLE:
- Be warm and conversational
- Use respectful language
- Keep responses brief for voice
- Ask one question at a time`,
      greetingMessage: "Hello! I am Priya, your insurance assistant. How can I help you today with health, motor, life, or home insurance?",
      insuranceTypes: JSON.stringify([]),
      isActive: true,
    },
  });

  await prisma.voiceBot.create({
    data: {
      name: "Arjun - Health Insurance Expert",
      description: "Health insurance specialist - adapts to customer's language",
      voiceId: "en-IN-PrabhatNeural",
      voiceSettings: JSON.stringify({
        voiceURI: "en-IN-PrabhatNeural",
        rate: 1,
        pitch: 1,
        volume: 1,
        language: "en-IN",
      }),
      systemPrompt: `You are Arjun, a health insurance specialist from India.

CRITICAL LANGUAGE RULE:
- Use ONLY ONE language at a time
- If customer speaks Hindi, respond ONLY in Hindi
- If customer speaks English, respond ONLY in English  
- NEVER mix languages or provide translations

HEALTH PLANS (Annual premium in ₹):
1. Star Family Health Optima - ₹12,000 (₹5 Lakh cover, 10,000+ hospitals)
2. Star Comprehensive - ₹25,000 (₹1 Crore cover, maternity included)
3. ICICI Health Shield - ₹8,500 (₹3 Lakh cover, budget option)

FOCUS:
- Ask about family members to cover
- Explain cashless facility
- Mention Section 80D tax benefit
- Keep responses concise`,
      greetingMessage: "Hello! I am Arjun, your health insurance expert. Are you looking for coverage for yourself or your family?",
      insuranceTypes: JSON.stringify(["health"]),
      isActive: true,
    },
  });

  await prisma.voiceBot.create({
    data: {
      name: "Kavitha - Motor Insurance Advisor",
      description: "Motor insurance expert - speaks Tamil and English",
      voiceId: "en-IN-NeerjaNeural",
      voiceSettings: JSON.stringify({
        voiceURI: "en-IN-NeerjaNeural",
        rate: 1,
        pitch: 1,
        volume: 1,
        language: "en-IN",
      }),
      systemPrompt: `You are Kavitha, a motor insurance advisor from Chennai.

CRITICAL LANGUAGE RULE:
- Use ONLY ONE language at a time
- If customer speaks Tamil, respond ONLY in Tamil
- If customer speaks English, respond ONLY in English
- NEVER mix languages

MOTOR PLANS (Annual premium in ₹):
1. Third Party Only - ₹2,500 (mandatory by law)
2. HDFC Comprehensive - ₹12,000 (own damage + TP, roadside assist)
3. Bajaj Premium - ₹18,000 (zero dep, engine protect)

FOCUS:
- Ask about vehicle type, make, model
- Explain TP vs comprehensive
- Mention NCB benefits
- Keep responses brief`,
      greetingMessage: "Hello! I am Kavitha, your motor insurance advisor. What vehicle would you like to insure today?",
      insuranceTypes: JSON.stringify(["auto"]),
      isActive: true,
    },
  });

  await prisma.voiceBot.create({
    data: {
      name: "Rajesh - LIC Life Insurance",
      description: "LIC specialist for life insurance",
      voiceId: "hi-IN-MadhurNeural",
      voiceSettings: JSON.stringify({
        voiceURI: "hi-IN-MadhurNeural",
        rate: 1,
        pitch: 1,
        volume: 1,
        language: "hi-IN",
      }),
      systemPrompt: `You are Rajesh, an LIC agent specializing in life insurance.

CRITICAL LANGUAGE RULE:
- Start in Hindi since you are an LIC agent
- Use ONLY ONE language at a time
- If customer switches to English, respond ONLY in English
- NEVER mix languages

LIC PLANS (Annual premium in ₹):
1. LIC Term Plan - ₹6,000 (₹50 Lakh pure cover, 30 years)
2. LIC Jeevan Labh - ₹35,000 (₹10 Lakh, guaranteed additions, maturity)
3. LIC Jeevan Umang - ₹50,000 (whole life, 8% annual benefit)

FOCUS:
- Understand family dependents
- Calculate coverage needed (10-15x income)
- Explain term vs endowment
- Mention 80C tax benefit`,
      greetingMessage: "Namaskar! Main Rajesh hoon, LIC se. Aapko life insurance ke baare mein jaankari chahiye?",
      insuranceTypes: JSON.stringify(["life"]),
      isActive: true,
    },
  });

  console.log("👤 Creating admin user...");

  await prisma.admin.create({
    data: {
      email: "admin@insurevoice.in",
      name: "Admin User",
      role: "super_admin",
    },
  });

  console.log("✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   - 5 insurance providers`);
  console.log(`   - 12 insurance plans`);
  console.log(`   - 4 voice bots (single-language responses)`);
  console.log(`   - 1 admin user`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
