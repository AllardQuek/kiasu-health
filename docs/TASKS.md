# TASKS.md — KiasuHealth Hackathon Build Plan

**Hackathon**: Elastic Forge The Future Singapore — 13 March 2026, 10am–3pm (~5 hours)
**Team**: 4–5 engineers
**Read ARCHITECTURE.md first** for full system context.

---

## Roles

| Role | Responsibilities |
|---|---|
| **Elastic Lead** | Elastic Cloud setup, 4 app indices, ES|QL query, mock data seeding (with `home_location`), verify `maps-geojson-*` geodata indices |
| **Agent Lead** | Elastic Agent Builder — create 4 agents (MealAnalyzerAgent, DataAggregatorAgent, HealthCoachAgent, KiasuRefereeAgent), configure A2A, confirm invocation URLs |
| **API Lead** | Next.js API routes (`/standings`, `/trends`, `/reveal`, `/meal-score`), `lib/elastic.ts`, `lib/agent.ts` |
| **Bot Lead** | grammy handlers (`/start`, `/join`, `/photo`, `/ask`, `/reveal`), webhook setup, Vercel integration. `/reveal` must call `callRefereeAgent()` and post standings text + link to group. `/photo` and `/ask` are DM-only. |
| **Frontend/QA Lead** | Web reveal page, leaderboard dashboard, end-to-end testing, demo polish, copy, rehearsal |

> One person can hold multiple roles. Elastic Lead + Agent Lead often the same person if they know Kibana well.

---

## Table of Contents

1. [Prep Day — Before Hackathon](#prep-day--before-hackathon)
2. [Hour 1 — Agent Builder Core](#hour-1--agent-builder-core-10am1100am)
3. [Hour 2 — Bot + API Glue](#hour-2--bot--api-glue-1100am1200pm)
4. [Hour 3 — Integration + Polish](#hour-3--integration--polish-1200pm100pm)
5. [Hour 4 — Hardening + Rehearsal](#hour-4--hardening--rehearsal-100pm200pm)
6. [Buffer — Final Prep](#buffer--final-prep-200pm300pm)
7. [Timeline Summary](#timeline-summary)
8. [Fallback Plans](#fallback-plans)
9. [Environment Variables Checklist](#environment-variables-checklist)

---

## Prep Day — Before Hackathon

**Goal**: Elastic indices ready, mock data loaded, backend skeleton deployed to Vercel, Telegram webhook live, Agent Builder agents created with IDs noted.
**Do this the evening/night before (12 March 2026).**

---

### P0. ⚠️ Agent Builder Setup (Agent Lead) — 15 min [BLOCKING]

1. Log in to Kibana for your Elastic Cloud Serverless project
2. Navigate to **Kibana → Agent Builder**
3. Find the **API settings / documentation** pane — note the exact invocation URL path for calling an agent programmatically. Update the `⚠️` comment in `lib/agent.ts` with the confirmed path.
4. Create placeholder agents so you can note their IDs now:
   - `MealAnalyzerAgent` — note ID
   - `DataAggregatorAgent` — note ID
   - `HealthCoachAgent` — note ID → `HEALTH_COACH_AGENT_ID`
   - `KiasuRefereeAgent` — note ID → `REFEREE_AGENT_ID`
5. Add `HEALTH_COACH_AGENT_ID` and `REFEREE_AGENT_ID` to `.env.local` and Vercel immediately

**✅ Done when**: Agent IDs are in `.env.local`; invocation URL is confirmed in `lib/agent.ts`

---

### P1. Elastic Cloud Setup (Elastic Lead) — 30 min

1. Create Elastic Cloud Serverless account: https://cloud.elastic.co
2. Create a new **serverless Elasticsearch** project
3. Note: **Endpoint URL** and **API Key** — add to `.env.local` immediately
4. Create the 4 indices with mappings (see ARCHITECTURE.md Section 2):
   ```bash
   # Use Kibana Dev Tools or the Elasticsearch REST API
   PUT /kiasuhealth-players
   PUT /kiasuhealth-metrics
   PUT /kiasuhealth-leagues
   PUT /kiasuhealth-reveals
   ```
5. Verify indices exist: `GET /_cat/indices`
6. Verify geodata indices are present (pre-populated before hackathon by `scripts/index-geodata.ts`):
   ```
   GET /_cat/indices?v&index=maps-geojson-*
   ```
   You should see ~12 `maps-geojson-*` indices. Note the exact names — update `GEODATA_INDEX` map in `lib/elastic.ts` if they differ from the defaults.

**✅ Done when**: 4 app indices created + `maps-geojson-*` indices confirmed present, Cloud endpoint URL + API key noted

---

### P2. Mock Data Seeding (Elastic Lead) — 20 min

1. Run the seeder (already implemented):
   ```bash
   npx tsx scripts/seed-elastic.ts
   ```
2. Verify 4 players in `kiasuhealth-players`, each with a `home_location` geo_point and `total_wins` field:
   - **Nick** (`player3`) → Yishun `[103.827, 1.422]` — run metrics calibrated from Apple Health GPX reference (~4:30/km, ~5 km sessions)
   - **Chris** (`player1`) → Ang Mo Kio `[103.820, 1.365]`
   - **Komal** (`player2`) → Tampines `[103.943, 1.353]`
   - **Gaby** (`player4`) → Jurong West `[103.740, 1.345]`
3. Verify `join_code: "KIASU01"` is set on the league document in `kiasuhealth-leagues`
4. Verify 28 metric records in `kiasuhealth-metrics`
5. Run the ES|QL standings query manually in Kibana Dev Tools → expect 4 players ranked correctly

**✅ Done when**: ES|QL query in Kibana Dev Tools returns the 4 players ranked with scores

---

### P3. ES|QL Query Validation (Elastic Lead) — 20 min

Paste the standings query from ARCHITECTURE.md Section 2 into Kibana Dev Tools. Validate:
- Returns all 4 players
- `final_score` is computed correctly
- Gaby (age 51) shows age-adjusted score (×1.1)
- Sort order is correct (highest score first)

Also test the two-week trends query used by `getPlayerTrends()` in `lib/elastic.ts`.

If the LOOKUP syntax for age multiplier doesn't work in serverless ES|QL: the TypeScript fallback is already implemented in `lib/elastic.ts`.

**✅ Done when**: Both queries return stable, correct results from mock data

---

### P4. Amazon Bedrock Setup (Agent Lead) — 20 min

1. Log in to AWS Console → Bedrock → Model access (ap-southeast-1)
2. Enable access for `anthropic.claude-3-haiku` (multimodal)
3. Create IAM credentials (or use existing) for Kibana HTTP connector
4. In Kibana → Connectors → Amazon Bedrock: create a connector with the IAM credentials
5. Test the connector: send a text prompt → verify it responds
   
This Bedrock connector is used by the `analyze_meal_image` tool inside MealAnalyzerAgent. The Next.js code never calls Bedrock directly.

**✅ Done when**: Kibana Bedrock connector responds to a test prompt

---

### P5. Next.js Project Setup (API Lead) — 20 min

> **Note**: Project is already scaffolded in this repo. This step covers verifying dev environment.

```bash
pnpm install
pnpm dev   # verify at http://localhost:3000
```

Verify: custom Tailwind colors load, fonts load (Plus Jakarta Sans + JetBrains Mono), no TypeScript errors.

```bash
pnpm build   # must succeed before Vercel deploy
```

**✅ Done when**: `pnpm dev` works, `pnpm build` passes with no errors

---

### P6. Core Lib Files (API Lead) — 20 min

All lib files are already implemented:
- `lib/types.ts` — `Player`, `League`, `PlayerTrends`, `RevealRecord`, `AgentBuilderResponse`
- `lib/mock.ts` — mock standings + photo result for fallback
- `lib/elastic.ts` — `getStandings()`, `getPlayerTrends()`, `getRevealCache()`, `writeRevealCache()`, `upsertPlayer()`, `getLeagueByJoinCode()`
- `lib/agent.ts` — `callHealthCoachAgent()`, `callRefereeAgent()` with Kibana URL derivation
- `lib/bot.ts` — all bot command handlers

Review for any TypeScript errors: `pnpm tsc --noEmit`

**✅ Done when**: No TypeScript errors, `lib/elastic.ts` can connect to Elastic

---

### P7. API Route Stubs (API Lead) — 15 min

All routes are already implemented. Verify they work with mock data before Vercel deploy:
- `GET /api/standings/sg-league-001` → returns mock standings
- `GET /api/trends/player1?league_id=sg-league-001` → returns mock trends (or real Elastic data)
- `POST /api/reveal` → returns mock reveal result
- `POST /api/meal-score` body: `{ player_id, league_id, meal_balance_score: 7 }` → `{ success: true }`
- `POST /api/photo` → returns mock meal result

Test locally: `curl http://localhost:3000/api/standings/sg-league-001`

**✅ Done when**: All endpoints return JSON without errors locally

---

### P8. Vercel Deploy + Telegram Webhook (Bot Lead + API Lead) — 20 min

1. `git push` to GitHub
2. Import project in Vercel dashboard → add all env vars (see Section 9 checklist below)
3. Deploy → get Vercel URL (e.g. `kiasu-health-abc.vercel.app`)
4. Set Telegram webhook:
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://${VERCEL_URL}/api/telegram"
   ```
5. Verify with:
   ```bash
   curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo"
   ```
6. Send `/start` to the bot → receives welcome + join instructions

**✅ Done when**: Telegram webhook is live, `/start` returns the welcome message

---

## Hour 1 — Agent Builder Core (10am–11am)

**Owner**: Agent Lead (+ Elastic Lead support)

**Pre-requisite**: Vercel URL live + `NEXT_PUBLIC_APP_URL` set in Vercel env vars before starting.

---

### T1a. MealAnalyzerAgent — Bedrock Vision (Agent Lead) — 20 min

In Kibana → Agent Builder, open the `MealAnalyzerAgent` placeholder created on Prep Day:

1. Add tool: `analyze_meal_image`
   - Type: Amazon Bedrock HTTP connector (configured on Prep Day)
   - Model: `anthropic.claude-3-haiku` (multimodal)
   - System prompt: analyze meal photo, return `{ calories, balance_score, tip, hawker_detected }` JSON; be Singapore-hawker-aware
2. Test: provide a food image URL in Agent Builder UI → expect JSON with `balance_score`
3. Save agent — note Agent ID is already in `.env.local`

**✅ Done when**: Tool returns valid JSON with `balance_score` from a real image URL

---

### T1b. DataAggregatorAgent — Trends Tool (Agent Lead) — 15 min

In Kibana → Agent Builder, open the `DataAggregatorAgent` placeholder:

1. Add tool: `get_player_metrics`
   - Method: GET
   - URL: `https://{VERCEL_URL}/api/trends/{player_id}?league_id={league_id}`
   - Test with `player_id = "player1"` + `league_id = "sg-league-001"` → expect `PlayerTrends` JSON

**✅ Done when**: Tool returns a `PlayerTrends` object from the live Vercel endpoint

---

### T1c. HealthCoachAgent — Orchestrator (Agent Lead) — 15 min

In Kibana → Agent Builder, open the `HealthCoachAgent` placeholder:

1. Register A2A agents: `MealAnalyzerAgent` + `DataAggregatorAgent`
2. Add tool: `write_meal_score`
   - Method: POST
   - URL: `https://{VERCEL_URL}/api/meal-score`
   - Test: write `{ player_id: "player1", league_id: "sg-league-001", meal_balance_score: 7 }` → `{ success: true }`
3. Set system prompt (see ARCHITECTURE.md Section 5, Agent C) — ensure the system prompt includes guidance for handling the `nearby_suggestion` field from DataAggregatorAgent: weave it naturally into the coaching nudge (e.g. "There's a HPB healthier spot near you — [name] at [address]") rather than echoing it verbatim.
4. Test full A2A flow: input with `photo_url` → agent should call MealAnalyzerAgent A2A → call write_meal_score → return coach reply
5. Verify A2A trace appears in Kibana

**✅ Done when**: Full A2A trace visible in Kibana for a photo analysis + coach reply

---

### T1d. KiasuRefereeAgent — Orchestrator (Agent Lead) — 10 min

In Kibana → Agent Builder, open the `KiasuRefereeAgent` placeholder:

1. Register A2A agent: `DataAggregatorAgent`
2. Add tool: `get_league_standings`
   - Method: GET
   - URL: `https://{VERCEL_URL}/api/standings/{league_id}`
   - Test with `league_id = "sg-league-001"` → expect standings JSON
3. Set system prompt (see ARCHITECTURE.md Section 5, Agent D)
4. Test: input `{ league_id: "sg-league-001" }` → agent should call get_league_standings + DataAggregatorAgent A2A → return `{ standings_text, winner_name, nudge, reward }`

**✅ Done when**: Referee agent produces full reveal JSON with badges + nudge

---

## Hour 2 — Bot + API Glue (11am–12pm)

**Owners**: Bot Lead (grammy handlers), API Lead (API wiring)

---

### T4. Connect API Routes to Elastic (API Lead) — 30 min

All routes are already coded. This task is verification + any fixes:

1. `GET /api/standings/[league_id]` → `getStandings(leagueId)` via ES|QL → verify live Elastic data
2. `GET /api/trends/[player_id]?league_id=...` → `getPlayerTrends()` + `getNearbyVenues()` → verify response includes both `trends` delta fields **and** a `nearby_suggestion` object (or `null` if player has no `home_location`)
3. `POST /api/meal-score` → writes `meal_balance_score` to `kiasuhealth-metrics` → verify in Kibana
4. `POST /api/reveal` → cache-check → `callRefereeAgent()` → writes to `kiasuhealth-reveals` cache → verify both
5. `POST /api/photo` → calls `callHealthCoachAgent()` with mock fallback; verify bot reply text matches HealthCoachAgent output

**✅ Done when**: `/api/standings/sg-league-001` returns standings from live Elastic, `/api/trends/player1?league_id=sg-league-001` returns deltas, reveal cache writes to Elastic

---

### T5. grammy Bot Handlers (Bot Lead) — 30 min

All handlers are already coded in `lib/bot.ts`. This task is testing on Telegram:

1. `/start` → receives welcome + `/join` instructions
2. `/join KIASU01` → receives "Joined *League Challenge*!" + leaderboard link
3. `/join BADCODE` → receives "Code not found" error
4. `/photo` (DM, with photo) → receives HealthCoachAgent personalised reply (calls `callHealthCoachAgent()`)
5. `/photo` (group) → receives "Send me your food photo in a private message 🤫"
6. `/ask` (DM) → receives DataAggregatorAgent-powered nudge (no photo needed); HealthCoachAgent chain visible in Kibana
7. `/ask` (group) → receives "Send me your question in a private message 🤫"
8. `/reveal` (group) → calls `callRefereeAgent()`, posts standings text with badges + reward + nudge directly to group chat, appends web link
9. `/reveal` (DM) → gracefully declines or posts same output

Fix any issues found during testing.

**✅ Done when**: All commands work end-to-end on Telegram with correct A2A responses; two distinct Kibana A2A traces visible (HealthCoachAgent chain + KiasuRefereeAgent chain)

---

## Hour 3 — Integration + Polish (12pm–1pm)

**Owner**: Frontend/QA Lead + everyone

---

### T6. End-to-End Integration Test (All) — 20 min

Run the full 2.5-minute demo flow from ARCHITECTURE.md Section 10:
1. `/join KIASU01` in DM → joined league, link received
2. `/photo` + meal photo in DM → personalised HealthCoachAgent reply (A2A trace #1 visible in Kibana)
3. `/ask` in DM → trend-based nudge from HealthCoachAgent (same A2A chain, no photo)
4. `/reveal` in group → **bot posts standings text + badges + reward + nudge directly in group**, plus web link appended (KiasuRefereeAgent A2A trace #2 visible in Kibana)
5. Open web reveal URL from the bot link → KiasuRefereeAgent ran, reveal cache written to `kiasuhealth-reveals`; cinematic animation shows

Verify:
- `meal_balance_score` written to Elastic (not raw calories)
- Standings include correct badges
- Age adjustment applied (Gaby gets ×1.1)
- **Two** separate A2A traces visible in Kibana (HealthCoachAgent chain + KiasuRefereeAgent chain)
- Second `/reveal` hits cache (`cached: true`) without calling Agent Builder again
- `/photo` and `/ask` in a group chat are correctly rejected with privacy message

Fix anything broken before moving on.

**✅ Done when**: Full demo flow works end-to-end without intervention, both A2A traces visible in Kibana

---

### T7. Copy + SG Flavour (Frontend/QA Lead) — 20 min

Polish Telegram message copy:
- Add light Singlish flavour to bot replies (see BRAND_GUIDELINES.md Section 9 for guidelines)
- `/ask` reply: actionable, hawker-aware ("try lower-cal kopitiam options"), cites the player's `coaching_focus`
- `/reveal` group post: clean standings block (rank, name, score, badge), winner reward, loser nudge — all in one message followed by the web link
- Reward message: specific (free kopi, health perk)
- `/start` welcome: privacy disclosure must be clear and prominent (photos stay private to DM)

**✅ Done when**: All messages read naturally and have KiasuHealth personality

---

### T8. GIF Integration (Frontend/QA Lead) — 20 min

### T8. Reaction Messages (emoji-only) (Frontend/QA Lead) — 20 min

Use short text + emoji templates for reveal reactions instead of GIFs:
- Winner reaction: "Kiasu Champion: {name} 🏆🎉"
- Consolation reaction: "Next time, {name} — keep going 💪🙂"

Keep messages short and emoji-only; limit time to 20 minutes.

**✅ Done when**: `/reveal` message includes reaction text and emojis (no GIF URLs)

---

### T9. Optional — Web Reveal + Dashboard (Frontend/QA Lead) — 20 min (if time)

Build or polish the web reveal page, leaderboard, and personal player page:

**`app/league/[league_id]/reveal/page.tsx`** — cinematic Sunday reveal:
- Calls `POST /api/reveal` on load (cache-first — instant on repeat visits)
- `RevealSequence` component: staggered animation, last-to-first reveal order, rank #1 arrives last
- Dark mode reveal: `bg-charcoal-blue`, `text-jasmine` for rank numbers, `champion-glow` on #1 card

**`app/league/[league_id]/page.tsx`** — live leaderboard:
- Shows current standings as `LeagueTable` component
- Auto-refreshes every 30s
- Uses BRAND_GUIDELINES.md palette (cornsilk bg, verdigris accent, Plus Jakarta Sans + JetBrains Mono)
- **"Nearby for You" section** (below the leaderboard table): show a card per player with their `nearby_suggestion` from `/api/trends`. Card layout: venue name (bold), address (muted), category badge. Only render this section if at least one player has a non-null `nearby_suggestion`. Style: `bg-papaya-whip`, `border-jasmine`, verdigris accent for the category badge.

**`app/player/[player_id]/page.tsx`** — personal dashboard (new):
- Shows the player's stats: step trend, meal balance score history, `coaching_focus`
- Meal history timeline: score per day with date label
- Photo upload widget: allows submitting a meal photo directly from web (calls `/api/photo`)
- No auth — players bookmark their own URL (e.g. `/player/player3`)
- Only build if there is time after the leaderboard and reveal pages are solid

Display URL on screen during demo: `https://kiasu-health.vercel.app/league/sg-league-001/reveal`

**✅ Done when**: Reveal page loads, shows staggered animation, looks good on screen share

---

## Hour 4 — Hardening + Rehearsal (1pm–2pm)

**Owner**: All

---

### T10. Error Handling (API Lead + Bot Lead) — 20 min

Add minimal defensive error handling:
- `lib/agent.ts`: if Agent Builder call fails (timeout, error), fall back to `lib/mock.ts` response
- `app/api/telegram/route.ts`: wrap grammy handlers in try/catch — on error, reply "Something went wrong, try again"
- `app/api/standings/[league_id]`: if Elastic query fails, return mock standings

Do not over-engineer. Just prevent the demo from crashing silently.

**✅ Done when**: If Agent Builder is unavailable, bot still responds (with mock data)

---

### T11. Demo Screenshots + Backup Video (All) — 15 min

1. Screenshot each key beat of the demo:
   - The Telegram group chat (pre-seeded week message)
   - `/photo` DM interaction (photo + private reply)
   - `/reveal` group output (standings text + badges + reward + nudge + web link — all in one bot message)
   - Kibana trace: **HealthCoachAgent A2A chain** (MealAnalyzerAgent + DataAggregatorAgent)
   - Kibana trace: **KiasuRefereeAgent A2A chain** (DataAggregatorAgent ×4 + get_league_standings)
   - Web reveal page (cinematic animation, dark mode)

> ⚠️ The two Kibana trace screenshots are **mandatory** — they are the Elastic story. If a live Kibana trace can't be shown on stage, have the screenshots ready to share.

2. Record a casual 2.5-minute walkthrough video (phone screen recording + narration). No script — just narrate naturally as you run through it.

Save screenshots and video locally + shared drive. Use these if the live bot fails on stage.

**✅ Done when**: Backup materials ready, both Kibana trace screenshots saved

---

### T12. Rehearsal (All) — 25 min

Run the full demo 2–3 times. Focus on:
- Spoken narrative lands cleanly: "AI referee + kiasu accountability + health perks"
- Key line to nail: "Bot = where the social pressure lives. Web = where the story is told. Same Elastic agents under the hood."
- Show both Kibana traces (Beat 2 and Beat 3) — this is the headline Elastic story
- Bot responds within 2–3 seconds of command
- Presenter knows exactly which device to show, when to hold it up, when to switch to laptop for the web reveal
- Contingency: presenter knows where backup screenshots/video and Kibana trace screenshots are

**✅ Done when**: Team has run the demo at least twice without intervention

---

## Buffer — Final Prep (2pm–3pm)

### T13. Submission + Buffer

- Finalize Devpost submission (title, description, tech stack, screenshots, video link)
- Keep one person on standby to fix any last-minute issues
- Rest of team: free to relax, review talking points, or continue polishing

---

## Timeline Summary

| Time | Activity | Owner |
|---|---|---|
| **Prep Day** | P0: Agent Builder setup + IDs noted | Agent Lead |
| **Prep Day** | P1: Elastic Cloud + 4 indices | Elastic Lead |
| **Prep Day** | P2: Mock data seeding (`seed-elastic.ts`) | Elastic Lead |
| **Prep Day** | P3: ES|QL + trends query validation | Elastic Lead |
| **Prep Day** | P4: Amazon Bedrock connector in Kibana | Agent Lead |
| **Prep Day** | P5: Verify `pnpm dev` + `pnpm build` | API Lead |
| **Prep Day** | P6: Verify all lib files (types, elastic, agent, bot) | API Lead |
| **Prep Day** | P7: Verify all API route stubs locally | API Lead |
| **Prep Day** | P8: Vercel deploy + Telegram webhook live | Bot + API Lead |
| **10:00–10:20** | T1a: MealAnalyzerAgent (Bedrock vision tool) | Agent Lead |
| **10:20–10:35** | T1b: DataAggregatorAgent (trends tool) | Agent Lead |
| **10:35–10:50** | T1c: HealthCoachAgent (A2A orchestrator, write_meal_score tool) | Agent Lead |
| **10:50–11:00** | T1d: KiasuRefereeAgent (A2A orchestrator, standings tool) | Agent Lead |
| **11:00–11:30** | T4: Verify API routes with live Elastic data | API Lead |
| **11:00–11:30** | T5: Test all bot commands on Telegram (`/join`, `/photo`, `/ask`, `/reveal`) | Bot Lead |
| **12:00–12:20** | T6: End-to-end integration test (full demo flow) | All |
| **12:20–12:40** | T7: Copy + SG flavour polish | Frontend/QA Lead |
| **12:40–13:00** | T8: Reaction messages (emoji-only) | Frontend/QA Lead |
| **13:00–13:20** | T9: Web reveal + dashboard polish | Frontend/QA Lead |
| **13:00–13:20** | T10: Error handling + mock fallbacks | API + Bot Lead |
| **13:20–13:35** | T11: Screenshots + backup video | All |
| **13:35–14:00** | T12: Full demo rehearsal × 2–3 | All |
| **14:00–15:00** | T13: Submission + buffer | All |

---

## Fallback Plans

| Scenario | Fallback |
|---|---|
| **Agent Builder invocation URL wrong** | Check Kibana → Agent Builder → API settings on-site. Update `lib/agent.ts` comment and env var. |
| **HealthCoachAgent not responding** | `lib/agent.ts` returns mock response (`MOCK_MEAL_RESULT`). Demo still flows. Mention "in production, this calls HealthCoachAgent A2A" |
| **KiasuRefereeAgent not responding** | `/api/reveal` falls back to mock reveal text. Cached result also prevents repeated failures. |
| **Elastic connection fails** | `lib/elastic.ts` returns `MOCK_STANDINGS`. Scores are pre-computed. Demo still works. |
| **Telegram webhook down** | Show the web reveal page (`/league/sg-league-001/reveal`) + walk through bot screenshots. The web reveal page calls `callRefereeAgent()` independently — Elastic story still works. |
| **`/reveal` posts wrong content** | Confirm `REFEREE_AGENT_ID` is set and bot is running latest deploy. Fall back to mock standings text. |
| **Live bot fails on stage** | Switch to backup video (recorded in T11). Narrate naturally over it. |
| **Vercel deployment broken** | Run `pnpm dev` locally with ngrok. `ngrok http 3000` → update webhook URL. |
| **Bedrock vision fails** | MealAnalyzerAgent returns mock analysis. `/api/photo` also has hardcoded mock. |

---

## Environment Variables Checklist

Before leaving Prep Day, verify all are set in **both** `.env.local` and the **Vercel dashboard**:

- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `ELASTICSEARCH_URL`
- [ ] `ELASTICSEARCH_API_KEY`
- [ ] `ELASTIC_INDEX_METRICS` = `kiasuhealth-metrics`
- [ ] `ELASTIC_INDEX_PLAYERS` = `kiasuhealth-players`
- [ ] `ELASTIC_INDEX_LEAGUES` = `kiasuhealth-leagues`
- [ ] `ELASTIC_INDEX_REVEALS` = `kiasuhealth-reveals`
- [ ] `HEALTH_COACH_AGENT_ID` ← from P0 (Kibana → Agent Builder)
- [ ] `REFEREE_AGENT_ID` ← from P0 (Kibana → Agent Builder)
- [ ] `DEFAULT_LEAGUE_ID` = `sg-league-001`
- [ ] `NEXT_PUBLIC_APP_URL` = your Vercel URL (e.g. `https://kiasu-health-abc.vercel.app`)

⚠️ `AGENT_BUILDER_ENDPOINT` and `AGENT_BUILDER_API_KEY` are no longer used — replaced by `HEALTH_COACH_AGENT_ID` + `REFEREE_AGENT_ID` (agent IDs). The Kibana URL is derived automatically from `ELASTICSEARCH_URL` in `lib/agent.ts`.

Webhook must be set **after** Vercel deploy:
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://${VERCEL_URL}/api/telegram"
```
