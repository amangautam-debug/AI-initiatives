export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initTelegramBot } = await import('./lib/telegram');
    
    // Start Telegram bot if token is configured
    if (process.env.TELEGRAM_BOT_TOKEN) {
      console.log('[Instrumentation] Starting Telegram bot...');
      const bot = initTelegramBot();
      if (bot) {
        console.log('[Instrumentation] Telegram bot started successfully');
      } else {
        console.log('[Instrumentation] Failed to start Telegram bot');
      }
    } else {
      console.log('[Instrumentation] TELEGRAM_BOT_TOKEN not configured, skipping bot startup');
    }
  }
}
