# CLAUDE.md — Project Context for AI Assistants

## What is this project?

DefaultTaste is a platform that reveals the hidden aesthetic preferences ("default taste") of AI agents. We probe AI models by asking them to generate websites and music hundreds of times, analyze the patterns in their outputs, and produce a visual "taste profile" showing their defaults — plus a correction prompt to override them.

**Hackathon project.** Gemini 3 Singapore, March 7, 2026. Team of 2. 7 hours to build.

## Key Documents

Read these before writing any code:

- `ARCHITECTURE.md` — System design, data flow, file structure, demo script
- `TASKS.md` — Step-by-step build plan with timeline and ownership
- `BRAND_GUIDELINES.md` — Visual identity, colors, fonts, components, anti-patterns
- `.env.example` — Environment variables

## Tech Stack

- **Frontend:** Next.js 15+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Data Generation:** Python scripts (offline, not in API routes)
- **APIs:** Google Gemini 2.5 Flash (text/code), Lyria RealTime (music via WebSocket)
- **Fonts:** Instrument Serif (display), JetBrains Mono (data/body)
- **Deployment:** Vercel

## Architecture Summary

```
Python scripts (offline) → data/ directory (JSON + WAV)
                                    ↓
                    Next.js frontend reads data/ and visualizes
```

Data generation and the frontend are decoupled. Python scripts run in terminal with retry/resume. The Next.js app reads pre-generated JSON files from `data/` and serves them. Mock data exists in `src/lib/mock.ts` for development before real data is ready.

## Project Structure

```
defaulttaste/
├── scripts/              # Python data generation (offline)
├── data/                 # Generated artifacts (JSON + WAV)
│   ├── websites/raw/     # 100 raw Gemini responses
│   ├── websites/parsed/  # 100 analyzed results
│   ├── websites/profile.json
│   ├── music/audio/      # WAV files from Lyria
│   ├── music/raw/        # Music generation metadata
│   ├── music/parsed/     # librosa + Gemini analysis
│   ├── music/profile.json
│   ├── negation/         # Correction prompts
│   └── demo/             # Before/after assets
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── agent/[agentId]/page.tsx  # Agent profile page
│   │   └── api/                  # Minimal API routes
│   ├── components/
│   │   ├── landing/              # Hero, AgentCard, ProbeInput, Ticker
│   │   └── profile/              # Charts, CorrectionPrompt, BeforeAfter
│   └── lib/
│       ├── types.ts              # TypeScript interfaces
│       ├── mock.ts               # Mock data for dev
│       └── data.ts               # Loads real data, falls back to mock
└── public/audio/                 # Served audio files
```

## Design System — CRITICAL

**Read `BRAND_GUIDELINES.md` in full before writing any frontend code.**

### Quick reference for every component you build:

**Colors:**
- Background: `bg-zinc-950` (page), `bg-zinc-900` (cards), `bg-zinc-800` (elevated)
- Accent: `text-amber-600`, `bg-amber-600` — used sparingly for key stats and CTAs only
- Text: `text-zinc-50` (primary), `text-zinc-400` (secondary), `text-zinc-500` (labels)
- Borders: `border-zinc-800` (default), `border-zinc-700` (hover)
- Chart colors: `["#D97706", "#A1A1AA", "#EA580C", "#52525B", "#FBBF24", "#78716C"]`

**Typography:**
- Headlines: Instrument Serif (loaded via Google Fonts), `font-serif`
- Everything else: JetBrains Mono, `font-mono`
- Labels: `text-xs uppercase tracking-widest text-zinc-500`
- Stat numbers: `text-5xl font-bold text-zinc-50`
- The number is always the hero. "78%" is huge. "Framework" is tiny.

**Layout:**
- Cards: `bg-zinc-900 border border-zinc-800 rounded-sm p-6` — SHARP corners, never rounded-lg
- Borders not shadows. Never use `shadow-lg` or `shadow-xl`.
- Dense, data-first. No decorative whitespace.
- Max width: `max-w-7xl mx-auto`

**Motion (Framer Motion):**
- Stagger entrance: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}` with `delay: index * 0.08`
- Duration: 0.4s for cards, 0.3s for small elements
- Easing: `easeOut` only. No springs, no bounces.

### NEVER use these (they are the AI defaults we're exposing):

- ❌ Purple/indigo colors (#6366F1, #8B5CF6, etc.)
- ❌ Inter, Roboto, Space Grotesk, or system fonts
- ❌ `rounded-lg`, `rounded-xl`, `rounded-2xl`
- ❌ `shadow-lg`, `shadow-xl`, box shadows on cards
- ❌ Light/white backgrounds
- ❌ Centered hero → subtitle → CTA button pattern
- ❌ 3 feature cards in a row with icons
- ❌ Gradient text
- ❌ Emojis in UI text

### Logo:
"Default" in `text-zinc-50` + "Taste" in `text-amber-600`. Instrument Serif font. That's it.

## Two Pre-Built Agent Profiles

The platform showcases two agents:

1. **Gemini 2.5 Flash** (`agent_id: "gemini-flash"`) — Website code generation
   - 100 probes of "Make me a website"
   - Taste dimensions: framework, CSS framework, colors, fonts, layout type, libraries, dark mode %

2. **Lyria RealTime** (`agent_id: "lyria"`) — Music generation
   - 20 probes of vague music prompts
   - Taste dimensions: BPM, key, genre, mood, instruments, cultural origin, brightness, density

## Routes

| Route | What it shows |
|-------|--------------|
| `/` | Landing page: hero, agent cards, platform concept input |
| `/agent/gemini-flash` | Gemini website taste profile + correction + before/after |
| `/agent/lyria` | Lyria music taste profile + correction + before/after |
| `/api/profile/[agentId]` | Returns agent profile JSON |

## Commands

```bash
# Dev server
npm run dev

# Run generation scripts (Python, from project root)
GEMINI_API_KEY=xxx python3 scripts/generate_websites.py
GEMINI_API_KEY=xxx python3 scripts/generate_music.py
GEMINI_API_KEY=xxx python3 scripts/analyze_websites.py
GEMINI_API_KEY=xxx python3 scripts/analyze_music.py
GEMINI_API_KEY=xxx python3 scripts/aggregate_websites.py
GEMINI_API_KEY=xxx python3 scripts/aggregate_music.py

# Deploy
npx vercel
```

## Important Context

- This is a hackathon. Speed over perfection. Ship a working demo.
- The frontend should work with mock data immediately. Real data replaces mock when available.
- The "plug in your agent" form on the landing page is conceptual — it shows the platform vision but doesn't need to actually connect to arbitrary endpoints for the hackathon.
- The before/after demo is the climax. If time is short, prioritize making the before/after comparison visually dramatic.
- Judges score: Impact (20%), Live Demo (45%), Creativity & Originality (35%). The demo matters most.