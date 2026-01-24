import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
            description: "Desired coverage amount in dollars",
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
];

// Function to handle function calls
export async function handleFunctionCall(
  functionName: string,
  args: Record<string, unknown>
): Promise<string> {
  switch (functionName) {
    case "get_insurance_quote": {
      // Simulate getting a quote
      const type = args.insuranceType as string;
      const basePrice = {
        health: 250,
        auto: 150,
        life: 100,
        home: 120,
      }[type] || 200;

      const quote = basePrice + Math.floor(Math.random() * 100);
      return JSON.stringify({
        success: true,
        quote: {
          monthlyPremium: quote,
          annualPremium: quote * 12,
          coverage: args.coverageAmount || "Standard",
          insuranceType: type,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
    }

    case "list_insurance_plans": {
      const type = args.insuranceType as string;
      const plans = {
        health: [
          { name: "Basic Health", premium: 199, coverage: "Essential care" },
          { name: "Premium Health", premium: 349, coverage: "Full coverage" },
          { name: "Family Health", premium: 499, coverage: "Family coverage" },
        ],
        auto: [
          { name: "Liability Only", premium: 89, coverage: "Basic liability" },
          { name: "Comprehensive", premium: 179, coverage: "Full coverage" },
          { name: "Premium Auto", premium: 249, coverage: "Premium protection" },
        ],
        life: [
          { name: "Term Life 10", premium: 25, coverage: "$100,000 - 10 years" },
          { name: "Term Life 20", premium: 45, coverage: "$250,000 - 20 years" },
          { name: "Whole Life", premium: 150, coverage: "Lifetime coverage" },
        ],
        home: [
          { name: "Basic Home", premium: 80, coverage: "Structure only" },
          { name: "Standard Home", premium: 130, coverage: "Structure + contents" },
          { name: "Premium Home", premium: 200, coverage: "Full protection" },
        ],
      };

      return JSON.stringify({
        success: true,
        plans: plans[type as keyof typeof plans] || [],
        insuranceType: type,
      });
    }

    case "save_user_info": {
      // In a real app, this would save to database
      return JSON.stringify({
        success: true,
        message: "User information saved successfully",
        savedInfo: args,
      });
    }

    case "schedule_callback": {
      // Simulate scheduling a callback
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

    default:
      return JSON.stringify({ error: "Unknown function" });
  }
}

// Main chat completion function
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function getChatCompletion(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<{ message: string; functionResults?: Record<string, unknown> }> {
  const systemMessage: ChatCompletionMessageParam = {
    role: "system",
    content: systemPrompt,
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
      max_tokens: 500,
    });

    const choice = response.choices[0];
    const message = choice.message;

    // Check if there are function calls
    if (message.tool_calls && message.tool_calls.length > 0) {
      const functionResults: Record<string, unknown> = {};

      // Process each function call
      for (const toolCall of message.tool_calls) {
        // Type guard for function tool calls
        if (toolCall.type === "function") {
          const functionName = toolCall.function.name;
          const args = JSON.parse(toolCall.function.arguments);
          const result = await handleFunctionCall(functionName, args);
          functionResults[functionName] = JSON.parse(result);
        }
      }

      // Get a follow-up response with function results
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
        max_tokens: 500,
      });

      return {
        message: followUpResponse.choices[0].message.content || "I apologize, I couldn't process that.",
        functionResults,
      };
    }

    return {
      message: message.content || "I apologize, I couldn't understand that. Could you please repeat?",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Fallback response for demo purposes when API key is not set
    if (process.env.OPENAI_API_KEY === "sk-your-openai-api-key-here") {
      return {
        message: getDemoResponse(messages[messages.length - 1]?.content || ""),
      };
    }
    
    throw error;
  }
}

// Demo response function for when OpenAI API is not configured
function getDemoResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("health") || lowerMessage.includes("medical")) {
    return "I'd be happy to help you with health insurance! We have three plans: Basic Health at $199/month, Premium Health at $349/month, and Family Health at $499/month. Which one interests you?";
  }

  if (lowerMessage.includes("auto") || lowerMessage.includes("car")) {
    return "Great choice! For auto insurance, we offer Liability Only at $89/month, Comprehensive at $179/month, and Premium Auto at $249/month. What kind of coverage are you looking for?";
  }

  if (lowerMessage.includes("life")) {
    return "Life insurance is an important decision. We have Term Life 10-year at $25/month, Term Life 20-year at $45/month, and Whole Life at $150/month. Would you like more details on any of these?";
  }

  if (lowerMessage.includes("home") || lowerMessage.includes("house")) {
    return "For home insurance, we offer Basic Home at $80/month, Standard Home at $130/month, and Premium Home at $200/month. What type of property do you need to insure?";
  }

  if (lowerMessage.includes("quote") || lowerMessage.includes("price")) {
    return "To get you an accurate quote, I'll need some information. What type of insurance are you interested in - health, auto, life, or home?";
  }

  if (lowerMessage.includes("name") || lowerMessage.includes("call me")) {
    return "Nice to meet you! To help you better, could you tell me what type of insurance you're looking for today?";
  }

  if (lowerMessage.includes("yes") || lowerMessage.includes("sure") || lowerMessage.includes("okay")) {
    return "Great! Let me help you with that. Could you tell me a bit more about what you're looking for?";
  }

  if (lowerMessage.includes("no") || lowerMessage.includes("not")) {
    return "No problem! Is there anything else I can help you with today?";
  }

  if (lowerMessage.includes("thank")) {
    return "You're welcome! Is there anything else I can help you with regarding insurance today?";
  }

  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Thank you for considering our insurance services! Have a great day, and feel free to call back anytime if you have questions.";
  }

  return "I'm here to help you find the right insurance plan. We offer health, auto, life, and home insurance. Which type would you like to explore?";
}
