import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Language detection and voice mapping
export const LANGUAGE_VOICE_MAP: Record<string, string> = {
  "en-IN": "en-IN-NeerjaNeural",
  "hi-IN": "hi-IN-SwaraNeural",
  "ta-IN": "ta-IN-PallaviNeural",
  "te-IN": "te-IN-ShrutiNeural",
  "kn-IN": "kn-IN-SapnaNeural",
  "ml-IN": "ml-IN-SobhanaNeural",
  "mr-IN": "mr-IN-AarohiNeural",
  "bn-IN": "bn-IN-TanishaaNeural",
  "gu-IN": "gu-IN-DhwaniNeural",
  "pa-IN": "pa-IN-GurpreetNeural",
};

// Insurance-related function definitions for function calling
export const insuranceFunctions: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_insurance_quote",
      description: "Get an insurance quote based on user information",
      parameters: {
        type: "object",
        properties: {
          insuranceType: {
            type: "string",
            enum: ["health", "auto", "life", "home"],
            description: "The type of insurance",
          },
          userInfo: {
            type: "object",
            properties: {
              age: { type: "number", description: "User's age" },
              name: { type: "string", description: "User's full name" },
              email: { type: "string", description: "User's email address" },
              phone: { type: "string", description: "User's phone number" },
            },
            required: ["name"],
          },
          coverageAmount: {
            type: "number",
            description: "Desired coverage amount in INR",
          },
        },
        required: ["insuranceType", "userInfo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_insurance_plans",
      description: "List available insurance plans for a specific type",
      parameters: {
        type: "object",
        properties: {
          insuranceType: {
            type: "string",
            enum: ["health", "auto", "life", "home"],
            description: "The type of insurance to list plans for",
          },
        },
        required: ["insuranceType"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_user_info",
      description: "Save user information collected during the conversation",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "User's full name" },
          email: { type: "string", description: "User's email address" },
          phone: { type: "string", description: "User's phone number" },
          age: { type: "number", description: "User's age" },
          address: { type: "string", description: "User's address" },
          city: { type: "string", description: "User's city" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "schedule_callback",
      description: "Schedule a callback from an insurance agent",
      parameters: {
        type: "object",
        properties: {
          preferredTime: {
            type: "string",
            description: "Preferred callback time",
          },
          phone: {
            type: "string",
            description: "Phone number to call back",
          },
          topic: {
            type: "string",
            description: "Topic to discuss during callback",
          },
        },
        required: ["phone", "topic"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "detect_language",
      description: "Detect the language used by the customer and respond accordingly",
      parameters: {
        type: "object",
        properties: {
          detectedLanguage: {
            type: "string",
            enum: ["en-IN", "hi-IN", "ta-IN", "te-IN", "kn-IN", "ml-IN", "mr-IN", "bn-IN", "gu-IN", "pa-IN"],
            description: "The detected language code",
          },
          languageName: {
            type: "string",
            description: "Human readable language name",
          },
        },
        required: ["detectedLanguage", "languageName"],
      },
    },
  },
];

// Function to handle function calls
export async function handleFunctionCall(
  functionName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (functionName) {
    case "get_insurance_quote": {
      // Simulate getting a quote (prices in INR)
      const type = args.insuranceType as string;
      const basePrice = {
        health: 12000,
        auto: 8000,
        life: 15000,
        home: 5000,
      }[type] || 10000;

      const quote = basePrice + Math.floor(Math.random() * 5000);
      return JSON.stringify({
        success: true,
        quote: {
          annualPremium: quote,
          monthlyPremium: Math.round(quote / 12),
          coverage: args.coverageAmount || "Standard",
          insuranceType: type,
          currency: "INR",
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    case "list_insurance_plans": {
      const type = args.insuranceType as string;
      const plans = {
        health: [
          { name: "Star Family Health Optima", premium: 12000, coverage: "5 lakh rupees floater" },
          { name: "Star Comprehensive", premium: 25000, coverage: "1 crore rupees cover" },
          { name: "ICICI Health Shield", premium: 8500, coverage: "3 lakh rupees cover" },
        ],
        auto: [
          { name: "Third Party Only", premium: 2500, coverage: "Third party liability" },
          { name: "HDFC Comprehensive", premium: 12000, coverage: "Own damage plus third party" },
          { name: "Bajaj Premium", premium: 18000, coverage: "Zero depreciation plus engine" },
        ],
        life: [
          { name: "LIC Term Plan", premium: 6000, coverage: "50 lakh rupees term" },
          { name: "LIC Jeevan Labh", premium: 35000, coverage: "10 lakh rupees endowment" },
          { name: "LIC Jeevan Umang", premium: 50000, coverage: "Whole life" },
        ],
        home: [
          { name: "HDFC Home Shield Basic", premium: 3500, coverage: "25 lakh rupees building" },
          { name: "Bajaj Home Plus", premium: 6500, coverage: "50 lakh rupees plus contents" },
          { name: "HDFC My Home Premium", premium: 12000, coverage: "1 crore rupees all risk" },
        ],
      };

      return JSON.stringify({
        success: true,
        plans: plans[type as keyof typeof plans] || [],
        insuranceType: type,
        currency: "INR",
        premiumType: "Annual",
      });
    }

    case "save_user_info": {
      return JSON.stringify({
        success: true,
        message: "User information saved successfully",
        savedInfo: args,
      });
    }

    case "schedule_callback": {
      return JSON.stringify({
        success: true,
        message: "Callback scheduled successfully",
        callbackDetails: {
          phone: args.phone,
          preferredTime: args.preferredTime || "Next business day",
          topic: args.topic,
          referenceNumber: `CB-${Date.now()}`,
        },
      });
    }

    case "detect_language": {
      return JSON.stringify({
        success: true,
        detectedLanguage: args.detectedLanguage,
        languageName: args.languageName,
        voiceToUse: LANGUAGE_VOICE_MAP[args.detectedLanguage as string] || "en-IN-NeerjaNeural",
      });
    }

    default:
      return JSON.stringify({ error: "Unknown function" });
  }
}

// Main chat completion function
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatCompletionResult {
  message: string;
  functionResults?: Record<string, unknown>;
  detectedLanguage?: string;
  voiceToUse?: string;
}

// Language detection prompt addition
const LANGUAGE_DETECTION_PROMPT = `
CRITICAL LANGUAGE RULES - VERY IMPORTANT:
1. Use ONLY ONE language in your entire response
2. NEVER mix two languages in the same response
3. NEVER provide translations in parentheses or after a slash
4. If user speaks Hindi, respond COMPLETELY in Hindi only
5. If user speaks English, respond COMPLETELY in English only
6. If user speaks Tamil/Telugu/Kannada etc., respond only in that language

WRONG EXAMPLES (never do this):
- "Namaste! Main Priya hoon / Hello! I'm Priya" ❌
- "Health insurance ke liye (for health insurance)" ❌
- "Thank you, dhanyavaad!" ❌

CORRECT EXAMPLES:
- If user says "mujhe insurance chahiye" → respond only in Hindi
- If user says "I need insurance" → respond only in English

LANGUAGE CODES:
- English (India): en-IN
- Hindi: hi-IN
- Tamil: ta-IN
- Telugu: te-IN
- Kannada: kn-IN
- Malayalam: ml-IN
- Marathi: mr-IN
- Bengali: bn-IN
- Gujarati: gu-IN
- Punjabi: pa-IN

When you detect the user's language, call the detect_language function to update the voice.
`;

export async function getChatCompletion(
  messages: ChatMessage[],
  systemPrompt: string,
  userLanguage?: string
): Promise<ChatCompletionResult> {
  // Enhance system prompt with language detection
  const enhancedPrompt = `${systemPrompt}\n\n${LANGUAGE_DETECTION_PROMPT}${
    userLanguage ? `\n\nCurrent detected language: ${userLanguage}` : ""
  }`;

  const systemMessage: ChatCompletionMessageParam = {
    role: "system",
    content: enhancedPrompt,
  };

  const formattedMessages: ChatCompletionMessageParam[] = [
    systemMessage,
    ...messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: formattedMessages,
      tools: insuranceFunctions,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 150,
    });

    const choice = response.choices[0];
    const message = choice.message;

    let detectedLanguage = userLanguage;
    let voiceToUse = userLanguage ? LANGUAGE_VOICE_MAP[userLanguage] : undefined;

    // Check if there are function calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const functionResults: Record<string, unknown> = {};

      for (const toolCall of message.tool_calls) {
        if (toolCall.type === "function") {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          const result = await handleFunctionCall(functionName, args);
          const parsedResult = JSON.parse(result);
          functionResults[functionName] = parsedResult;

          if (functionName === "detect_language" && parsedResult.success) {
            detectedLanguage = parsedResult.detectedLanguage;
            voiceToUse = parsedResult.voiceToUse;
          }
        }
      }

      const functionMessages: ChatCompletionMessageParam[] = [
        ...formattedMessages,
        message as ChatCompletionMessageParam,
        ...message.tool_calls
          .filter((tc): tc is typeof tc & { type: "function" } => tc.type === "function")
          .map((toolCall) => ({
            role: "tool" as const,
            tool_call_id: toolCall.id,
            content: JSON.stringify(functionResults[toolCall.function.name]),
          })),
      ];

      const followUpResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: functionMessages,
        temperature: 0.7,
        max_tokens: 150,
      });

      return {
        message: followUpResponse.choices[0].message.content || "Sorry, I didn't understand.",
        functionResults,
        detectedLanguage,
        voiceToUse,
      };
    }

    return {
      message: message.content || "Sorry, please try again.",
      detectedLanguage,
      voiceToUse,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback: Demo responses when API key not set
    if (process.env.OPENAI_API_KEY === "sk-your-openai-api-key-here" || !process.env.OPENAI_API_KEY) {
      return getDemoResponse(messages[messages.length - 1]?.content || "", userLanguage, messages);
    }
    
    throw error;
  }
}

// Demo response function for when OpenAI API is not configured
function getDemoResponse(userMessage: string, currentLanguage?: string, allMessages?: ChatMessage[]): ChatCompletionResult {
  const lowerMessage = userMessage.toLowerCase();
  
  // Detect Hindi
  const hindiPattern = /[\u0900-\u097F]|kya|kaise|chahiye|mujhe|hai|hain|aap|main|hum|bima|swasthya|jeevan/i;
  const isHindi = hindiPattern.test(userMessage);
  
  // Use provided language or detect from message
  const detectedLanguage = currentLanguage || (isHindi ? "hi-IN" : "en-IN");
  const voiceToUse = LANGUAGE_VOICE_MAP[detectedLanguage];

  // Get conversation context from previous messages
  const conversationContext = allMessages?.map(m => m.content.toLowerCase()).join(" ") || "";
  const isLifeInsuranceContext = conversationContext.includes("life") || conversationContext.includes("lic") || conversationContext.includes("jeevan");
  const isHealthContext = conversationContext.includes("health") || conversationContext.includes("medical");

  // Handle clarification questions about terms
  if (lowerMessage.includes("what do you mean") || lowerMessage.includes("meaning") || lowerMessage.includes("explain") || lowerMessage.includes("what is")) {
    if (lowerMessage.includes("family") || lowerMessage.includes("situation")) {
      return {
        message: "By family situation, I mean whether you are single, married, or have dependents like children or elderly parents. This helps us recommend the right coverage amount. For example, if you have a spouse and two children, you might need higher coverage. Are you married with dependents?",
        detectedLanguage,
        voiceToUse,
      };
    }
    if (lowerMessage.includes("age")) {
      return {
        message: "Your age is important because insurance premiums are calculated based on age. Younger people generally get lower premiums. Also, some plans have age limits. Could you please share your age?",
        detectedLanguage,
        voiceToUse,
      };
    }
    if (lowerMessage.includes("term") || lowerMessage.includes("plan")) {
      return {
        message: "A term plan provides pure life cover for a specific period, like 20 or 30 years. If something happens to you during this term, your family gets the sum assured. It's the most affordable type of life insurance. Would you like to know more about term plans?",
        detectedLanguage,
        voiceToUse,
      };
    }
    if (lowerMessage.includes("endowment") || lowerMessage.includes("labh")) {
      return {
        message: "An endowment plan like Jeevan Labh combines insurance with savings. You pay premiums for a period, and at maturity you get a lump sum even if you survive. It's good for wealth creation along with protection. Should I explain the benefits?",
        detectedLanguage,
        voiceToUse,
      };
    }
    return {
      message: "I'd be happy to explain! Could you please specify which term or concept you'd like me to clarify?",
      detectedLanguage,
      voiceToUse,
    };
  }

  // Handle age mentions with context
  if (lowerMessage.match(/\b(age|aged?)\s*(is)?\s*\d+\b/) || lowerMessage.match(/\b(i am|i'm|im)\s*\d+\b/) || lowerMessage.match(/\b\d+\s*(years?|yrs?)\s*(old)?\b/)) {
    const ageMatch = lowerMessage.match(/\d+/);
    const age = ageMatch ? parseInt(ageMatch[0]) : 30;
    
    if (isLifeInsuranceContext) {
      if (age < 35) {
        return {
          message: `Great! At ${age}, you can get excellent rates on life insurance. For a 50 lakh rupees term cover, the premium would be around 6000 rupees per year. Are you married or single? This will help me suggest the right coverage.`,
          detectedLanguage,
          voiceToUse,
        };
      } else if (age < 50) {
        return {
          message: `At ${age}, you're in a good age bracket for life insurance. For a 50 lakh rupees term cover, premium would be around 12000 rupees per year. Do you have any dependents like spouse or children who need to be covered?`,
          detectedLanguage,
          voiceToUse,
        };
      } else {
        return {
          message: `At ${age}, I'd recommend looking at our Jeevan Umang whole life plan which provides coverage till 99 years. Premium would be around 50000 rupees for good coverage. Would you like details on this?`,
          detectedLanguage,
          voiceToUse,
        };
      }
    }
    
    if (isHealthContext) {
      return {
        message: `At ${age}, you have great health insurance options. Star Family Health Optima offers 5 lakh rupees coverage for about ${age < 35 ? "8000" : "15000"} rupees per year. Do you want individual cover or family floater?`,
        detectedLanguage,
        voiceToUse,
      };
    }

    return {
      message: `Thanks! At ${age}, you're eligible for all our insurance plans. Which type interests you - health, life, motor, or home insurance?`,
      detectedLanguage,
      voiceToUse,
    };
  }

  // Handle family situation responses
  if (lowerMessage.includes("married") || lowerMessage.includes("wife") || lowerMessage.includes("husband") || lowerMessage.includes("spouse")) {
    return {
      message: "Since you're married, I'd recommend a coverage of at least 75 lakh to 1 crore rupees to ensure your spouse is well protected. Do you have children as well?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("single") || lowerMessage.includes("unmarried") || lowerMessage.includes("not married")) {
    return {
      message: "For a single person, a 25 to 50 lakh rupees term cover is usually sufficient. This can cover any loans or support for parents. Would you like me to calculate a quote for you?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("child") || lowerMessage.includes("kid") || lowerMessage.includes("children") || lowerMessage.includes("son") || lowerMessage.includes("daughter")) {
    return {
      message: "With children, I'd recommend higher coverage, at least 1 crore rupees, to secure their education and future. Our L I C Jeevan Labh also has a premium waiver benefit if something happens to you. Shall I explain the plans?",
      detectedLanguage,
      voiceToUse,
    };
  }

  // Handle repetition complaints
  if (lowerMessage.includes("repeat") || lowerMessage.includes("already said") || lowerMessage.includes("told you") || lowerMessage.includes("again")) {
    return {
      message: "I apologize for the confusion. Let me continue from where we were. Based on what you've shared, I can now recommend specific plans. What would you like to know - the premium amount, coverage details, or claim process?",
      detectedLanguage,
      voiceToUse,
    };
  }

  // Hindi responses - single language only
  if (isHindi || detectedLanguage === "hi-IN") {
    if (lowerMessage.includes("health") || lowerMessage.includes("swasthya") || lowerMessage.includes("mediclaim") || lowerMessage.includes("bima")) {
      return {
        message: "Health insurance ke liye hamare paas teen plans hain. Star Family Health Optima barah hazaar rupaye saalana mein, Star Comprehensive pachees hazaar mein, aur ICICI Health Shield saadhe aath hazaar mein. Aapko kitne log cover karne hain?",
        detectedLanguage: "hi-IN",
        voiceToUse: LANGUAGE_VOICE_MAP["hi-IN"],
      };
    }

    if (lowerMessage.includes("car") || lowerMessage.includes("bike") || lowerMessage.includes("gaadi") || lowerMessage.includes("motor")) {
      return {
        message: "Motor insurance ke liye humari teen policies hain. Third Party sirf dhaai hazaar mein, Comprehensive baarah hazaar mein, aur Premium with Zero Dep atthaarah hazaar mein. Aapki gaadi konsi hai?",
        detectedLanguage: "hi-IN",
        voiceToUse: LANGUAGE_VOICE_MAP["hi-IN"],
      };
    }

    if (lowerMessage.includes("life") || lowerMessage.includes("jeevan") || lowerMessage.includes("lic") || lowerMessage.includes("zindagi")) {
      return {
        message: "LIC se humari teen policies hain. Term Plan chhe hazaar mein pachaas lakh ka cover, Jeevan Labh paintees hazaar mein, aur Jeevan Umang pachaas hazaar mein. Aapki umar kitni hai?",
        detectedLanguage: "hi-IN",
        voiceToUse: LANGUAGE_VOICE_MAP["hi-IN"],
      };
    }

    if (lowerMessage.includes("home") || lowerMessage.includes("ghar") || lowerMessage.includes("makan")) {
      return {
        message: "Ghar ke insurance ke liye HDFC Basic saadhe teen hazaar mein, Bajaj Plus saadhe chhe hazaar mein, aur Premium plan baarah hazaar mein available hai. Aapka ghar apna hai ya rent par?",
        detectedLanguage: "hi-IN",
        voiceToUse: LANGUAGE_VOICE_MAP["hi-IN"],
      };
    }

    return {
      message: "Main aapki madad kar sakti hoon health, motor, life, ya home insurance mein. Aapko kis type ka insurance chahiye?",
      detectedLanguage: "hi-IN",
      voiceToUse: LANGUAGE_VOICE_MAP["hi-IN"],
    };
  }

  // English responses
  if (lowerMessage.includes("health") || lowerMessage.includes("medical")) {
    return {
      message: "For health insurance, we have Star Family Health Optima at 12000 rupees per year, Star Comprehensive at 25000 rupees, and I C I C I Health Shield at 8500 rupees. How many family members do you want to cover?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("auto") || lowerMessage.includes("car") || lowerMessage.includes("bike") || lowerMessage.includes("motor")) {
    return {
      message: "For motor insurance, we offer Third Party at 2500 rupees per year, Comprehensive at 12000 rupees, and Premium with Zero Depreciation at 18000 rupees. What vehicle do you want to insure?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("life") || lowerMessage.includes("lic")) {
    return {
      message: "For life insurance from L I C, we have Term Plan at 6000 rupees for 50 lakh cover, Jeevan Labh at 35000 rupees, and Jeevan Umang at 50000 rupees. May I know your age to suggest the best option?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("home") || lowerMessage.includes("house")) {
    return {
      message: "For home insurance, we have H D F C Basic at 3500 rupees per year, Bajaj Plus at 6500 rupees, and Premium at 12000 rupees. Is your home owned or rented?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("quote") || lowerMessage.includes("price") || lowerMessage.includes("cost") || lowerMessage.includes("premium")) {
    return {
      message: "To give you an accurate quote, please tell me which type of insurance you need - health, motor, life, or home?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("yes") || lowerMessage.includes("sure") || lowerMessage.includes("okay") || lowerMessage.includes("ok")) {
    if (isLifeInsuranceContext) {
      return {
        message: "Great! For life insurance, I'll need a few details. What is your age, and are you married or single?",
        detectedLanguage,
        voiceToUse,
      };
    }
    return {
      message: "Great! What type of insurance are you interested in - health, life, motor, or home?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("thank") || lowerMessage.includes("thanks")) {
    return {
      message: "You're welcome! Is there anything else I can help you with today?",
      detectedLanguage,
      voiceToUse,
    };
  }

  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return {
      message: "Thank you for your interest! Feel free to call back anytime. Have a great day!",
      detectedLanguage,
      voiceToUse,
    };
  }

  // Default response - more conversational
  return {
    message: "I'm here to help with insurance. We offer health, motor, life, and home insurance from top Indian companies. What type would you like to explore?",
    detectedLanguage,
    voiceToUse,
  };
}
