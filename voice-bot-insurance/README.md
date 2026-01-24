# InsureVoice - AI Voice Bot Insurance Platform

A web-based AI voice bot platform that enables users to purchase insurance from multiple providers through natural voice conversations.

## Features

- **Voice Interaction**: Browser-based voice conversations using Web Speech API
- **Multiple Insurance Types**: Health, Auto, Life, and Home insurance
- **Admin Dashboard**: Create and manage voice bots, configure prompts, view call history
- **Consumer Marketplace**: Browse providers, compare plans, get voice assistance
- **AI-Powered**: OpenAI GPT-4 for natural conversation with function calling
- **Voice Customization**: Select voice, adjust rate, pitch, and volume

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI API with function calling
- **Voice**: Web Speech API (SpeechRecognition + SpeechSynthesis)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key (optional - demo mode works without it)

### Installation

1. Clone the repository and navigate to the project:

```bash
cd voice-bot-insurance
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
# Edit .env file with your OpenAI API key
OPENAI_API_KEY="sk-your-openai-api-key-here"
```

4. Set up the database:

```bash
npx prisma db push
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
voice-bot-insurance/
├── app/
│   ├── (admin)/              # Admin dashboard pages
│   │   ├── admin/
│   │   │   ├── bots/         # Bot management
│   │   │   └── calls/        # Call history
│   │   └── layout.tsx
│   ├── (consumer)/           # Consumer-facing pages
│   │   ├── call/             # Voice interaction
│   │   ├── providers/        # Insurance providers
│   │   └── page.tsx          # Homepage
│   └── api/                  # API routes
│       ├── bots/
│       ├── chat/
│       └── providers/
├── components/
│   ├── admin/                # Admin components
│   ├── voice/                # Voice interaction components
│   └── ui/                   # shadcn/ui components
├── hooks/
│   ├── use-speech-recognition.ts
│   └── use-speech-synthesis.ts
├── lib/
│   ├── db.ts                 # Prisma client
│   ├── llm.ts                # OpenAI integration
│   └── speech.ts             # Web Speech API utilities
└── prisma/
    ├── schema.prisma         # Database schema
    └── seed.ts               # Seed data
```

## Usage

### Consumer Flow

1. Visit the homepage at [http://localhost:3000](http://localhost:3000)
2. Click "Start Voice Call" or navigate to Talk to Agent
3. Allow microphone access when prompted
4. Speak naturally to explore insurance options
5. The AI assistant will guide you through the process

### Admin Dashboard

1. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin)
2. Create new voice bots with custom prompts
3. Configure voice settings (voice, rate, pitch)
4. View call history and analytics

## Voice Bot Configuration

Each voice bot can be configured with:

- **Name & Description**: Identify the bot's purpose
- **Voice Settings**: Select system voice, adjust rate/pitch/volume
- **System Prompt**: Define the bot's personality and behavior
- **Greeting Message**: Initial message when call starts
- **Insurance Types**: Specialize the bot for specific insurance types

## API Endpoints

- `GET/POST /api/bots` - List/create voice bots
- `GET/PUT/DELETE /api/bots/[id]` - Manage specific bot
- `POST /api/chat` - Send message and get AI response
- `GET /api/providers` - List insurance providers

## Browser Support

- **Chrome/Edge**: Full support for voice features
- **Safari**: Partial support (speech synthesis only)
- **Firefox**: Requires enabling speech recognition flag

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Database commands
npm run db:seed     # Seed database
npm run db:studio   # Open Prisma Studio
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | SQLite database path | Yes (default: file:./dev.db) |
| OPENAI_API_KEY | OpenAI API key | No (demo mode available) |
| NEXTAUTH_SECRET | NextAuth secret | No |
| NEXTAUTH_URL | NextAuth URL | No |

## License

MIT
