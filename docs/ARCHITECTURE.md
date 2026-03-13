# KiasuHealth — Architecture Document

**"Out-healthy your kakis, one week at a time."**

KiasuHealth is a Telegram-based social health game where an AI referee (Elastic Agent Builder) aggregates health data, verifies activity claims, ranks players, and triggers rewards and nudges. Groups of 4–8 compete weekly in a challenge — steps, meal balance, activity time — with a Sunday reveal and health perks for the winner.

**Hackathon**: Elastic Forge The Future Singapore — 13 March 2026, 10am–3pm (~5 hours)
**Team**: 4–5 engineers
**Scoring bonus**: Elastic Agent Builder usage

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Layer — Elastic Cloud Serverless](#2-data-layer--elastic-cloud-serverless)
3. [API Routes — Next.js 16](#3-api-routes--nextjs-16)
4. [Telegram Bot — grammy](#4-telegram-bot--grammy)
5. [Elastic Agent Builder](#5-elastic-agent-builder)
6. [Mock Data Spec](#6-mock-data-spec)
7. [Tech Stack](#7-tech-stack)
8. [File Structure](#8-file-structure)
9. [Environment Variables](#9-environment-variables)
10. [Demo Script — 2.5 Minutes](#10-demo-script--25-minutes)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USERS                                                                   │
│  Bot DM: /join /photo /ask          Web: /league/[id]/reveal             │
│  Bot Group: /reveal → standings text + link   Web: /player/[id]          │
└──────────────┬────────────────────────────────┬─────────────────────────┘
               │                                │
               ▼                                ▼
┌──────────────────────────────┐  ┌─────────────────────────────────────────┐
│  grammy webhook              │  │  Next.js API + Web UI                   │
│  POST /api/telegram          │  │                                         │
│  /start  /join               │  │  GET  /api/standings/[league_id]        │
│  /photo (DM) → HealthCoach   │  │  GET  /api/trends/[player_id]           │
│  /ask   (DM) → HealthCoach   │  │  POST /api/reveal  (+ reveals cache)    │
│  /reveal (group) → Referee   │  │  POST /api/meal-score                   │
│    posts text + web link     │  │  POST /api/photo → callHealthCoach()    │
└──────────┬───────────────────┘  └───────────────┬─────────────────────────┘
           │                                      │
           └──────────────┬───────────────────────┘
                          │  lib/agent.ts  callHealthCoachAgent()
                          │               callRefereeAgent()
                          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Elastic Agent Builder (Kibana) — A2A multi-agent system                │
│                                                                          │
│  ORCHESTRATORS (invoked from lib/agent.ts via Kibana API):              │
│                                                                          │
│  HealthCoachAgent                    KiasuRefereeAgent                  │
│  env: HEALTH_COACH_AGENT_ID          env: REFEREE_AGENT_ID              │
│   ├─A2A→ MealAnalyzerAgent            └─A2A→ DataAggregatorAgent        │
│   └─A2A→ DataAggregatorAgent                                            │
│   Tool: write_meal_score              Tool: get_league_standings         │
│                                                                          │
│  SPECIALISTS (A2A only — never called directly from code):              │
│                                                                          │
│  MealAnalyzerAgent                   DataAggregatorAgent                │
│  Tool: analyze_meal_image             Tool: get_player_metrics          │
│   └──→ Amazon Bedrock                  └──→ GET /api/trends/[player_id] │
│         Claude Haiku (vision)                                            │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                                       ▼
                    ┌──────────────────────────────────────┐
                    │  Elastic Cloud Serverless            │
                    │  kiasuhealth-players  (telegram_id)  │
                    │  kiasuhealth-metrics  (scores only)  │
                    │  kiasuhealth-leagues  (join_code)    │
                    │  kiasuhealth-reveals  (reveal cache) │
                    │  maps-geojson-*       (SG geodata)   │
                    │  ES|QL: weekly rankings + trend δ    │
                    └──────────────────────────────────────┘
```

**Key decisions:**
- **Bot = Action + Social**: DM for meal submissions (`/photo`), data queries (`/ask`), onboarding (`/join`). Group for social game moment (`/reveal`).
- **Web = Visualisation + History**: cinematic reveal page, live leaderboard with charts, personal player dashboard with meal history timeline. Richer experience impossible inside a chat interface.
- **`/reveal` calls `callRefereeAgent()` AND posts text + link** — the bot posts actual ranked standings from KiasuRefereeAgent directly in the group chat, then appends the web link for the cinematic version. Not a URL redirect.
- **Two A2A chains, two Kibana traces, one consistent story**: `/photo`+`/ask` trigger HealthCoachAgent chain; `/reveal` and web reveal page trigger KiasuRefereeAgent chain. Same Elastic Agent Builder infrastructure regardless of surface.
- **`/api/photo` calls `callHealthCoachAgent()`** — this is a live agent call. Mock fallback is retained for when Agent Builder is unavailable, but the live path is active.
- `kiasuhealth-reveals` index caches weekly judgment results — Agent Builder only runs once per week per league
- Meal photos analyzed by Amazon Bedrock Claude Haiku inside Kibana (MealAnalyzerAgent) — only `meal_balance_score` (0–10) written to Elastic; never raw photo, calories, or nutrition
- grammy runs inside Next.js API route — one repo, one `pnpm dev`, one `git push`
- Kibana URL = ELASTICSEARCH_URL with `.es.` replaced by `.kb.` (derived automatically in `lib/agent.ts`)
- `maps-geojson-*` indices (12 OpenGov SG datasets) are pre-populated; the app only reads them via `getNearbyVenues()` in `lib/elastic.ts` — never writes
- `getNearbyVenues(player_id, category, radius_km)` queries the nearest healthier-eating / park / gym venue to a player's `home_location` and returns a `nearby_suggestion` field that flows through `/api/trends` → DataAggregatorAgent → HealthCoachAgent nudge

---

## 2. Data Layer — Elastic Cloud Serverless

### Deployment

Use **Elastic Cloud Serverless** (preferred for hackathon — serverless Elasticsearch, no cluster sizing).

Sign up: https://cloud.elastic.co → "Create serverless project" → type: Elasticsearch

### Indices

#### `kiasuhealth-players`
```json
{
  "mappings": {
    "properties": {
      "player_id":     { "type": "keyword" },
      "telegram_id":   { "type": "keyword" },
      "name":          { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "league_id":     { "type": "keyword" },
      "age":           { "type": "integer" },
      "gender":        { "type": "keyword" },
      "home_location": { "type": "geo_point" },
      "total_wins":    { "type": "integer" },
      "created_at":    { "type": "date" }
    }
  }
}
```

> `home_location` is a `[lon, lat]` geo_point set from the player's run route centroid (derived from Apple Health / Strava GPX data) or manually configured. Used by `getNearbyVenues()` in `lib/elastic.ts` to query nearby venues from `maps-geojson-*` indices. `total_wins` is incremented by KiasuRefereeAgent each time a player wins a weekly judgment.

#### `kiasuhealth-metrics`
```json
{
  "mappings": {
    "properties": {
      "player_id":          { "type": "keyword" },
      "league_id":          { "type": "keyword" },
      "date":               { "type": "date" },
      "steps":              { "type": "integer" },
      "meal_balance_score": { "type": "float" },   // 0–10; only score stored, never raw photo/nutrition
      "run_time_minutes":   { "type": "float" },
      "sleep_hours":        { "type": "float" },
      "source":             { "type": "keyword" }  // "apple_health" | "strava" | "manual" | "mock"
    }
  }
}
```

#### `kiasuhealth-leagues`
```json
{
  "mappings": {
    "properties": {
      "league_id":   { "type": "keyword" },
      "name":        { "type": "text" },
      "join_code":   { "type": "keyword" },
      "chat_id":     { "type": "keyword" },  // Telegram group chat ID
      "config": {
        "properties": {
          "steps_weight":   { "type": "float" },      // default: 0.4
          "meal_weight":    { "type": "float" },       // default: 0.4
          "activity_weight":{ "type": "float" }        // default: 0.2
        }
      },
      "created_at":  { "type": "date" }
    }
  }
}
```

#### `kiasuhealth-reveals`
```json
{
  "mappings": {
    "properties": {
      "league_id":       { "type": "keyword" },
      "week_start":      { "type": "date" },
      "standings_text":  { "type": "text" },
      "winner_name":     { "type": "keyword" },
      "nudge":           { "type": "text" },
      "reward":          { "type": "text" },
      "processed_at":    { "type": "date" }
    }
  }
}
```

> Keyed by composite ID `{league_id}_{week_start}` — `getRevealCache()` in `lib/elastic.ts` checks this before invoking KiasuRefereeAgent. Agent Builder runs at most once per week per league.

#### `kiasuhealth-ecg` _(optional curiosity — not wired to scoring)_
```json
{
  "mappings": {
    "properties": {
      "player_id":       { "type": "keyword" },
      "recorded_at":     { "type": "date" },
      "classification":  { "type": "keyword" },
      "heart_rate_bpm":  { "type": "float" },
      "sampling_hz":     { "type": "integer" },
      "source":          { "type": "keyword" }  // "apple_health"
    }
  }
}
```

> Indexed from Apple Watch ECG exports (`data/apple_health_export/electrocardiograms/*.csv`). Displayed as a curiosity stat on the player profile — not used in scoring. Useful for the demo story: "We even have ECG data — but we keep scoring focused on steps, meals, and activity." Index with `npx tsx scripts/seed-elastic.ts --ecg` if time permits.

#### `maps-geojson-*` _(read-only geodata — pre-populated before hackathon)_

These 12 indices are already populated by `scripts/index-geodata.ts` using OpenGov Singapore datasets. The app only reads from them — never writes.

| Index name | Dataset | Use in app |
|---|---|---|
| `maps-geojson-heritagetrails` | NParks Heritage walking trails | Run/walk suggestions |
| `maps-geojson-breastscreeningcentregeojson` | Breast Screening Centres | Health awareness context |
| `maps-geojson-hawkercentresgeojson` | Hawker centres | Contextual meal tips |
| `maps-geojson-sportsgsportfacilitiesgeojson` | SportSG facilities (pools, courts) | Activity suggestions |
| `maps-geojson-cyclingpathnetworkgeojson` | NParks cycling paths | Activity suggestions |
| `maps-geojson-cervicalscreeningcentregeojson` | Cervical Screening Centres | Health awareness context |
| `maps-geojson-sportsfieldssg` | Sports fields | Activity suggestions |
| `maps-geojson-gymssggeojson` | ActiveSG gyms | Primary: activity coaching nudges |
| `maps-geojson-wateractivitiessg` | Water sports venues | Activity suggestions |
| `maps-geojson-chasclinics` | CHAS GP/dental clinics | Health awareness context |
| `maps-geojson-parkssg` | Singapore parks | Primary: run/walk route suggestions |
| `maps-geojson-healthiereateries` | HPB Healthier Dining Programme restaurants | Primary: meal coaching nudges |

**`getNearbyVenues(player_id, category, radius_km)`** in `lib/elastic.ts`:
- Looks up the player's `home_location` from `kiasuhealth-players`
- Queries the appropriate `maps-geojson-*` index using Elasticsearch geo_distance filter
- Returns `{ name, address, category }` for the nearest venue matching the player's `coaching_focus`
- Called by `/api/trends/[player_id]` route and included as `nearby_suggestion` in the response

```typescript
// lib/elastic.ts — add one line here to support a new category; nothing else changes
export const GEODATA_INDEX: Record<string, string> = {
  meal:     "maps-geojson-healthiereateries",  // 1829 HPB Healthier Dining venues
  steps:    "maps-geojson-parkssg",            // 52 NParks parks
  activity: "maps-geojson-gymssggeojson",      // 159 ActiveSG gyms
};
```

> Verify index names on Prep Day: `GET /_cat/indices?v&index=maps-geojson-*` in Kibana Dev Tools. The exact suffix may differ from the filename — adjust `GEODATA_INDEX` in `lib/elastic.ts` accordingly.

### ES|QL Weekly Standings Query

This query runs for the current week (Mon–Sun), applies age-adjustment, and returns ranked standings. Run via `/_query` API endpoint.

```esql
FROM kiasuhealth-metrics
| WHERE league_id == "LEAGUE_ID_PLACEHOLDER"
  AND date >= DATE_TRUNC("week", NOW())
| STATS
    total_steps      = SUM(steps),
    avg_meal_balance = AVG(meal_balance_score),
    total_run_mins   = SUM(run_time_minutes),
    days_active      = COUNT_DISTINCT(date)
  BY player_id
| EVAL
    steps_score    = LEAST(total_steps / 70000.0, 1.0) * 40,
    meal_score     = avg_meal_balance / 10.0 * 40,
    activity_score = LEAST(total_run_mins / 150.0, 1.0) * 20,
    raw_score      = steps_score + meal_score + activity_score
| EVAL
    age_multiplier = CASE(
      MV_FIRST(LOOKUP "kiasuhealth-players" ON player_id | EVAL age_group = CASE(age >= 50, 1.1, age >= 40, 1.05, 1.0) ) > 1,
      1.1,
      1.0
    )
| EVAL
    final_score = ROUND(raw_score * age_multiplier, 1)
| SORT final_score DESC
| KEEP player_id, total_steps, avg_meal_balance, total_run_mins, days_active, final_score
```

> **Note for hackathon**: The LOOKUP for age_multiplier may need simplification depending on Elastic serverless ES|QL support. Fallback: fetch player ages separately and apply multiplier in the API route (`lib/elastic.ts`).

**Simplified fallback (apply age multiplier in TypeScript):**
```typescript
// In lib/elastic.ts
const ageMultiplier = (age: number) => age >= 50 ? 1.1 : age >= 40 ? 1.05 : 1.0;
const finalScore = rawScore * ageMultiplier(player.age);
```

---

## 3. API Routes — Next.js 16

```
app/
├── api/
│   ├── telegram/route.ts               ← POST — Telegram webhook (grammy handler)
│   ├── standings/
│   │   └── [league_id]/route.ts        ← GET  — fetch & rank league standings (ES|QL)
│   ├── trends/
│   │   └── [player_id]/route.ts        ← GET  — per-player trends (DataAggregatorAgent tool)
│   ├── photo/route.ts                  ← POST — mock-only test/fallback endpoint
│   ├── meal-score/route.ts             ← POST — write only balance score to Elastic
│   └── reveal/route.ts                 ← POST — cache-first; invokes KiasuRefereeAgent
```

### `GET /api/standings/[league_id]`

Calls Elastic ES|QL, returns ranked player list with scores and badges.

**Response:**
```json
{
  "league_id": "sg-league-001",
  "week": "2026-03-09",
  "players": [
    {
      "rank": 1,
      "player_id": "player3",
      "name": "Zing",
      "total_steps": 9234,
      "avg_meal_balance": 7.5,
      "total_run_mins": 45,
      "final_score": 1840,
      "badge": "Kiasu Champion",
      "age_adjusted": true
    }
  ]
}
```

### `GET /api/trends/[player_id]`

Used exclusively by **DataAggregatorAgent** as a Kibana tool (`get_player_metrics`). Returns two-week aggregate and computed trend deltas for a player.

**Query params:** `league_id` (required)

**Response:**
```json
{
  "player_id": "tg_123456789",
  "league_id": "sg-league-001",
  "current_week":  { "steps": 65400, "avg_meal_balance": 6.8, "run_mins": 45 },
  "prev_week":     { "steps": 58200, "avg_meal_balance": 5.5, "run_mins": 30 },
  "trends": {
    "steps_delta_pct": 12.4,
    "meal_delta": 1.3,
    "run_delta_mins": 15,
    "improving": true
  },
  "coaching_focus": "meal",
  "nearby_suggestion": {
    "name": "Koufu @ Northpoint City",
    "address": "930 Yishun Ave 2, #B1-01, Singapore 769098",
    "category": "Healthier Dining Programme"
  }
}
```

> `nearby_suggestion` is populated by `getNearbyVenues()` in `lib/elastic.ts`. It queries `maps-geojson-healthiereater*` for `coaching_focus: "meal"`, `maps-geojson-parkssg` for `"steps"`, and `maps-geojson-gymssg` for `"activity"` — using the player's `home_location` as origin. Returns `null` if no venue found within `radius_km` (default: 3 km) or if the player has no `home_location` set.

```json
// Fallback response shape when no nearby venue found
{
  ...
  "nearby_suggestion": null
```

### `POST /api/photo`

**Live agent endpoint with mock fallback.** Calls `callHealthCoachAgent()` with the submitted `photo_url`, `player_id`, and `league_id`. HealthCoachAgent invokes MealAnalyzerAgent A2A (Bedrock Claude Haiku for vision) and DataAggregatorAgent A2A (trends), then writes `meal_balance_score` to Elastic via the `write_meal_score` tool. If Agent Builder is unavailable, falls back to `MOCK_MEAL_RESULT` from `lib/mock.ts`.

**Request:** `application/json` — `{ "photo_url": string, "player_id": string, "league_id": string }`

**Response:**
```json
{
  "calories": 780,
  "balance_score": 3,
  "tip": "Swap skin-on chicken for soup to cut ~200 kcal and reduce sodium.",
  "hawker_detected": true,
  "league_score_entry": { "meal_balance_score": 3 }
}
```

> Only `meal_balance_score` is persisted to Elastic. Calories and tip go to the private DM only.

### `POST /api/reveal`

Cache-first endpoint. Checks `kiasuhealth-reveals` for an existing record for this league + week. If cached, returns immediately (`cached: true`). Otherwise invokes KiasuRefereeAgent, then writes result to the cache.

**Request:**
```json
{ "league_id": "sg-league-001" }
```

**Response:**
```json
{
  "standings_text": "🏆 Week 10 Reveal\n\n#1 Zing — 1,840 pts ...",
  "winner_name": "Zing",
  "nudge": "Your meal balance was weak this week. Try lower-cal kopitiam options next week.",
  "reward": "Free healthier kopi for a week ☕",
  "cached": false
}
```

---

## 4. Telegram Bot — grammy

### Setup

grammy runs as a webhook handler inside `app/api/telegram/route.ts`. No separate process needed — it's a serverless function.

```typescript
// app/api/telegram/route.ts
import { Bot, webhookCallback } from "grammy";

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

// Register handlers
bot.command("start", handleStart);
bot.command("photo", handlePhoto);
bot.command("reveal", handleReveal);

export const POST = webhookCallback(bot, "std/http");
```

Set webhook once (run after Vercel deploy):
```bash
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://${VERCEL_URL}/api/telegram"
```

### Commands

#### `/start` (DM with bot)

```typescript
async function handleStart(ctx: Context) {
  await ctx.reply(
    `Eh, welcome to KiasuHealth lah! 🏆\n\n` +
    `Compete with your kakis in weekly health challenges — steps, meals, activity.\n\n` +
    `📸 *Privacy*: Food photos stay between you and me. Only your *balance score* is shared with the league.\n\n` +
    `To join a league, ask your group admin for the join code, then:\n` +
    `/join <code> — Link your account to a league\n\n` +
    `Once joined:\n` +
    `/photo — Submit a meal photo (DM only)\n` +
    `/ask — Ask anything about your health data (DM only)`,
    { parse_mode: "Markdown" }
  );
}
```

#### `/join [code]` (DM)

Onboards a player into a league. Looks up the join code in `kiasuhealth-leagues`, creates/updates a player record in `kiasuhealth-players` with `player_id: "tg_${telegramId}"` and `telegram_id` field, then replies with the league name and leaderboard link.

```typescript
async function handleJoin(ctx: Context) {
  const joinCode = ctx.match?.toString().trim().toUpperCase();
  if (!joinCode) {
    await ctx.reply("Usage: /join YOUR_LEAGUE_CODE");
    return;
  }
  const league = await getLeagueByJoinCode(joinCode);
  if (!league) {
    await ctx.reply(`Code "${joinCode}" not found. Check with your group admin.`);
    return;
  }
  const telegramId = ctx.from!.id.toString();
  await upsertPlayer({ player_id: `tg_${telegramId}`, telegram_id: telegramId, ... });
  await ctx.reply(`Joined *${league.name}*! Good luck!\n\nLeaderboard: ${appUrl}/league/${league.league_id}`, ...);
}
```

#### `/photo` (DM only — critical)

```typescript
async function handlePhoto(ctx: Context) {
  // CRITICAL: enforce DM-only
  if (ctx.chat?.type !== "private") {
    await ctx.reply("Send me your food photo in a private message 🤫");
    return;
  }
  const photo = ctx.message?.photo;
  if (!photo) {
    await ctx.reply("Send your meal photo with /photo as the caption 📸");
    return;
  }

  const fileId = photo[photo.length - 1].file_id;
  const file = await ctx.api.getFile(fileId);
  const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  // Calls HealthCoachAgent A2A → MealAnalyzerAgent (Bedrock Claude Haiku) → DataAggregatorAgent
  // Agent writes meal_balance_score to Elastic via write_meal_score tool
  const result = await callHealthCoachAgent({ photo_url: photoUrl, player_id: telegramId, league_id });

  await ctx.reply(result.message ?? `~${result.calories} kcal, ${result.balance_score}/10 for balance.\n${result.tip}`);
}
```

#### `/ask` (DM only — conversational data queries)

```typescript
async function handleAsk(ctx: Context) {
  // Enforce DM-only
  if (ctx.chat?.type !== "private") {
    await ctx.reply("Psst — ask me privately lah. DM me /ask for personal advice. 🤫");
    return;
  }
  // Calls HealthCoachAgent A2A → DataAggregatorAgent (reads player's Elastic trends)
  // No photo_url → agent focuses on trend analysis and personalised nudge
  const result = await callHealthCoachAgent({ player_id: telegramId, league_id });
  await ctx.reply(result.message ?? "Keep pushing! Log a meal with /photo for more specific advice.");
}
```

> `/ask` replaces `/coach`. The name signals the user is in control — they can ask anything about their data. Without a `photo_url`, HealthCoachAgent routes to DataAggregatorAgent A2A and returns a trend-based nudge targeting the player's `coaching_focus` field.

#### `/reveal` (group chat — invokes KiasuRefereeAgent, posts text + link)

```typescript
async function handleReveal(ctx: Context) {
  const leagueId = process.env.DEFAULT_LEAGUE_ID!;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Always call KiasuRefereeAgent — this is a live Elastic Agent Builder call
  const result = await callRefereeAgent({ league_id: leagueId });
  const standingsText = result.standings_text ?? buildRevealFallback(leagueId);

  // Post standings text in the group AND append the cinematic web link
  const webLink = appUrl ? `\n\n📊 Full cinematic reveal → ${appUrl}/league/${leagueId}/reveal` : "";
  await ctx.reply(standingsText + webLink, { parse_mode: "Markdown" });
}
```

> `/reveal` calls `callRefereeAgent()` directly — it does not just redirect to the web. The bot posts actual ranked standings text from KiasuRefereeAgent (including winner reward and loser nudge) in the group chat, then appends the web URL for the cinematic animation. The web reveal page uses the cached `kiasuhealth-reveals` result on load, so KiasuRefereeAgent effectively runs once.

---

## 5. Elastic Agent Builder — 4-Agent A2A Design

**Documentation**: https://www.elastic.co/docs/explore-analyze/ai-features/elastic-agent-builder
**Kibana API reference**: https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api

All agents are created and configured in Kibana. `lib/agent.ts` calls only the two orchestrators.

### Agent Invocation

```typescript
// lib/agent.ts — Kibana URL derived automatically
function getKibanaUrl(): string {
  return process.env.ELASTICSEARCH_URL!.replace(".es.", ".kb.");
}

// Internal helper (not exported)
async function invokeAgent(agentId: string, payload: object): Promise<AgentBuilderResponse> {
  const url = `${getKibanaUrl()}/api/elastic_agent_builder/agents/${agentId}/execute`;
  // ⚠️ Confirm exact path in Kibana → Agent Builder → API settings on Prep Day
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `ApiKey ${process.env.ELASTICSEARCH_API_KEY}`,
      "kbn-xsrf": "true",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Agent Builder ${agentId}: ${res.status}`);
  return res.json();
}

export async function callHealthCoachAgent(payload): Promise<AgentBuilderResponse>
export async function callRefereeAgent(payload): Promise<AgentBuilderResponse>
```

---

### Agent A: MealAnalyzerAgent (specialist)

**Purpose**: Analyze a meal photo and return calories + `balance_score` (0–10) + a tip.
**Configured entirely in Kibana** — no code changes needed after initial setup.
**Never called directly from Next.js.** Called A2A by HealthCoachAgent.

#### Tool: `analyze_meal_image`

```yaml
name: analyze_meal_image
type: http   # Kibana HTTP connector → Amazon Bedrock
description: >
  Analyze a meal photo URL using Amazon Bedrock Claude Haiku (vision).
  Return calories estimate, balance_score (0–10), and a one-line hawker-aware tip.
  Only balance_score should be persisted — never return raw nutrition details to the league.
configuration:
  model: anthropic.claude-haiku-3
  region: ap-southeast-1
  multimodal: true
  system_prompt: |
    You are a Singapore health nutrition assistant. Analyze the meal in the image.
    Provide: estimated calories, a balance_score from 0 (very unhealthy) to 10 (excellent),
    and a short practical tip adapted to hawker/kopitiam context if relevant.
    Respond in JSON: { "calories": number, "balance_score": number, "tip": string, "hawker_detected": boolean }
parameters:
  - name: photo_url
    type: string
    required: true
```

#### A2A registration
Called by: HealthCoachAgent (when `photo_url` is present in the request)

---

### Agent B: DataAggregatorAgent (specialist)

**Purpose**: Fetch per-player health trends for a given league. Returns current and previous week aggregates plus computed deltas and coaching focus area.
**Never called directly from Next.js.** Called A2A by both orchestrators.

#### Tool: `get_player_metrics`

```yaml
name: get_player_metrics
type: http   # Kibana HTTP connector → our API
method: GET
url: https://{VERCEL_URL}/api/trends/{player_id}
description: >
  Fetch two-week health trend data for a player. Returns current_week, prev_week aggregates,
  trend deltas (steps_delta_pct, meal_delta, run_delta_mins), and coaching_focus field.
parameters:
  - name: player_id
    type: string
    required: true
  - name: league_id
    type: string
    required: true
```

#### A2A registrations
Called by: HealthCoachAgent (per-player, on /photo or /ask)
Called by: KiasuRefereeAgent (all players in the league, before generating standings text)

---

### Agent C: HealthCoachAgent (orchestrator)

**Purpose**: Personal health coach. Triggered by `/photo` (after meal submission) and `/ask` (on-demand data query). Calls MealAnalyzerAgent when a photo is present, always calls DataAggregatorAgent for context.
**env var**: `HEALTH_COACH_AGENT_ID`

#### A2A registrations
- MealAnalyzerAgent: invoke when `photo_url` is in the request
- DataAggregatorAgent: always invoke to get trends

#### Tool: `write_meal_score`

```yaml
name: write_meal_score
type: http
method: POST
url: https://{VERCEL_URL}/api/meal-score
description: >
  Write ONLY the meal balance score (0–10) to Elastic for a player.
  NEVER write raw calories, photo URLs, or nutrition details.
  This is the only persistent output of meal photo analysis.
parameters:
  - name: player_id
    type: string
    required: true
  - name: league_id
    type: string
    required: true
  - name: meal_balance_score
    type: number
    required: true
    description: Score from 0 (poor) to 10 (excellent balance)
  - name: date
    type: string
    required: false
    description: ISO date string, defaults to today
```

#### System prompt guidance
```
When photo_url is present:
1. Call MealAnalyzerAgent A2A with the photo URL
2. Call DataAggregatorAgent A2A with player_id and league_id
3. Call write_meal_score with the balance_score from step 1
4. Reply with: calories estimate, balance_score, tip, and a personalised nudge from trends

When no photo_url (on-demand /ask or web player page query):
1. Call DataAggregatorAgent A2A with player_id and league_id
2. Return a personalised nudge targeting the coaching_focus field (steps | meal | activity)
3. If nearby_suggestion is present in the DataAggregatorAgent response, incorporate it naturally:
   - For meal coaching_focus: "There's a [HPB healthier option] near you — [name] at [address]. Try it this week!"
   - For steps/activity: "[Park/Gym name] is close to you — great spot for your run/workout target."
   - Keep it conversational, not robotic.

Privacy rule: never include raw calories or nutrition in the response field persisted to Elastic.
```

#### Example output (after `/photo`)
```
~780 kcal, 3/10 for balance today.
High sodium — swap skin-on chicken for soup (saves ~200 kcal).

Your steps are up 12% this week — great momentum! Meal balance is your coaching_focus.
Try a lighter dinner tonight to finish the week strong.
```

---

### Agent D: KiasuRefereeAgent (orchestrator)

**Purpose**: Weekly judge. Triggered when the web reveal page loads (`POST /api/reveal`). Calls DataAggregatorAgent for all players, then generates standings text with badges, winner reward, and loser nudge.
**env var**: `REFEREE_AGENT_ID`

#### A2A registrations
- DataAggregatorAgent: call for each player in the league before generating standings

#### Tool: `get_league_standings`

```yaml
name: get_league_standings
type: http
method: GET
url: https://{VERCEL_URL}/api/standings/{league_id}
description: >
  Fetch ranked standings from the KiasuHealth API for a given league_id.
  Returns player list with scores, steps, meal balance, run time, and badges.
parameters:
  - name: league_id
    type: string
    required: true
```

#### System prompt guidance
```
1. Call get_league_standings to get current ranked standings
2. Call DataAggregatorAgent A2A for each player to get trend context
3. Assign badges:
   - Rank #1 → "Kiasu Champion 🏆"
   - Biggest steps week-over-week improvement → "Most Improved 📈"
   - Best avg meal_balance → "Healthy Kaki 🥗"
   - Consistent daily tracking → "Steady Lah 🔥"
4. Generate winner reward (e.g. "free healthier kopi this week ☕")
5. Generate personalised nudge for the lowest scorer targeting their coaching_focus
6. Return JSON: { standings_text, winner_name, nudge, reward }
```

#### Example output
```
🏆 Week 10 Reveal — League Challenge

#1 Zing           1,840 pts  🏆 Kiasu Champion
#2 Chris          1,620 pts  📈 Most Improved
#3 Komal          1,480 pts  🍱 Healthy Kaki
#4 Gaby           1,210 pts  (age-adjusted ×1.1)

Elastic Agent Builder referee — verified. No disputes accepted.

🎉 Zing wins free healthier kopi this week ☕

Gaby — meal balance dragged you down. Your steps were solid. Next week: try lower-cal kopitiam options.
```

---

## 6. Mock Data Spec

Pre-load this before the hackathon. 4 players × 7 days.

### Players

```json
[
  { "player_id": "player1", "name": "Chris",    "league_id": "sg-league-001", "age": 35, "gender": "M", "home_location": { "lat": 1.365, "lon": 103.820 }, "total_wins": 1 },
  { "player_id": "player2", "name": "Komal",    "league_id": "sg-league-001", "age": 42, "gender": "F", "home_location": { "lat": 1.353, "lon": 103.943 }, "total_wins": 0 },
  { "player_id": "player3", "name": "Zing",     "league_id": "sg-league-001", "age": 28, "gender": "M", "home_location": { "lat": 1.422, "lon": 103.827 }, "total_wins": 2 },
  { "player_id": "player4", "name": "Gaby",     "league_id": "sg-league-001", "age": 51, "gender": "F", "home_location": { "lat": 1.345, "lon": 103.740 }, "total_wins": 0 }
]
```

> `home_location` coordinates derived from neighbourhood centroids: Zing → Yishun (`[103.827, 1.422]`), Chris → Ang Mo Kio (`[103.820, 1.365]`), Komal → Tampines (`[103.943, 1.353]`), Gaby → Jurong West (`[103.740, 1.345]`). Zing's run metrics are calibrated against real Apple Health GPX data (Yishun area, ~4:30/km pace, ~5 km sessions).

### 7-Day Metrics (Mon 9 Mar – Sun 15 Mar 2026)

| Date       | Chris steps | Chris meal | Komal steps | Komal meal | Zing steps | Zing meal | Gaby steps | Gaby meal |
|------------|-------------|------------|-----------|----------|-------------|------------|-------------|------------|
| 2026-03-09 | 11,200      | 7          | 8,500     | 6        | 9,800       | 8          | 7,200       | 4          |
| 2026-03-10 | 9,500       | 6          | 10,200    | 7        | 8,900       | 7          | 6,800       | 3          |
| 2026-03-11 | 10,800      | 8          | 9,100     | 5        | 11,200      | 9          | 8,100       | 5          |
| 2026-03-12 | 12,100      | 7          | 8,800     | 8        | 7,500       | 6          | 9,200       | 4          |
| 2026-03-13 | 9,900       | 9          | 11,500    | 6        | 10,100      | 7          | 7,600       | 3          |
| 2026-03-14 | 10,300      | 7          | 9,700     | 7        | 12,300      | 8          | 6,400       | 5          |
| 2026-03-15 | 8,700       | 6          | 8,200     | 5        | 9,400       | 7          | 7,300       | 4          |

> Run time (minutes) mock: Chris 45, Komal 30, Zing 60, Gaby 20

Expected standings after ES|QL (approximate, before age adjustment):
1. Zing — most consistent steps + high meal scores
2. Chris — good steps, solid meal
3. Komal — variable steps, solid meal
4. Gaby — lowest meal scores; age multiplier (×1.1) brings her up slightly

> Adjust mock data if you want a more dramatic Gaby comeback story for the demo.

### Data Seeder Script

```typescript
// scripts/seed-elastic.ts
import { Client } from "@elastic/elasticsearch";

const client = new Client({
  node: process.env.ELASTICSEARCH_URL!,
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY! },
});

// Index players and metrics from mock data above
// Run: npx tsx scripts/seed-elastic.ts
```

---

## 7. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend / Bot** | Next.js 16 (App Router, TypeScript) | Unified API + optional dashboard in one repo |
| **Bot framework** | grammy | TypeScript-first, serverless-compatible Telegram framework |
| **Deployment** | Vercel | Zero-config, Telegram webhook URL = Vercel URL, no ngrok |
| **Elastic client** | `@elastic/elasticsearch` (Node.js SDK) | First-class TypeScript support |
| **Database** | Elastic Cloud Serverless | Time-series metrics, ES|QL ranking, Agent Builder integration |
| **AI orchestration** | Elastic Agent Builder | Multi-tool workflows, Kibana UI for rapid iteration |
| **Styling** | Tailwind CSS | Fast iteration |
| **Components** | shadcn/ui | Consistent primitives for optional dashboard |
| **Motion** | Framer Motion | Leaderboard reveal animations |
| **Charts** | Recharts | Score breakdown, trend charts |
| **Fonts** | Plus Jakarta Sans + JetBrains Mono (next/font/google) | See BRAND_GUIDELINES.md |

---

## 8. File Structure

```
kiasu-health/
├── app/
│   ├── layout.tsx                    ← Root layout, fonts (Jakarta Sans + JetBrains Mono)
│   ├── page.tsx                      ← Optional: web dashboard redirect or league overview
│   ├── league/
│   │   └── [league_id]/
│   │       ├── page.tsx              ← Live leaderboard dashboard
│   │       └── reveal/page.tsx       ← Sunday reveal page (dark mode, cinematic)
│   ├── player/
│   │   └── [player_id]/page.tsx      ← Personal dashboard + meal history timeline
│   └── api/
│       ├── telegram/route.ts         ← POST: grammy webhook handler
│       ├── standings/
│       │   └── [league_id]/route.ts  ← GET: ES|QL standings
│       ├── trends/
│       │   └── [player_id]/route.ts  ← GET: player trends (DataAggregatorAgent tool)
│       ├── photo/route.ts            ← POST: calls callHealthCoachAgent() with mock fallback
│       ├── meal-score/route.ts       ← POST: write only score to Elastic
│       └── reveal/route.ts           ← POST: cache-first; invokes KiasuRefereeAgent
│
├── lib/
│   ├── elastic.ts                    ← Elastic client + ES|QL helpers + trend/cache helpers
│   ├── agent.ts                      ← callHealthCoachAgent() + callRefereeAgent()
│   ├── types.ts                      ← TypeScript interfaces (Player, Metric, PlayerTrends, RevealRecord, etc.)
│   ├── bot.ts                        ← grammy command handlers (/join /photo /ask /reveal)
│   └── mock.ts                       ← Mock standings + photo response for fallback/dev
│
├── components/
│   ├── leaderboard/
│   │   ├── LeaderboardCard.tsx       ← Single player row (rank, name, score, progress)
│   │   ├── LeagueTable.tsx           ← Full ranked list
│   │   └── RevealSequence.tsx        ← Animated Sunday reveal (reverse order)
│   ├── stats/
│   │   ├── MetricCard.tsx            ← Steps/meal/activity stat card
│   │   └── WeeklyChart.tsx           ← Trend chart for the week
│   └── ui/                           ← shadcn components
│
├── scripts/
│   ├── seed-elastic.ts               ← One-time mock data indexer (players, metrics, leagues, reveals)
│   └── index-geodata.ts              ← ⚠️ Already run — indexes 12 OpenGov SG GeoJSON/KML files into maps-geojson-* indices
│
├── public/                           ← Static assets
├── .env.local                        ← (gitignored) — see Section 9
├── .env.example                      ← Committed; safe defaults
├── tailwind.config.ts                ← Custom colors per BRAND_GUIDELINES.md
└── package.json
```

---

## 9. Environment Variables

`.env.local` (gitignored — add all to Vercel dashboard too):

```env
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather

# Elastic Cloud Serverless
ELASTICSEARCH_URL=https://your-deployment.es.region.aws.elastic.cloud
ELASTICSEARCH_API_KEY=your_api_key
ELASTIC_INDEX_METRICS=kiasuhealth-metrics
ELASTIC_INDEX_PLAYERS=kiasuhealth-players
ELASTIC_INDEX_LEAGUES=kiasuhealth-leagues
ELASTIC_INDEX_REVEALS=kiasuhealth-reveals

# Elastic Agent Builder (agent IDs from Kibana → Agent Builder after creating each agent)
# Kibana URL is derived automatically: ELASTICSEARCH_URL with ".es." → ".kb."
HEALTH_COACH_AGENT_ID=           # HealthCoachAgent — orchestrator for /photo and /coach
REFEREE_AGENT_ID=                # KiasuRefereeAgent — orchestrator for /api/reveal

# Amazon Bedrock (configured as a Kibana HTTP connector inside MealAnalyzerAgent — not used in Next.js code)
# Reference: AWS IAM credentials must be set in Kibana Connector settings, not here
# AWS_REGION=ap-southeast-1
# AWS_BEDROCK_MODEL_ID=anthropic.claude-haiku-3

# App config
DEFAULT_LEAGUE_ID=sg-league-001
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

`.env.example` (committed):
```env
TELEGRAM_BOT_TOKEN=
ELASTICSEARCH_URL=
ELASTICSEARCH_API_KEY=
ELASTIC_INDEX_METRICS=kiasuhealth-metrics
ELASTIC_INDEX_PLAYERS=kiasuhealth-players
ELASTIC_INDEX_LEAGUES=kiasuhealth-leagues
ELASTIC_INDEX_REVEALS=kiasuhealth-reveals
HEALTH_COACH_AGENT_ID=
REFEREE_AGENT_ID=
DEFAULT_LEAGUE_ID=sg-league-001
NEXT_PUBLIC_APP_URL=
```

> **⚠️ Prep Day blocker**: After creating agents in Kibana, copy `HEALTH_COACH_AGENT_ID` and `REFEREE_AGENT_ID` into `.env.local` and Vercel. Also confirm the exact Agent Builder invocation URL path in Kibana → Agent Builder → API settings — the path in `lib/agent.ts` includes a `⚠️` comment to mark this.

---

## 10. Demo Script — 2.5 Minutes

Full flow for the judging panel. Presenter has the bot open on their phone + laptop showing the web reveal.

### Beat 1 — Context (20–30s)

Show the Telegram group: "4 players are already in this week's KiasuHealth League Challenge — steps + meal balance."

Show the existing chat history (pre-seeded bot message):
> "KiasuHealth League Challenge: Week 10 begins. Steps + meal balance. Track daily, reveal Sunday 8 PM."

Mention: "Players joined with `/join KIASU01` — one command, no app install needed."

### Beat 2 — Photo Verification (50–60s)

Presenter: "Each player connected Apple Health and Strava earlier this week. We also log meals — but privately."

Open a **private DM** with the KiasuHealth bot. Show only the presenter's phone.

Send `/photo` + a pre-saved hawker meal photo (char kway teow or similar).

Bot replies privately (HealthCoachAgent A2A → MealAnalyzerAgent Bedrock → DataAggregatorAgent):
> "~780 kcal, 3/10 for balance today. High sodium — swap skin-on chicken for soup next time.
> Your steps are up 12% this week — meal balance is your focus. Lighter dinner tonight!"

Explain: "That response is only in my DM. The league never sees the photo or the calories — only my balance score (3/10) goes to Elastic. Four agents worked together to produce that personalised message — you can see the A2A trace in Kibana."

### Beat 3 — AI Judgment & Reveal (40s)

In the group chat, type `/reveal`.

Bot calls `callRefereeAgent()` internally — KiasuRefereeAgent A2A chain runs: DataAggregatorAgent for all players → `get_league_standings` ES|QL → standings text with badges.

Bot posts the standings directly to the group chat:
```
🏆 Week 10 Standings — KiasuHealth League Challenge

#1 Zing     1,840 pts 🏆 Kiasu Champion
#2 Chris     1,620 pts 📈 Most Improved
#3 Komal     1,480 pts 🍱 Healthy Kaki
#4 Gaby      1,210 pts (age-adjusted ×1.1)

🎉 Zing wins free healthier kopi this week ☕
Gaby — meal balance dragged you down. Next week: lighter kopitiam options!

Full breakdown: https://kiasu-health.vercel.app/league/sg-league-001/reveal
```

Switch to laptop — open the reveal URL. The cinematic animated reveal loads (dark mode, staggered last-to-first entrance).

Point out: "Same Elastic agents. Same data. Telegram shows the social moment in the group. The web page shows the richer story — charts, weekly trends, meal history."

Show the Kibana A2A trace: `KiasuRefereeAgent → DataAggregatorAgent (×4 players) → get_league_standings`. "This is what Elastic Agent Builder looks like in production — a second trace for a second surface."

### Beat 4 — Close (20s)

Age adjustment: "Gaby gets a 10% boost because she's over 50. Fair competition."

Show the first Kibana trace (HealthCoachAgent chain from Beat 2) and the second (KiasuRefereeAgent chain from Beat 3).

Close: "Two Kibana traces. Two surfaces. One Elastic Agent Builder infrastructure — surface-agnostic agents powering kiasu accountability."

**Total: ~2.5 minutes**

### Contingency

If live bot fails: present the pre-recorded walkthrough video (recorded on Prep Day). Keep it casual — narrate naturally over the recording, don't read from a script. Have screenshots of the key moments saved locally.
