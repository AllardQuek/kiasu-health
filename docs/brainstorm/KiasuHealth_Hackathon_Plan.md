Understood — here’s a clean, shareable **Hackathon Execution Plan** (no PM commentary, just the doc content).

***

# KiasuHealth: Hackathon Execution Plan

## Overview

Build a **2.5‑minute demoable MVP** of **KiasuHealth**: a Telegram-based social health game where an AI referee (Elastic Agent Builder) verifies mock health data and produces weekly standings, rewards, and nudges.

**Core Innovation**  
Elastic Agent Builder acts as an **AI referee**:  
- Aggregates health metrics from Elastic  
- Verifies and scores players  
- Produces weekly standings, rewards, and personalized recommendations

**Key Constraints**  
- Actual hack time: ~4 hours  
- Prep time (before): ~1 day  
- Team: 5 software engineers  
- Strategy: build in milestones from PoC → MVP → polish

***

## Demo Flow (2.5 minutes)

1. **Context & Join (20–30s)**  
   - Show Telegram group where 4 “judges” are already in a weekly KiasuHealth challenge.  
  - Bot message: “KiasuHealth Office Challenge: steps + meal balance this week.”

2. **Data & Verification (60s)**  
  - Explain: "Each judge connected Apple Health & Strava earlier; we also logged meal photos—privately."
  - Live action: **presenter** opens a private DM with the KiasuHealth bot on their own device and sends `/photo` + a pre-saved meal photo.  
   - Bot replies privately (only the presenter's device shows this):  
     - "~780 kcal, 3/10 for balance today. High sodium—swap skin-on chicken for soup next time."
  - Explain: photo stays in the DM; only the **balance score** (e.g. `meal_balance_score = 3/10`) is written to Elastic, tagged to that user + league. The group never sees the food photo or raw description.

3. **AI Judgment & Standings (40s)**  
   - Trigger weekly reveal via `/reveal`.  
   - Agent Builder workflow calls ES, computes scores, returns standings:  
     - Rank, total score, badges (Kiasu Champion, Most Improved, etc.).  
   - Briefly mention age-adjusted fairness.

4. **Reward & Nudge (30–40s)**  
   - Bot sends reward message:  
     - “Kiasu Champion: Judge 2 – enjoy free healthier kopi next week ☕.”  
   - Bot sends one personalized nudge to lowest scorer:  
     - “You lost mostly on hawker calories. Next week, swap 2 meals for this lower-cal option near your office.”

***

## Architecture

### Data Layer (Elastic)

**Deployment**  
- Elastic Cloud Serverless (preferred)

**Indices**  
- `kiasuhealth-players`  
  - `player_id`, `name`, `age`, `league_id`  
  - `kiasuhealth-metrics`  
  - `player_id`, `date`, `steps`, `meal_balance_score` *(score only, 0–10; raw photo/nutrition details never stored here)*, `run_time_minutes`, etc.  
- `kiasuhealth-leagues`  
  - `league_id`, `name`, `config` (weights, boosters)

**ES|QL**  
- Query to aggregate last 7 days per player:  
  - Sum steps, average `meal_balance_score`, best run time  
  - Apply simple age multiplier (e.g. players >50 get +10% to steps score) inline in ES|QL  
  - Compute final weighted score and sort by rank

**Mock Data**  
- 4 “judge” players  
- 7 days of metrics each (steps, meal calories, run time)  
- Store all in Elastic before demo

***

### Backend (API)

**Stack**  
- **Next.js 16** (App Router) + **TypeScript** — API routes replace a standalone Express/FastAPI server  
- **grammy** — Telegram bot framework (TypeScript-first, runs as a serverless webhook handler inside a Next.js API route; no separate bot process)  
- **`@elastic/elasticsearch`** — official Node.js/TS SDK for Elastic  
- **Vercel** — zero-config deployment; webhook URL is the Vercel domain, no ngrok needed during demo

> **Why not Python/FastAPI?** Elastic's JS SDK is first-class, grammy runs in the same runtime as the API, and Vercel removes all DevOps overhead. One repo, one `npm run dev`, one `git push` to deploy. Only revert to FastAPI if the majority of the team is Python-only.

> **Next.js version**: Use Next.js 16 (current stable as of March 2026). Scaffold with `npx create-next-app@latest` which will pull v16 automatically.

**Project structure**
```
app/
  api/
    photo/route.ts        ← POST /api/photo
    standings/route.ts    ← GET  /api/standings/[league_id]
    reveal/route.ts       ← POST /api/reveal
    telegram/route.ts     ← Telegram webhook (grammy handler)
  dashboard/page.tsx      ← optional live leaderboard (future)
lib/
  elastic.ts              ← Elastic client + query helpers
  agent.ts                ← Agent Builder workflow calls
```

**Endpoints**  

- `GET /api/standings/{league_id}`  
  - Calls ES / ES|QL  
  - Returns JSON with players, scores, ranks, badges

- `POST /api/photo`  
  - Input: image file  
  - For demo: ignore actual image, return fixed mock:  
    - `{ calories: 780, balance_score: 3, tip: "Swap skin-on chicken for soup to cut ~200 kcal", league_score_entry: { meal_balance_score: 3 } }`  
  - Only `meal_balance_score` is persisted to Elastic; the calories and tip are returned to the user's DM only

- `POST /api/reveal`  
  - Triggers Agent Builder **Weekly Judgment Workflow** for weekly judgment  
  - Returns formatted text / JSON for Telegram (standings + reward + nudge)

> **Note on `/api/photo`**: With the Agent Builder vision flow, the bot calls Agent Builder directly for photo analysis rather than `/api/photo`. The `/api/photo` endpoint is retained as a fallback/test endpoint but is not on the critical path.

***

### Elastic Agent Builder

**Tools**

1. `get_league_standings(league_id)`  
   - Calls `/api/standings/{league_id}`  
   - Returns list of players with scores and rank

2. `analyze_meal_photo(photo)`  
  - For hack: call `/api/photo`  
  - Returns calories + suggestion

3. (Optional) `get_weather(location)`  
   - Simple mock to say “rainy week” vs “good weather”

**Workflows**

1. **Weekly Judgment Workflow**  
   - Input: `league_id`  
   - Steps:  
     - Call `get_league_standings`  
     - Assign text badges (“Kiasu Champion”, “Most Improved”)  
     - Build summary message for Telegram

2. **Personalization Workflow**  
   - Input: `league_id`  
   - Steps:  
     - Find lowest scorer  
    - Generate 1–2 specific suggestions (focus on meal or steps)  
     - Return short nudge text

3. **Photo Analysis Workflow**  
   - Input: image  
   - Steps:  
    - Call `analyze_meal_photo`  
     - Return calories + healthier choice suggestion

***

### Telegram Bot

**Minimal Commands**

- `/start` *(DM with bot)*  
  - Welcome message + **privacy model disclosure**:  
    "Food photos stay between you and KiasuHealth. Only your *score* is shared with your league."
  - "You are in the Office Challenge: steps + meal balance this week."

- `/photo` *(DM only — not available in group chat)*  
  - Check `ctx.chat.type === 'private'`; if triggered in a group, reply "Send me your food photo in a private message 🤫" and return early  
  - Download Telegram photo → pass URL to Agent Builder **Photo Analysis Workflow**  
  - Agent Builder calls `analyze_meal_photo` → `write_meal_score` → returns formatted reply  
  - grammy sends Agent Builder's reply privately to the user  
  - Photo and raw nutrition details never leave the DM; only `meal_balance_score` is persisted in Elastic

- `/reveal` *(group chat)*  
  - Call `/api/reveal`  
  - Reply with:  
    - Standings table (Markdown) — scores and ranks only, no food photos or raw descriptions  
    - Badges  
    - Reward message  
    - Personalized nudge (e.g. "Your steps saved you; meal balance dragged you down this week.")  
  > **Access control**: Open to anyone in the group — acceptable for demo. Presenter triggers it at the right moment in the narrative; no passcode needed.

*(Optional, if time)*  
- `/status` – Show current mocked standings

**Implementation Notes**

- Use **webhook only** (grammy `webhookCallback` adapter). The Vercel deployment URL is the webhook endpoint — set it on Prep Day once the app is live. No polling, no ngrok.
- Enforce DM-only for `/photo`: check `ctx.chat.type === 'private'` at the top of the handler; if triggered in a group, reply with "Send me your food photo in a private message 🤫" and return early.
- Keep formatting simple: Markdown table or bullet list.

***

## Milestones & Work Split

### Prep Day (before hackathon)

**Goals**:  
- Elastic indices & mock data ready  
- ES|QL ranking working  
- Backend skeleton in place

**Tasks**

1. **Elastic Setup (E1)**  
   - Create indices and mappings  
   - Write ES|QL ranking query  
   - Verify query returns stable standings for mock data

2. **Mock Data Scripts (E1)**  
   - Generate 4 players × 7 days metrics  
   - Index into Elastic

3. **Elastic Cloud Setup (E1)**  
   - Sign up for Elastic Cloud Serverless free trial  
   - Create a new serverless Elasticsearch project  
   - Note the Cloud ID and API key — add to `.env.local`

4. **Backend Skeleton + Vercel Deploy (E2)**  
   - `npx create-next-app@latest kiasu-health --typescript --app`  *(pulls Next.js 16, current stable)*  
   - Create `.env.local` from template (see below); add to `.gitignore`  
   - Implement `app/api/standings/[league_id]/route.ts` returning hardcoded mock JSON  
   - Implement `app/api/photo/route.ts` returning fixed mock output  
   - Implement `app/api/telegram/route.ts` with grammy `webhookCallback` setup (handler stubs only)  
   - Set up `lib/elastic.ts` with `@elastic/elasticsearch` client  
   - **Deploy to Vercel** (`git push` → import project in Vercel dashboard → add env vars)  
   - Set Telegram webhook: `curl https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-vercel-url>/api/telegram`  
   - Verify webhook is active before ending Prep Day

**`.env.local` template** (add all vars to Vercel dashboard too):
```
TELEGRAM_BOT_TOKEN=
ELASTIC_CLOUD_ID=
ELASTIC_API_KEY=
ELASTIC_INDEX_METRICS=kiasuhealth-metrics
ELASTIC_INDEX_PLAYERS=kiasuhealth-players
AGENT_BUILDER_URL=
AGENT_BUILDER_API_KEY=
```

***

### Hackathon – Hour 1: Agent Builder core

**Owner**: E3 (+ E1/E2 support)

> **Pre-requisite**: Vercel deployment from Prep Day must be live with a public URL before starting this hour. Agent Builder tools need a real HTTPS endpoint to test against.

- Tasks:  
- Create tools in Agent Builder: `analyze_meal_photo`, `get_league_standings`, `write_meal_score`  
- Implement **Photo Analysis Workflow** (real-time, per-photo)  
- Implement **Weekly Judgment Workflow** (triggered by `/reveal`)  
- Test Photo Analysis Workflow via Agent Builder UI: pass a dummy image URL, verify it returns a formatted reply and score  
- Test Weekly Judgment Workflow via Agent Builder UI (no bot yet)

Deliverable: a single button/run in Agent Builder that outputs a clear text summary and nudge.

***

### Hackathon – Hour 2: Telegram bot + API glue

**Owners**: E4 (bot), E2 (API)

Tasks:  
- Implement grammy bot handlers (`/start`, `/photo`, `/reveal`) inside `app/api/telegram/route.ts`  
- `/photo` handler: enforce DM-only check, download Telegram photo, call Agent Builder Photo Analysis Workflow, send private reply  
- `/reveal` handler: call `POST /api/reveal` → Agent Builder Weekly Judgment Workflow → post standings to group  
  - Verify `write_meal_score` tool is writing `meal_balance_score` to Elastic (not raw photo data)  
- Confirm Vercel webhook is still active; re-run `setWebhook` if needed

Deliverable: Running bot on Vercel that can handle `/photo` (DM) and `/reveal` (group) end-to-end.

***

### Hackathon – Hour 3: Polish

**Owners**: Everyone, led by E5

Tasks:  
- Improve messaging copy to add SG flavour (kiasu, hawker references)  
- Add simple badges in text (🟢 Champion, 🟡 Most Improved, 🏎️ Comeback Kaki)  
- Make standings easy to read in Telegram (Markdown table)  
- **Reaction messages (emoji-only)**: Use short text + emoji templates instead of GIFs. Example templates: Winner — "Kiasu Champion: {name} 🏆🎉"; Consolation — "Next time, {name} — keep going 💪🙂". Keep messages short and emoji-only.  
- Pre-test full 2.5‑min flow several times

***

### Hackathon – Hour 4: Hardening & Backup

Tasks:  
- Add basic error handling (Agent Builder timeout, Elastic down, Telegram rate limit)  
- Capture sample outputs as screenshots in case of live issues  
- **Backup**: record a casual walkthrough video of the full bot flow (no prepared script needed — just narrate naturally as you demo it). Save locally and to a shared drive. Use this if live bot fails on stage.  
- Final rehearsal of spoken narrative + bot interactions

***

## Success Criteria

### Technical

- Elastic indices created and populated with mock data  
- ES|QL ranking returns correct, stable standings  
- Agent Builder workflows:  
  - Weekly Judgment  
  - Personalization  
  - Photo Analysis  
- Backend API responding correctly  
- Telegram bot working for `/start`, `/photo`, `/reveal`

### Demo

- End-to-end flow completes in ~2.5 minutes  
- Live photo upload returns believable calorie estimate + suggestion  
- Weekly reveal shows standings + badges + reward + nudge  
- Story clearly lands: **“AI referee + kiasu accountability + health perks”**

***

## Scope Deliberately Excluded for Hack

- Real Strava / Apple Health integrations (all data mocked)  
- True drafting / lineup customization (can be mentioned as “future” verbally)  
- Real vision model calls (photo analysis mocked)  
- Real reward distribution (only notification, no actual integration)  
- **Strict privacy mode** (optional future feature): league sees only total score, not which category (meal vs. steps) was weak — can be mentioned verbally during demo as a "ship later" option
