import { config } from './config.js';

const TWITCH_PURPLE = 0x9146FF;

function timestamp() {
  return new Date().toISOString();
}

function buildEmbed(stream, userProfile) {
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '440')
    .replace('{height}', '248');

  const channelUrl = `https://twitch.tv/${stream.user_login}`;

  const embed = {
    title: stream.title || 'No title',
    url: channelUrl,
    color: TWITCH_PURPLE,
    author: {
      name: `${stream.user_name} is now live on Twitch!`,
      url: channelUrl,
      icon_url: userProfile?.profile_image_url || undefined,
    },
    fields: [
      {
        name: 'Game',
        value: stream.game_name || config.twitchGameName,
        inline: true,
      },
      {
        name: 'Viewers',
        value: stream.viewer_count.toLocaleString(),
        inline: true,
      },
    ],
    image: { url: thumbnailUrl },
    timestamp: stream.started_at,
  };

  return embed;
}

export async function postStreamNotification(stream, userProfile) {
  const embed = buildEmbed(stream, userProfile);

  const body = JSON.stringify({
    content: `**${stream.user_name}** just went live!`,
    embeds: [embed],
  });

  const res = await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed (${res.status}): ${text}`);
  }

  console.log(`[${timestamp()}] [Discord] Notification sent for ${stream.user_name}.`);
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
