import { BotForm } from "@/components/admin/BotForm";

export default function NewBotPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create Voice Bot</h1>
        <p className="text-muted-foreground">
          Configure a new AI voice assistant for insurance sales
        </p>
      </div>

      <BotForm />
    </div>
  );
}
