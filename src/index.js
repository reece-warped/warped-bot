import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from './config.js';
import { fetchAccessToken, resolveGameId, getLiveStreams, getUserProfiles } from './twitch.js';
import { postStreamNotification, sleep } from './discord.js';

const NOTIFIED_FILE = 'data/notified.json';

function timestamp() {
  return new Date().toISOString();
}

function loadNotified() {
  if (!existsSync(NOTIFIED_FILE)) return [];
  try {
    return JSON.parse(readFileSync(NOTIFIED_FILE, 'utf8'));
  } catch {
    console.error(`[${timestamp()}] [State] Could not parse ${NOTIFIED_FILE}, starting fresh.`);
    return [];
  }
}

function saveNotified(entries) {
  writeFileSync(NOTIFIED_FILE, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

async function run() {
  console.log(`[${timestamp()}] [Startup] warped-bot starting (single-shot mode).`);
  console.log(`[${timestamp()}] [Startup] Game: "${config.twitchGameName}"`);

  await fetchAccessToken();
  const gameId = await resolveGameId(config.twitchGameName);

  const liveStreams = await getLiveStreams(gameId);
  const liveIds = new Set(liveStreams.map(s => s.id));

  console.log(`[${timestamp()}] [Poll] ${liveStreams.length} stream(s) currently live.`);

  // Load persisted state and remove entries that are no longer live
  const notified = loadNotified().filter(entry => liveIds.has(entry.stream_id));
  const notifiedIds = new Set(notified.map(e => e.stream_id));

  const newStreams = liveStreams.filter(s => !notifiedIds.has(s.id));

  if (newStreams.length === 0) {
    console.log(`[${timestamp()}] [Poll] No new streams to notify.`);
    saveNotified(notified);
    process.exit(0);
  }

  console.log(`[${timestamp()}] [Poll] ${newStreams.length} new stream(s) found. Fetching user profiles...`);

  const userIds = newStreams.map(s => s.user_id);
  const profiles = await getUserProfiles(userIds);

  for (let i = 0; i < newStreams.length; i++) {
    const stream = newStreams[i];
    try {
      await postStreamNotification(stream, profiles[stream.user_id]);
      notified.push({ stream_id: stream.id, user_name: stream.user_name });
      if (i < newStreams.length - 1) await sleep(1000);
    } catch (err) {
      console.error(`[${timestamp()}] [Error] Failed to notify for ${stream.user_name}: ${err.message}`);
    }
  }

  saveNotified(notified);
  console.log(`[${timestamp()}] [Done] Saved ${notified.length} tracked stream(s) to ${NOTIFIED_FILE}.`);
  process.exit(0);
}

run().catch(err => {
  console.error(`[${timestamp()}] [Fatal] ${err.message}`);
  process.exit(1);
});
