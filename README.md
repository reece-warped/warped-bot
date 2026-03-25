# warped-bot

A GitHub Actions bot that posts a Discord notification whenever someone goes live on Twitch streaming your game. Runs every 5 minutes for free on GitHub's infrastructure — no server required.

---

## How It Works

Every 5 minutes, GitHub Actions runs the bot. It:
1. Fetches live Twitch streams for your game
2. Compares them against `data/notified.json` (streams already notified)
3. Posts a Discord embed for any new streams
4. Commits the updated `data/notified.json` back to the repo

---

## Setup

### 1. Get Your Twitch Credentials

1. Go to [https://dev.twitch.tv/console](https://dev.twitch.tv/console) and log in.
2. Click **Register Your Application**.
3. Fill in the form:
   - **Name:** anything you like (e.g. `warped-bot`)
   - **OAuth Redirect URLs:** `http://localhost`
   - **Category:** Chat Bot or Other
4. Click **Create**, then **Manage** next to your new app.
5. Copy your **Client ID**.
6. Click **New Secret** and copy the **Client Secret**.

### 2. Create a Discord Webhook

1. In Discord, open the channel where you want notifications.
2. Click the gear icon → **Integrations** → **Webhooks** → **New Webhook**.
3. Give it a name, then click **Copy Webhook URL**.

### 3. Push the Repo to GitHub

If you haven't already, create a new GitHub repository and push this project to it:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/warped-bot.git
git push -u origin main
```

### 4. Add Repository Secrets

1. On GitHub, go to your repo → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret** for each of the following:

| Secret name | Value |
|---|---|
| `TWITCH_CLIENT_ID` | Your Twitch app Client ID |
| `TWITCH_CLIENT_SECRET` | Your Twitch app Client Secret |
| `TWITCH_GAME_NAME` | `Warped Universe` (must match the Twitch category exactly) |
| `DISCORD_WEBHOOK_URL` | Your Discord webhook URL |

### 5. Enable the Workflow

The workflow runs automatically once the secrets are set. You can also trigger it manually to test:

1. Go to the **Actions** tab in your GitHub repo.
2. Click **Check Twitch Streams** in the left sidebar.
3. Click **Run workflow** → **Run workflow**.

Watch the run logs to confirm everything is working.

---

## Local Testing

You can run the bot locally for testing:

```bash
cp .env.example .env
# fill in your values in .env
npm install
node src/index.js
```

---

## Troubleshooting

**"Could not find game 'XYZ' on Twitch"**
The `TWITCH_GAME_NAME` secret doesn't match any Twitch category. Go to Twitch, search for the game, and copy the category name exactly — including capitalisation and punctuation.

**No notifications appearing**
- Check the Actions run logs for errors.
- Confirm there are streams live for your game right now at `https://www.twitch.tv/directory/game/Warped+Universe`.
- Verify your Discord webhook URL is correct and hasn't been deleted.

**"Twitch auth failed"**
Double-check your `TWITCH_CLIENT_ID` and `TWITCH_CLIENT_SECRET` secrets — no extra spaces.

**Bot notifies for the same stream every run**
The commit step may not be pushing `data/notified.json` back. Check the "Commit notified streams data" step in the Actions log for errors.

**Workflow isn't running every 5 minutes**
GitHub Actions may delay scheduled workflows by up to a few minutes under high load. Also note: GitHub automatically disables scheduled workflows on repos with no activity after 60 days — just re-enable them from the Actions tab.
