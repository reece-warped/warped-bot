import { config } from './config.js';

const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_BASE = 'https://api.twitch.tv/helix';

let accessToken = null;

function timestamp() {
  return new Date().toISOString();
}

export async function fetchAccessToken() {
  const res = await fetch(TWITCH_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.twitchClientId,
      client_secret: config.twitchClientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitch auth failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  console.log(`[${timestamp()}] [Twitch] Access token fetched successfully.`);
  return accessToken;
}

async function twitchGet(path, retried = false) {
  if (!accessToken) await fetchAccessToken();

  const res = await fetch(`${TWITCH_API_BASE}${path}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Client-Id': config.twitchClientId,
    },
  });

  if (res.status === 401 && !retried) {
    console.log(`[${timestamp()}] [Twitch] Token expired or revoked — refreshing...`);
    await fetchAccessToken();
    return twitchGet(path, true);
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Twitch API error on ${path} (${res.status}): ${text}`);
  }

  return res.json();
}

export async function resolveGameId(gameName) {
  const data = await twitchGet(`/games?name=${encodeURIComponent(gameName)}`);
  if (!data.data || data.data.length === 0) {
    console.error(
      `[${timestamp()}] [Twitch] Could not find game "${gameName}" on Twitch.\n` +
      `Make sure you're using the exact category name as it appears on Twitch (e.g. "Minecraft" not "minecraft").`
    );
    process.exit(1);
  }
  const game = data.data[0];
  console.log(`[${timestamp()}] [Twitch] Resolved game "${gameName}" → ID ${game.id}`);
  return game.id;
}

export async function getLiveStreams(gameId) {
  const streams = [];
  let cursor = null;

  do {
    const query = `/streams?game_id=${gameId}&first=100${cursor ? `&after=${cursor}` : ''}`;
    const data = await twitchGet(query);
    streams.push(...data.data);
    cursor = data.pagination?.cursor || null;
  } while (cursor);

  return streams;
}

export async function getUserProfiles(userIds) {
  if (userIds.length === 0) return {};

  // Twitch allows up to 100 user IDs per request
  const query = userIds.map(id => `id=${id}`).join('&');
  const data = await twitchGet(`/users?${query}`);

  const profiles = {};
  for (const user of data.data) {
    profiles[user.id] = user;
  }
  return profiles;
}
