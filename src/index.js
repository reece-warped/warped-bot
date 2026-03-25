import { config } from './config.js';
import { fetchAccessToken, resolveGameId, getLiveStreams, getUserProfiles } from './twitch.js';
import { postStreamNotification, sleep } from './discord.js';

function timestamp() {
  return new Date().toISOString();
}

// Tracks stream IDs we've already posted a notification for this session
const notifiedStreams = new Set();

let gameId = null;

async function poll() {
  try {
    const liveStreams = await getLiveStreams(gameId);
    const liveIds = new Set(liveStreams.map(s => s.id));

    // Remove streams that are no longer live so they can re-notify if they go live again later
    for (const id of notifiedStreams) {
      if (!liveIds.has(id)) {
        notifiedStreams.delete(id);
      }
    }

    const newStreams = liveStreams.filter(s => !notifiedStreams.has(s.id));

    if (newStreams.length === 0) {
      console.log(`[${timestamp()}] [Poll] No new streams. ${liveStreams.length} live, ${notifiedStreams.size} already notified.`);
      return;
    }

    console.log(`[${timestamp()}] [Poll] Found ${newStreams.length} new stream(s). Fetching user profiles...`);

    const userIds = newStreams.map(s => s.user_id);
    const profiles = await getUserProfiles(userIds);

    for (const stream of newStreams) {
      try {
        await postStreamNotification(stream, profiles[stream.user_id]);
        notifiedStreams.add(stream.id);
        // Stagger posts to avoid Discord rate limits
        if (newStreams.indexOf(stream) < newStreams.length - 1) {
          await sleep(1000);
        }
      } catch (err) {
        console.error(`[${timestamp()}] [Error] Failed to post notification for ${stream.user_name}: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[${timestamp()}] [Error] Poll cycle failed: ${err.message}`);
  }
}

async function start() {
  console.log(`[${timestamp()}] [Startup] warped-bot starting...`);
  console.log(`[${timestamp()}] [Startup] Game: "${config.twitchGameName}" | Poll interval: ${config.pollIntervalMs / 1000}s`);

  await fetchAccessToken();
  gameId = await resolveGameId(config.twitchGameName);

  console.log(`[${timestamp()}] [Startup] Ready. Starting poll loop.`);

  // Run immediately, then on interval
  await poll();
  setInterval(poll, config.pollIntervalMs);
}

start();
