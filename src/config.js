import 'dotenv/config';

const required = [
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_GAME_NAME',
  'DISCORD_WEBHOOK_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Missing required environment variable: ${key}`);
    console.error('[Config] Copy .env.example to .env and fill in all values.');
    process.exit(1);
  }
}

export const config = {
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
  twitchGameName: process.env.TWITCH_GAME_NAME,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '120000', 10),
};
