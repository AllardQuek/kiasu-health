# FIRST_PROMPT.md — Bootstrap Prompt for KiasuHealth

Copy the text below (starting from the `---`) and paste it as your first message in a new Claude Code session at the root of this repo.

---

Read these docs fully before writing a single line of code:

1. `CLAUDE.md` — project overview, architecture summary, design quick reference, critical rules
2. `docs/ARCHITECTURE.md` — Elastic index schemas, ES|QL queries, all API routes with request/response shapes, Agent Builder tool definitions, demo script
3. `docs/TASKS.md` — hour-by-hour build plan with role ownership and done criteria
4. `docs/BRAND_GUIDELINES.md` — colour palette (Option B: Breezy SG), typography, component patterns, anti-patterns

Do not generate any code until you have read all four documents. Then build the following, in order:

---

## Step 1 — Project Setup

```bash
pnpm dlx create-next-app@latest kiasu-health \
  --typescript --tailwind --eslint --app \
  --src-dir=false --import-alias="@/*"

cd kiasu-health

# Bot + Elastic
pnpm add grammy @elastic/elasticsearch

# UI
pnpm dlx shadcn@latest init   # choose: New York, CSS variables, zinc base
pnpm dlx shadcn@latest add card badge button separator

# Motion + Charts
pnpm add framer-motion recharts

# Dev only
pnpm add -D tsx dotenv
```

After running the above, delete the boilerplate in `app/page.tsx` and `app/globals.css` (keep the Tailwind directives).

---

## Step 2 — Tailwind Config

Replace the `theme.extend` block in `tailwind.config.ts` with the full KiasuHealth palette from `docs/BRAND_GUIDELINES.md §11`. The custom color tokens to add:

```
cornsilk, papaya-whip, warm-sand, charcoal-blue, slate-teal, muted-teal,
verdigris, verdigris-dark, burnt-peach, jasmine, sandy-brown, light-bronze
```

Also register the custom CSS variables for `--font-sans` and `--font-mono` as described in BRAND_GUIDELINES.md.

---

## Step 3 — Layout & Fonts

Edit `app/layout.tsx` to:

- Load **Plus Jakarta Sans** (weights 400/500/600/700/800) and **JetBrains Mono** (weights 400/500/700) via `next/font/google`
- Assign them to CSS variables `--font-sans` and `--font-mono`
- Apply `bg-cornsilk text-charcoal-blue` to the `<body>` via `className`
- Include the KiasuHealth wordmark in the root layout (not needed if there's a proper nav component)

---

## Step 4 — Core Lib Files

Create these four files exactly as specified in `docs/ARCHITECTURE.md §2, §3, §7`:

### `lib/types.ts`

Define all shared TypeScript interfaces:

```ts
export interface Player { ... }
export interface WeeklyMetric { ... }
export interface League { ... }
export interface StandingsEntry { ... }
export interface MealPhotoResult { ... }
export interface AgentBuilderRequest { ... }
export interface AgentBuilderResponse { ... }
```

Use field names that match the Elastic index mappings in `docs/ARCHITECTURE.md §2` exactly.

### `lib/mock.ts`

4 seed players: Chris (35, league `sg-league-001`), Komal (42), Zing (28), Gaby (51). Include 7 days of mock `WeeklyMetric` records per player with step counts, meal scores, and activity flags. Export:

- `MOCK_STANDINGS: StandingsEntry[]` — pre-sorted by adjusted score, rank 1–4
- `MOCK_MEAL_RESULT: MealPhotoResult` — example photo analysis response

### `lib/elastic.ts`

```ts
import { Client } from '@elastic/elasticsearch'

export const esClient = new Client({ ... })  // use ELASTICSEARCH_URL + API_KEY env vars

export async function getStandings(leagueId: string): Promise<StandingsEntry[]> {
  // Run the ES|QL query from ARCHITECTURE.md §2
  // Apply TypeScript age multiplier fallback if needed:
  // const ageMultiplier = (age: number) => age >= 50 ? 1.1 : age >= 40 ? 1.05 : 1.0
  // On any error, return MOCK_STANDINGS as fallback
}

export async function writeMealScore(playerId: string, leagueId: string, score: number, weekStart: string): Promise<void> {
  // Index into kiasuhealth-metrics
  // Fields: player_id, league_id, meal_balance_score, week_start_date, recorded_at
  // NEVER write photo_url, calories, or nutrition details
}
```

### `lib/agent.ts`

```ts
export async function callAgentBuilder(workflowId: string, payload: AgentBuilderRequest): Promise<AgentBuilderResponse> {
  // POST to AGENT_BUILDER_ENDPOINT using AGENT_BUILDER_API_KEY
  // On error, return a canned mock response from lib/mock.ts (never throw to caller)
}
```

---

## Step 5 — API Routes

Create the following in `app/api/`. Match the request/response shapes in `docs/ARCHITECTURE.md §3` exactly.

### `app/api/standings/[league_id]/route.ts`
- `GET` handler
- Calls `getStandings(league_id)`
- Returns `{ standings: StandingsEntry[], league_id, week_start, generated_at }`

### `app/api/photo/route.ts`
- `POST` handler, expects `{ photo_url, player_id, league_id }`
- Calls `callAgentBuilder('photo-analysis', ...)`
- Returns `{ player_id, meal_balance_score, calories_estimate, balance_tip, agent_commentary }`
- Does NOT write to Elastic — that is the `/api/meal-score` route's job

### `app/api/meal-score/route.ts`
- `POST` handler, expects `{ player_id, league_id, meal_balance_score, week_start_date }`
- Calls `writeMealScore(...)`
- Returns `{ success: true, player_id, score_recorded }`

### `app/api/reveal/route.ts`
- `POST` handler, expects `{ league_id, week_start_date }`
- Calls `getStandings(league_id)` then `callAgentBuilder('weekly-judgment', ...)`
- Returns `{ standings, winner, loser_nudge, reveal_message, badges }`

### `app/api/telegram/route.ts`
- `POST` webhook handler — wire grammy using `webhookCallback(bot, 'std/http')`
- Register all 3 bot commands on the bot object (see next step)
- Return `NextResponse.json({ ok: true })`

---

## Step 6 — Web Dashboard

The web dashboard is the **main platform** — where users see their league standings, stats, and the Sunday reveal. Build this before the Telegram bot; it's what judges will see on screen.

### `app/page.tsx` — Landing / League Index

Warm landing page: KiasuHealth wordmark, tagline "Out-healthy your kakis, one week at a time.", a single CTA button "View Leaderboard" linking to `/league/sg-league-001`.

### `app/league/[league_id]/page.tsx` — Live Leaderboard

- Server component: fetch `/api/standings/[league_id]` on load
- Import and render `<LeagueTable standings={standings} />` — a client component with Framer Motion stagger entrance (`delay: index * 0.06`, `duration: 0.35`, `easeOut`)
- Rank #1 card gets `champion-glow` class (see BRAND_GUIDELINES.md §5)
- Below the table: 3 `<MetricCard>` components for top player's steps, meal balance, run time
- Auto-refresh data every 30s with `router.refresh()` or `revalidatePath`

### `app/league/[league_id]/reveal/page.tsx` — Sunday Reveal (Required)

- Override page background: `bg-[#264653]` (charcoal-blue, dark mode)
- Fetch `/api/reveal`, render standings in **reverse order** (rank 4 → 1)
- Framer Motion: `delay: index * 0.3`, `duration: 0.5` per card
- Rank #1 card: scale up with 0.2s delayed `champion-glow` after entrance
- CountUp component for the winning score (0 → final value, 1.5s easeOut cubic)
- The `/reveal` bot command sends a clickable link to this page in the group

### Components to create

**`components/leaderboard/LeagueTable.tsx`** — `"use client"`, receives `StandingsEntry[]`, renders staggered `<LeaderboardCard>` rows.

**`components/leaderboard/LeaderboardCard.tsx`** — Single row: rank (JetBrains Mono 700 text-4xl, jasmine for #1), name, final score, progress bar (verdigris fill), badge pill, sub-stats (steps / meal / run).

**`components/leaderboard/RevealSequence.tsx`** — Dark-mode reveal: same card shape, dramatic stagger, CountUp for #1 score.

**`components/stats/MetricCard.tsx`** — Label (uppercase ghost), hero number (JetBrains Mono 4xl), unit, progress bar, target caption.

---

## Step 7 — grammy Bot Handlers

Inside `app/api/telegram/route.ts` (or a separate `lib/bot.ts` imported by the route):

```ts
import { Bot, webhookCallback } from 'grammy'
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!)

// /start
bot.command('start', async (ctx) => {
  await ctx.reply('Eh, welcome to KiasuHealth lah! 🏆\nJoin a league with /join or check your /standings.')
})

// /photo — DM ONLY, single-step:
// grammy fires bot.command() on BOTH text commands and photo captions.
// User sends a photo with /photo as the caption → ctx.message.photo is defined.
// User sends just /photo text → ctx.message.photo is undefined → prompt them.
bot.command('photo', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    await ctx.reply('Eh, send your food photo in a private message to me lah 🤫')
    return
  }

  const photo = ctx.message?.photo
  if (!photo) {
    await ctx.reply('Send your meal photo with /photo as the caption 📸')
    return
  }

  const fileId = photo.at(-1)!.file_id
  const file = await ctx.api.getFile(fileId)
  const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`

  // Call Agent Builder Photo Analysis Workflow
  const result = await callAgentBuilder('photo_analysis', {
    photo_url: photoUrl,
    player_id: ctx.from?.id.toString() ?? 'unknown',
    league_id: process.env.DEFAULT_LEAGUE_ID!,
  })

  await ctx.reply(
    `~${result.calories} kcal, ${result.balance_score}/10 for balance today.\n${result.tip}`,
    { parse_mode: 'Markdown' }
  )
  // Only balance_score is written to Elastic (handled by Agent Builder's write_meal_score tool)
})

// /reveal — group command
bot.command('reveal', async (ctx) => {
  // Call /api/reveal, format standings text, post to group
})
```

---

## Step 8 — Mock Data Seeder

Create `scripts/seed-elastic.ts`:

```ts
// Seeds kiasuhealth-players and kiasuhealth-metrics with the 4 mock players
// from lib/mock.ts using the esClient from lib/elastic.ts
// Run with: pnpm seed
```

Add to `package.json` scripts: `"seed": "tsx scripts/seed-elastic.ts"`

---

## Step 9 — Environment Variables

Create `.env.example` with these keys (never commit `.env.local`):

```
TELEGRAM_BOT_TOKEN=
ELASTICSEARCH_URL=
ELASTICSEARCH_API_KEY=
ELASTIC_INDEX_PLAYERS=kiasuhealth-players
ELASTIC_INDEX_METRICS=kiasuhealth-metrics
ELASTIC_INDEX_LEAGUES=kiasuhealth-leagues
AGENT_BUILDER_ENDPOINT=
AGENT_BUILDER_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## Design Rules — Non-Negotiable

These are absolute constraints from `docs/BRAND_GUIDELINES.md`. Do not deviate without explicit instruction.

| Rule | Detail |
|---|---|
| **Palette** | Option B (Breezy SG) only. No generic health green (#4CAF50 is banned). No clinical white (#FFFFFF isolated). |
| **Fonts** | Plus Jakarta Sans for all UI copy. JetBrains Mono for all numbers, scores, ranks, step counts. No Inter, no system-ui, no sans-serif fallback as primary. |
| **Logo** | `Kiasu` in `#264653`, `Health` in `#2A9D8F`. Both in Plus Jakarta Sans ExtraBold. Never render as a single color. |
| **Buttons (primary)** | `bg-burnt-peach hover:bg-verdigris`, rounded-lg, not pill-shaped. |
| **Copy tone** | Direct, competitive, community-first. Light Singlish touch (one phrase per message max). No "Start your journey", no "Track your health", no solo framing. |
| **Anti-patterns** | See BRAND_GUIDELINES.md §10 — 11 specific things to avoid. |
| **Privacy** | `/photo` DM only. Never store photo URLs, raw calories, or nutrition details in Elastic. |
| **Fallbacks** | Every Elastic query and every Agent Builder call must have a `try/catch` that returns mock data. Demo cannot crash. |

---

## Verification Checklist

Before calling this done, confirm:

- [ ] `pnpm dev` starts with no TypeScript errors
- [ ] `GET /api/standings/sg-league-001` returns 4 ranked players
- [ ] `POST /api/photo` returns a mock meal score (no real photo needed)
- [ ] `POST /api/telegram` responds `{ ok: true }` to a test payload
- [ ] Landing page renders at `/` with wordmark, tagline, and CTA
- [ ] Leaderboard page renders at `/league/sg-league-001` with correct fonts and palette
- [ ] Reveal page renders at `/league/sg-league-001/reveal` with dark mode and animations
- [ ] `/photo` command in a Telegram group replies with the redirect message (not an error)
- [ ] `pnpm seed` indexes mock data without errors
- [ ] No raw calories or photo URLs appear anywhere in the Elastic index
