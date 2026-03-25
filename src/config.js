// Load .env if present (local development). In GitHub Actions, secrets are injected as env vars.
try {
  const { config: dotenvConfig } = await import('dotenv');
  dotenvConfig();
} catch {
  // dotenv not available or .env not present — that's fine in CI
}

const required = [
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_GAME_NAME',
  'DISCORD_WEBHOOK_URL',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`[Config] Missing required environment variable: ${key}`);
    console.error('[Config] In GitHub Actions: add it as a repository secret.');
    console.error('[Config] Locally: copy .env.example to .env and fill in all values.');
    process.exit(1);
  }
}

export const config = {
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
  twitchGameName: process.env.TWITCH_GAME_NAME,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
};
