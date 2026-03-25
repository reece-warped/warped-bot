# warped-bot

A lightweight Node.js bot that posts a Discord notification whenever someone goes live on Twitch streaming your game.

---

## Prerequisites

- **Node.js 18 or newer** — [Download here](https://nodejs.org)
- A **Twitch Developer account** (free) — sign in at [dev.twitch.tv](https://dev.twitch.tv)
- A **Discord server** where you have permission to create webhooks

---

## Setup

### 1. Create a Twitch Application

1. Go to [https://dev.twitch.tv/console](https://dev.twitch.tv/console) and log in.
2. Click **Register Your Application**.
3. Fill in the form:
   - **Name:** anything you like (e.g. `warped-bot`)
   - **OAuth Redirect URLs:** `http://localhost` (required but unused)
   - **Category:** select **Chat Bot** or **Other**
4. Click **Create**.
5. On the next page, click **Manage** next to your new app.
6. Copy your **Client ID** — you'll need this.
7. Click **New Secret**, then copy the **Client Secret** — you'll need this too.
   > Keep your Client Secret private. Never commit it to git.

---

### 2. Create a Discord Webhook

1. Open Discord and go to the channel where you want notifications posted.
2. Click the gear icon next to the channel name (**Edit Channel**).
3. Go to **Integrations** → **Webhooks** → **New Webhook**.
4. Give it a name (e.g. `warped-bot`) and optionally set an avatar.
5. Click **Copy Webhook URL** — you'll need this.
6. Click **Save**.

---

### 3. Configure the Bot

1. In the project folder, copy `.env.example` to a new file called `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` in a text editor and fill in your values:

   ```env
   TWITCH_CLIENT_ID=abc123yourid
   TWITCH_CLIENT_SECRET=xyz789yoursecret
   TWITCH_GAME_NAME=Minecraft
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   POLL_INTERVAL_MS=120000
   ```

   > **Important:** `TWITCH_GAME_NAME` must match the Twitch category name **exactly** as it appears on Twitch — including capitalisation and punctuation. For example, use `"PUBG: BATTLEGROUNDS"` not `"pubg"`.

---

### 4. Install Dependencies

```bash
npm install
```

---

### 5. Run the Bot

```bash
npm start
```

You should see output like:

```
[2025-01-01T12:00:00.000Z] [Startup] warped-bot starting...
[2025-01-01T12:00:00.000Z] [Startup] Game: "Minecraft" | Poll interval: 120s
[2025-01-01T12:00:00.000Z] [Twitch] Access token fetched successfully.
[2025-01-01T12:00:00.000Z] [Twitch] Resolved game "Minecraft" → ID 27471
[2025-01-01T12:00:00.000Z] [Startup] Ready. Starting poll loop.
[2025-01-01T12:00:00.000Z] [Poll] No new streams. 42 live, 0 already notified.
```

Every 2 minutes, it will check Twitch for new streams. When one is found, it posts a rich embed to your Discord channel.

---

## Keeping it Running

To keep the bot running after you close your terminal, use a process manager.

**With PM2** (recommended for VPS/Linux):
```bash
npm install -g pm2
pm2 start src/index.js --name warped-bot
pm2 save
pm2 startup   # follow the printed command to auto-start on reboot
```

**With systemd** (Linux):

Create `/etc/systemd/system/warped-bot.service`:
```ini
[Unit]
Description=warped-bot Twitch notifier
After=network.target

[Service]
WorkingDirectory=/path/to/warped-bot
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
EnvironmentFile=/path/to/warped-bot/.env

[Install]
WantedBy=multi-user.target
```
Then: `sudo systemctl enable --now warped-bot`

---

## Troubleshooting

**"Could not find game 'XYZ' on Twitch"**
The game name in your `.env` doesn't match any Twitch category exactly. Go to Twitch, search for the game, and copy the category name character-for-character (including colons, ampersands, etc.).

**No notifications are appearing**
- Check that your Discord webhook URL is correct and the webhook hasn't been deleted.
- Make sure there are actually streams live for your game right now. You can verify at `https://www.twitch.tv/directory/game/YOUR+GAME+NAME`.
- Check the console logs for any errors.

**"Twitch auth failed"**
Double-check your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` in `.env`. Make sure there are no extra spaces or quotes.

**Bot posts the same stream repeatedly**
This shouldn't happen with normal use. If it does, check that nothing is restarting the process repeatedly — each restart clears the in-memory notification tracking.

**Discord says "Invalid Webhook Token"**
Your webhook URL has been deleted or regenerated. Create a new webhook in Discord and update `DISCORD_WEBHOOK_URL` in your `.env`.
