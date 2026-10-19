# Buddy – your own AI friend for Android

Buddy is an AI assistant app you can send to anyone. Every copy learns its own
person: their name, how they talk, what they like, the people in their life and
their plans. It all stays on their phone.

**What it can do**

- **Chat about anything**: advice, plans, writing, maths and coding (code shows in copyable boxes).
- **Two brains**:
  - *Free online AI*: smart, and nobody needs a key (you host it free on Cloudflare, see step 2).
  - *On-phone AI*: works with no signal at all and is completely private (a one-off 1.6 GB download inside the app).
  - The app picks the online brain automatically when there's signal and falls back to the phone when there isn't.
- **Optional own key**: add a free Gemini key, a Claude key, or any OpenAI-style service in Settings for an even smarter brain.
- **Voice chat**:
  - Tap the mic, or use hands-free mode (🎧) for a back-and-forth conversation.
  - Pick its voice, pitch and speed.
- **Wake phrase**: say **"hello phone"** even with the app closed. It beeps, listens, answers out loud and keeps the conversation going. Each person can change the phrase. Listening for the phrase happens 100% offline.
- **Learns and remembers**:
  - It builds a profile of the person and saves memories as you chat.
  - It copies the person's slang, humour and emoji style so it feels like one of their own.
  - The 🧠 screen shows everything it knows. You can edit it, delete things or wipe it all.
- **Does things on the phone**:
  - Alarms, timers and reminders.
  - Calling or texting people by name.
  - Email, calendar events and opening apps.
  - Web search, maps, music, torch, volume, battery and the settings pages.
  - Copying text to the clipboard.
- **Screen control** (optional, via Accessibility): it can read what's on screen, tap buttons by name, type, scroll, and press back, home or recents, in any app.
- **Quick-settings button**: pull down from the top of the screen and tap Buddy to talk.

---

## Step 1 – Put the project on GitHub (free, builds the app for you)

1. Make a free account at **github.com**.
2. Click **+ → New repository**.
   - Name it `BuddyAI` and choose **Public**. Public means your friends can download the app from it.
   - Click **Create**.
3. On the new repo page, click **uploading an existing file**.
   - Drag in **everything inside** the `BuddyAI` folder, including the `.github` folder.
   - Click **Commit changes**.
   - If the `.github` folder didn't upload: click **Add file → Create new file**, type `.github/workflows/build.yml` as the name, paste in that file's contents, and commit.
4. Open the **Actions** tab. A build starts by itself and takes about 5–10 minutes.
5. When it shows a green tick, open **Releases** on the right of the repo page. You'll see **Buddy.apk**, which is the app.
   - That page's link is what you send to people.
   - Every time you change something, it rebuilds and the link updates.

## Step 2 – Switch on the free online AI (no keys for anyone)

This is a tiny free server that holds the AI, so nobody who installs the app
ever needs a key. Cloudflare gives **10,000 "neurons" a day free**, which works out to
several hundred replies a day shared across everyone. When it runs out (it resets at midnight UTC, which is
1am UK time in summer), or someone has no signal, the app just switches to the on-phone AI.

1. Make a free account at **dash.cloudflare.com** (no card needed).
2. Set up the worker:
   1. Go to **Workers & Pages → Create → Create Worker** and give it a name, such as `buddy-brain`.
   2. Click **Deploy**.
   3. Click **Edit code**, delete what's there, paste in everything from `server/worker.js`, then click **Deploy**.
3. Connect the AI:
   1. Go back to the worker and open **Settings → Bindings → Add → Workers AI**.
   2. Set the variable name to exactly `AI`.
   3. Save and deploy.
4. Copy the worker's address. It looks like `https://buddy-brain.yourname.workers.dev`.
   - Opening it in a browser should show `{"ok":true,...}`.
5. On GitHub, open `gradle.properties`.
   1. Click the ✏️ pencil and set:
      ```
      freeAiUrl=https://buddy-brain.yourname.workers.dev
      ```
   2. Commit. GitHub rebuilds the app with the free AI built in.

*Optional, stops strangers using your allowance:*

1. In the worker's **Settings → Variables**, add a secret called `APP_TOKEN` with any password.
2. Put the same password after `freeAiToken=` in `gradle.properties`.

*Optional, for people who prefer the command line:* the `server/` folder also deploys with
`npx wrangler deploy`. That route also switches on a per-phone speed limit.

## Step 3 – Install on a phone

1. Open the Releases link on the phone and download **Buddy.apk**.
2. Tap it. Android will ask to **allow installing from this source**. Allow it.
3. If Play Protect warns about an unknown app, tap **More details → Install anyway**. It does this for any app that isn't from the Play Store.

## Step 4 – First run (each person does this)

1. Enter your name, the assistant's name and its vibe.
2. Open **Settings**:
   - **Download on-phone AI** so it works offline. Use Wi-Fi: it's 1.6 GB, and phones with 6 GB+ RAM work best.
   - Switch on **Wake me by voice** for "hello phone". It downloads a small 40 MB listening engine.
   - Under **Phone control**, switch on the extras you want. For **Screen control**, find Buddy in Accessibility settings.
     - On Android 13+ the switch can be greyed out for apps installed from a file. If so, go to **Settings → Apps → Buddy → ⋮ (top right) → Allow restricted settings**, then try again.

---

## Good to know

- **The on-phone AI is much less clever than the online one.** It's great for chat, reminders and phone commands, and weak at serious coding. The online brain, or someone's own Gemini or Claude key, is much better for that.
- **Wake phrase**:
  - It uses a little battery and shows a small notification while it's listening (Android requires that).
  - After restarting the phone, open the app once to start it again.
- **iPhone**: not supported. Apple doesn't let apps control the phone like this.
- **Privacy**: chats, memories and the learned profile are stored only on the phone. The online AI sees only the messages being answered. There's a **Forget everything** button in Settings.
- **The signing key** (`app/buddy.jks`) is included so every build can update over the last one. Since the repo is public, someone could in theory sign a fake update with it. That's fine for a hobby app shared with friends, but make your own key before publishing anywhere big.
- **Change the app name**: edit `app/src/main/res/values/strings.xml`. Each person can also rename the assistant inside the app.

## Project layout

```
server/worker.js          free online AI (Cloudflare Worker)
app/src/main/java/com/buddy/assistant/
  ai/Brain.kt             personality, memory, picking a brain, running actions, learning
  ai/Providers.kt         free online AI, Gemini, Claude, OpenAI-style, on-phone AI
  device/Actions.kt       everything it can do on the phone
  device/BuddyAccessibility.kt   screen reading / tapping / typing
  device/WakeWordService.kt      "hello phone" + hands-free conversation
  voice/Voice.kt          speech in, speech out, voices
  data/                   memories, chat history, settings (all on the phone)
  ui/                     chat, settings, memory and welcome screens
```

If a build fails on GitHub, open the failed run in the **Actions** tab, copy the
red error lines, and paste them to Claude to get them fixed.
