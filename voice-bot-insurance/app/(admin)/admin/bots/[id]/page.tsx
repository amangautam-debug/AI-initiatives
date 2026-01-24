import { notFound } from "next/navigation";
import { BotForm } from "@/components/admin/BotForm";
import prisma from "@/lib/db";

async function getBot(id: string) {
  try {
    const bot = await prisma.voiceBot.findUnique({
      where: { id },
    });

    if (!bot) return null;

    return {
      ...bot,
      voiceSettings: JSON.parse(bot.voiceSettings),
      insuranceTypes: JSON.parse(bot.insuranceTypes),
    };
  } catch {
    return null;
  }
}

export default async function EditBotPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bot = await getBot(id);

  if (!bot) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Edit Voice Bot</h1>
        <p className="text-muted-foreground">
          Update configuration for {bot.name}
        </p>
      </div>

      <BotForm bot={bot} />
    </div>
  );
}
