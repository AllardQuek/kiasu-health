# CLAUDE.md — KiasuHealth Project Context for AI Assistants

## What is this project?

**KiasuHealth** is a social health competition where Singaporeans compete in small group (4–8 player) weekly health challenges. An AI referee (Elastic Agent Builder) aggregates step data, meal photos, and activity records, then produces weekly standings, rewards the winner with health perks, and sends personalised nudges to the stragglers.

**Core insight**: kiasu culture + small group accountability = sustained behaviour change. Not another solo health tracker — Healthy365 asks *"am I healthy?"; KiasuHealth asks *"am I healthier than my kakis?"*

**Surface division**:
- **Telegram Bot** — action layer: `/photo` (snap a meal in DM), `/ask` (query your Elastic data), `/join` (onboarding), `/reveal` (posts ranked standings + web link to the group). Where users are, where the game's social pressure lives.
- **Web App** — visualisation layer: cinematic Sunday reveal page, live leaderboard, charts, meal history timeline. What you'd never build well inside a chat interface.

**Hackathon**: Elastic Forge The Future Singapore — 13 March 2026, 10am–3pm (~5 hours). Team of 4–5 engineers.

**Tagline**: "Out-healthy your kakis, one week at a time."

---

## Key Documents

Read these before writing any code:

- `docs/ARCHITECTURE.md` — full system design, Elastic indices + ES|QL queries, API routes, Agent Builder tools/workflows, mock data spec, demo script
- `docs/TASKS.md` — step-by-step build plan with role ownership and 5-hour timeline
- `docs/BRAND_GUIDELINES.md` — visual identity, colour palette, typography, component patterns, anti-patterns
- `.env.example` — environment variables

Supporting context (read if you need more depth):
- `docs/KiasuHealth_Project_Brief.md` — full product vision and user stories
- `docs/KiasuHealth_Hackathon_Plan.md` — original execution plan

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Bot framework** | grammy (TypeScript, serverless-compatible Telegram framework) |
| **Backend / API** | Next.js 16 (App Router + TypeScript) — API routes handle `/standings`, `/photo`, `/reveal`, and Telegram webhook in one repo |
| **Deployment** | Vercel — `git push` = live. Telegram webhook URL = Vercel domain. No ngrok. |
| **Database** | Elastic Cloud Serverless — time-series health metrics, ES|QL ranking |
| **Elastic client** | `@elastic/elasticsearch` (official Node.js SDK) |
| **AI orchestration** | Elastic Agent Builder — custom tools + agentic workflows |
| **Styling** | Tailwind CSS with custom KiasuHealth palette (see BRAND_GUIDELINES.md) |
| **Components** | shadcn/ui (New York style, CSS variables) |
| **Motion** | Framer Motion (leaderboard reveal animations) |
| **Charts** | Recharts (score breakdowns, weekly trends) |
| **Fonts** | Plus Jakarta Sans (brand/UI) + JetBrains Mono (scores/data) via `next/font/google` |

---

## Architecture Summary

```
Telegram DM: /photo + meal image          Telegram Group: /reveal
         │                                          │
         ▼                                          ▼
POST /api/telegram  ←──── grammy webhook handler (Vercel serverless)
         │                           │
         │ /photo, /ask              │ /reveal
         ▼                           ▼
 callHealthCoachAgent()         callRefereeAgent()
         │                           │
    ┌────┴────┐                 ┌────┴────┐
    ▼         ▼                 ▼         ▼
MealAnalyzer  DataAggregator  Standings  DataAggregator
Agent (A2A)   Agent (A2A)     (ES|QL)   Agent (A2A)
    │                               │
    └──── Amazon Bedrock (vision)   │
                                    ▼
                         Elastic Cloud Serverless
                         kiasuhealth-players / metrics / leagues / reveals

Web App (browser):
  /league/[id]/reveal  ← cinematic Sunday reveal (triggers callRefereeAgent)
  /league/[id]         ← live leaderboard + Nearby for You
  /player/[id]         ← personal dashboard + meal history
```

**Two Agent Builder chains, two surfaces, one Kibana trace story:**
- `/photo` or `/ask` in Telegram DM → `callHealthCoachAgent()` → HealthCoachAgent A2A chain → Kibana trace
- `/reveal` in group or web reveal page load → `callRefereeAgent()` → KiasuRefereeAgent A2A chain → Kibana trace

**Score privacy**: Meal photos are analyzed by MealAnalyzerAgent (Bedrock Claude Haiku inside Kibana). Only `meal_balance_score` (0–10) is written to Elastic. The group never sees the photo, raw calories, or nutrition details.

---

## Project Structure

```
kiasu-health/
├── app/
│   ├── layout.tsx                  ← fonts, global styles
│   ├── page.tsx                    ← dashboard / league overview
│   ├── league/
│   │   └── [league_id]/
│   │       ├── page.tsx            ← live leaderboard + Nearby for You section
│   │       └── reveal/page.tsx     ← Sunday reveal (dark mode, cinematic animation)
│   ├── player/
│   │   └── [player_id]/page.tsx    ← personal dashboard + meal history (NEW)
│   └── api/
│       ├── telegram/route.ts       ← grammy webhook
│       ├── standings/[league_id]/route.ts
│       ├── trends/[player_id]/route.ts
│       ├── photo/route.ts          ← calls callHealthCoachAgent() (not mock-only)
│       ├── meal-score/route.ts
│       └── reveal/route.ts
├── lib/
│   ├── elastic.ts                  ← Elastic client + ES|QL helpers
│   ├── agent.ts                    ← callHealthCoachAgent() + callRefereeAgent()
│   ├── types.ts                    ← TypeScript interfaces
│   ├── bot.ts                      ← grammy handlers
│   └── mock.ts                     ← mock standings + photo response for fallback
├── components/
│   ├── leaderboard/
│   │   ├── LeaderboardCard.tsx
│   │   ├── LeagueTable.tsx
│   │   └── RevealSequence.tsx
│   ├── stats/
│   │   ├── MetricCard.tsx
│   │   └── WeeklyChart.tsx
│   └── ui/                         ← shadcn components
├── scripts/
│   └── seed-elastic.ts             ← one-time mock data indexer
├── .env.local                      ← gitignored
├── .env.example                    ← committed
└── tailwind.config.ts              ← custom KiasuHealth colors
```

---

## Design System — Quick Reference

**Read `docs/BRAND_GUIDELINES.md` in full before writing any frontend code.**

### Colors (configure in `tailwind.config.ts`)

```
Page bg:       bg-cornsilk        #FEFAE0
Card bg:       bg-papaya-whip     #FAEDCD
Elevated:      bg-warm-sand       #F4E1B0
Primary text:  text-charcoal-blue #264653
Secondary:     text-slate-teal    #4A7C8A
Ghost/labels:  text-muted-teal    #8AACB4
Accent:        bg-verdigris       #2A9D8F  ← health, active states, progress bars
CTA/Hot:       bg-burnt-peach     #E76F51  ← buttons, champion badge
Gold/#1:       bg-jasmine         #E9C46A  ← rank 1, achievements
Border:        border-jasmine     #E9C46A
```

### Typography

```
Brand / UI:       Plus Jakarta Sans (--font-sans)   — headlines, names, body
Scores / Data:    JetBrains Mono (--font-mono)       — ranks, step counts, scores
Stat hero:        text-4xl font-mono font-bold text-charcoal-blue
Labels:           text-xs uppercase tracking-wide text-muted-teal font-sans font-500
```

### Components

```
Cards:       bg-papaya-whip border border-jasmine rounded-lg p-6
Buttons (CTA):   bg-burnt-peach hover:bg-verdigris text-white rounded-lg
Buttons (ghost): border border-verdigris text-verdigris hover:bg-verdigris hover:text-white rounded-lg
Rank #1 card:    add champion-glow class (see BRAND_GUIDELINES.md)
```

### Logo

```tsx
// KiasuHealth wordmark — color split is the brand
<span className="font-sans font-extrabold text-charcoal-blue">Kiasu</span>
<span className="font-sans font-extrabold text-verdigris">Health</span>
```

### Motion

Leaderboard entrance: stagger `0.06s`, `duration: 0.35s`, `easeOut`. Reveal sequence (Sunday): stagger `0.3s`, last-to-first order, #1 arrives last.

---

## Elastic Agent Builder

**Official docs** (keep these open while building):
- https://www.elastic.co/docs/explore-analyze/ai-features/elastic-agent-builder
- https://www.elastic.co/docs/explore-analyze/ai-features/agent-builder/kibana-api

### Two A2A Chains

| Chain | Trigger | Agents | Output |
|---|---|---|---|
| **HealthCoachAgent chain** | `/photo` or `/ask` in Telegram DM | HealthCoachAgent → MealAnalyzerAgent (vision) + DataAggregatorAgent (trends) | Private reply: calories + score + tip + nudge. Writes `meal_balance_score` to Elastic. |
| **KiasuRefereeAgent chain** | `/reveal` group command or web reveal page load | KiasuRefereeAgent → DataAggregatorAgent (all players) | Standings text + badges + winner reward + loser nudge. Cached in `kiasuhealth-reveals`. |

### Agent Builder Tools

| Tool | Agent | Method | URL | Purpose |
|---|---|---|---|---|
| `analyze_meal_image` | MealAnalyzerAgent | Bedrock | (Claude Haiku vision) | Estimates calories + balance score from photo URL |
| `get_player_metrics` | DataAggregatorAgent | GET | `/api/trends/{player_id}` | Fetches 2-week trends + nearby venue suggestion |
| `write_meal_score` | HealthCoachAgent | POST | `/api/meal-score` | Writes **only** `meal_balance_score` to Elastic |
| `get_league_standings` | KiasuRefereeAgent | GET | `/api/standings/{league_id}` | Fetches ES|QL ranked standings |

---

## Critical Rules

1. **Never store raw meal photos, calories, or nutrition details in Elastic** — only `meal_balance_score` (0–10)
2. **`/photo` command must be DM-only** — check `ctx.chat.type === 'private'` before processing; if triggered in group, reply "Send me your food photo in a private message 🤫" and return early
3. **`/ask` command must be DM-only** — same enforcement as `/photo`
4. **`/reveal` posts standings text + web link** — bot calls `callRefereeAgent()`, formats the standings, then appends the web link. It is NOT just a URL redirect.
5. **`/api/photo` calls `callHealthCoachAgent()`** — this is a live agent call, not mock-only. Keep mock fallback if agent is unavailable.
6. **Age adjustment** — players age ≥50 get ×1.1 multiplier; ≥40 get ×1.05. Apply in `lib/elastic.ts` if ES|QL LOOKUP isn't available in serverless
7. **Mock data first** — all routes must fall back to `lib/mock.ts` if Elastic or Agent Builder is unavailable; never let the demo crash silently
8. **Telegram webhook = Vercel URL** — set it once after deploy: `setWebhook?url=https://{VERCEL_URL}/api/telegram`
9. **Bot commands in scope**: `/start`, `/join`, `/photo` (DM), `/ask` (DM), `/reveal` (group). Drop `/standings` and `/coach`.
