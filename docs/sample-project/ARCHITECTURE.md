# DefaultTaste — Architecture Document (v2)

**"Your AI has taste. You just don't know it yet."**

DefaultTaste is a platform that reveals the hidden aesthetic preferences of AI agents. Users plug in an agent endpoint, we probe it with hundreds of generations, and produce a comprehensive taste profile showing its defaults — plus a correction prompt to override them.

**Hackathon:** Gemini 3 Singapore — March 7, 2026 (10am–5pm)
**Team:** 2 people (Ilham = music/scripts/infra, Friend = frontend/web-analysis)
**APIs:** Gemini 2.5 Flash (text/code), Lyria RealTime (music)
**Budget:** $20 Google Cloud credits

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [System Design](#2-system-design)
3. [Data Generation Layer (Python Scripts)](#3-data-generation-layer-python-scripts)
4. [Data Format & Storage](#4-data-format--storage)
5. [Frontend Platform](#5-frontend-platform)
6. [API Routes](#6-api-routes)
7. [Tech Stack](#7-tech-stack)
8. [File Structure](#8-file-structure)
9. [Environment Variables](#9-environment-variables)
10. [Demo Script](#10-demo-script)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATA GENERATION (Python scripts)               │
│                  Runs offline, before the demo                  │
│                                                                 │
│  ┌──────────────────────┐     ┌──────────────────────┐         │
│  │  generate_websites.py│     │  generate_music.py   │         │
│  │  - 100 runs          │     │  - 20+ runs via Lyria│         │
│  │  - Robust retry      │     │  - WebSocket capture │         │
│  │  - Saves raw JSON    │     │  - Saves WAV + JSON  │         │
│  └──────────┬───────────┘     └──────────┬───────────┘         │
│             │                            │                      │
│             ▼                            ▼                      │
│  ┌──────────────────────────────────────────────────┐          │
│  │              data/ directory                      │          │
│  │  websites/raw/*.json   music/raw/*.json           │          │
│  │  websites/parsed/*.json music/parsed/*.json       │          │
│  │  websites/profile.json  music/profile.json        │          │
│  │  music/audio/*.wav                                │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ reads from
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  FRONTEND PLATFORM (Next.js)                    │
│                                                                 │
│  ┌────────────────┐ ┌───────────────┐ ┌──────────────────┐     │
│  │ Landing Page   │ │ Agent Profile │ │ Before/After     │     │
│  │ "Plug in your  │ │ Taste charts, │ │ Demo with live   │     │
│  │  agent..."     │ │ stats, colors │ │ correction       │     │
│  └────────────────┘ └───────────────┘ └──────────────────┘     │
│                                                                 │
│  Data served from: /api/profile/[agentId]                       │
│  Static JSON files in data/ directory                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key insight:** Data generation and the frontend are **decoupled**. Python scripts run offline (with retry/resume), producing JSON artifacts. The Next.js frontend reads those artifacts and visualizes them. This is more robust than running generation from API routes, which time out and can't retry.

---

## 2. System Design

### 2.1 The Platform Concept

DefaultTaste is presented as a platform where you can profile ANY agent:

```
┌─────────────────────────────────────────────────────────┐
│  DefaultTaste                                           │
│                                                         │
│  "Plug in your AI agent. We'll reveal its taste."       │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Agent Endpoint: [wss://lyria-realtime-exp...]  │  │
│  │  Agent Type:     [REST ▼] [WebSocket ▼]          │  │
│  │  Test Prompt:    [Make me a song]                 │  │
│  │  Runs:           [100]                            │  │
│  │                                                   │  │
│  │  [▶ Start Probing]                                │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ─── Available Profiles ───                             │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Gemini 2.5  │  │ Lyria        │  │ + Add Agent   │  │
│  │ Flash       │  │ RealTime     │  │               │  │
│  │ Code Gen    │  │ Music Gen    │  │               │  │
│  │ 100 probes  │  │ 20 probes    │  │               │  │
│  │ [View →]    │  │ [View →]     │  │               │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────┘
```

For the hackathon, we pre-generate data for two agents (Gemini Flash + Lyria). The platform UI implies extensibility. The "Add Agent" card shows the vision.

### 2.2 Agent Profile Page

Each agent gets a dedicated profile page with:

1. **Header** — Agent name, type, model version, probe count, timestamp
2. **Taste Overview** — radar chart summarizing key dimensions
3. **Detailed Breakdown** — dimension-specific charts (colors, frameworks, BPM, genre, etc.)
4. **Correction Prompt** — generated anti-default system prompt with copy button
5. **Before/After Demo** — side-by-side comparison of default vs. corrected output
6. **Audio Players** — (music agent only) playable samples of default vs. corrected tracks

---

## 3. Data Generation Layer (Python Scripts)

### 3.1 Philosophy

- **Offline-first:** Scripts run in terminal, not in API routes. No timeout issues.
- **Resumable:** Each generation is saved immediately. If the script crashes at run 47/100, restart it and it picks up at 48.
- **Retry with backoff:** Failed API calls retry 3 times with exponential backoff.
- **Progress tracking:** Clear console output showing progress.

### 3.2 Website Generation Script

`scripts/generate_websites.py`

Sends "Make me a website" to Gemini 100 times. Each response saved as `data/websites/raw/001.json` through `data/websites/raw/100.json`.

Each JSON file:
```json
{
  "id": 1,
  "prompt": "Make me a website. Output the complete, working code in a single HTML file...",
  "model": "gemini-2.5-flash-preview-05-20",
  "timestamp": "2026-03-07T10:30:00Z",
  "raw_code": "<!DOCTYPE html>...",
  "generation_time_ms": 3200
}
```

### 3.3 Website Analysis Script

`scripts/analyze_websites.py`

Reads each raw JSON, sends the code to Gemini for self-analysis, saves parsed results as `data/websites/parsed/001.json`.

Each parsed JSON:
```json
{
  "id": 1,
  "framework": "react",
  "css_framework": "tailwind",
  "primary_colors": ["#6366F1", "#8B5CF6", "#F8FAFC"],
  "fonts": ["Inter", "monospace"],
  "layout_type": "landing-page",
  "libraries": ["lucide-react", "framer-motion"],
  "deployment_platform": "vercel",
  "has_dark_mode": true,
  "icon_library": "lucide",
  "description": "A modern SaaS landing page with hero section and pricing cards"
}
```

### 3.4 Website Aggregation Script

`scripts/aggregate_websites.py`

Reads all parsed JSONs, computes frequency distributions, saves `data/websites/profile.json`.

### 3.5 Music Generation Script

`scripts/generate_music.py`

Connects to Lyria RealTime via WebSocket, generates 20+ tracks with vague prompts, saves WAV files to `data/music/audio/` and metadata to `data/music/raw/`.

### 3.6 Music Analysis Script

`scripts/analyze_music.py`

Runs librosa on each WAV (BPM, key, brightness, density) + sends audio to Gemini for semantic classification (genre, mood, instruments). Saves to `data/music/parsed/`.

### 3.7 Music Aggregation Script

`scripts/aggregate_music.py`

Computes music taste profile, saves `data/music/profile.json`.

### 3.8 Negation Prompt Generator

`scripts/generate_negation.py`

Takes both profiles, asks Gemini to generate correction prompts, saves to `data/negation/`.

---

## 4. Data Format & Storage

```
data/
├── websites/
│   ├── raw/
│   │   ├── 001.json          # Raw Gemini response (HTML code)
│   │   ├── 002.json
│   │   └── ...
│   ├── parsed/
│   │   ├── 001.json          # Analyzed: framework, colors, fonts, etc.
│   │   ├── 002.json
│   │   └── ...
│   └── profile.json          # Aggregated taste profile
├── music/
│   ├── audio/
│   │   ├── 001.wav           # Generated audio files
│   │   ├── 002.wav
│   │   └── ...
│   ├── raw/
│   │   ├── 001.json          # Metadata for each generation
│   │   └── ...
│   ├── parsed/
│   │   ├── 001.json          # librosa + Gemini analysis
│   │   └── ...
│   └── profile.json          # Aggregated music taste profile
├── negation/
│   ├── website_negation.txt  # Correction prompt for web
│   └── music_negation.txt    # Correction prompt for music
└── demo/
    ├── default_website.html  # Pre-generated default website
    ├── corrected_website.html # Pre-generated corrected website
    ├── default_music.wav     # Pre-generated default music
    └── corrected_music.wav   # Pre-generated corrected music
```

The frontend reads from `data/` at build time or via API routes. All artifacts are pre-generated — the frontend is purely a visualization/demo layer.

---

## 5. Frontend Platform

### 5.1 Page Structure

| Route | Purpose |
|-------|---------|
| `/` | Landing page — platform concept, agent cards, "plug in your agent" |
| `/agent/gemini-flash` | Gemini Flash code gen taste profile |
| `/agent/lyria` | Lyria RealTime music taste profile |

### 5.2 Landing Page Design

The landing page should feel like a **product**, not a hackathon demo. It communicates:
1. The problem: "AI models have hidden taste that shapes everything they create"
2. The solution: "DefaultTaste reveals and corrects it"
3. The platform: agent cards you can click into

Key visual elements:
- Bold headline with the tagline
- Animated counter or stat ("We probed Gemini 100 times. Here's what we found.")
- Agent profile cards as entry points
- The "plug in your agent" input field (conceptual — shows the platform vision)
- Scrolling ticker or marquee of discovered defaults ("React: 78% | Inter: 62% | Purple: 45% | 120 BPM | Key of C")

### 5.3 Agent Profile Page

This is the meat of the demo. It shows:

**Section 1: Agent Identity**
- Model name, version, type (text/audio/image)
- Total probes, timestamp, probe duration
- One-sentence summary of findings

**Section 2: Taste Radar**
- A radar chart showing "how defaulty" the agent is across dimensions
- Axes: Diversity (low = very defaulty), Originality, Cultural Range, etc.

**Section 3: Detailed Breakdown**
- For Gemini Flash: framework bars, color swatches, font badges, layout pie, library list
- For Lyria: BPM histogram, key pie, genre bars, mood badges, instrument cloud, cultural origin

**Section 4: Correction**
- The generated negation prompt in a code block with copy button
- Before/After comparison (iframes for websites, audio players for music)

### 5.4 Design Language

Following the frontend-design skill, avoid the AI slop aesthetic:
- **No** purple gradients, Inter font, or generic SaaS layout
- **Yes** to bold typography (try: JetBrains Mono for data, Instrument Serif for headings)
- Dark theme with amber/orange accents (ironic nod to the "orange-teal AI default")
- Data-dense, editorial feel — like a Bloomberg terminal meets a design magazine
- Generous use of monospace for data labels and stats
- Grain texture overlay for depth

---

## 6. API Routes

The frontend needs minimal API routes since most data is pre-generated:

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/profile/gemini-flash` | Returns the website taste profile JSON |
| GET | `/api/profile/lyria` | Returns the music taste profile JSON |
| GET | `/api/negation/[agentId]` | Returns the negation prompt |
| GET | `/api/demo/[agentId]` | Returns paths to before/after demo assets |
| POST | `/api/probe/start` | (Conceptual) Starts a live probing session — for the demo, triggers a simulated progress bar that "reveals" pre-computed results |

The `/api/probe/start` route is for the demo flow: user clicks "Start Probing" → progress bar animates → at 100% it "reveals" the pre-generated profile. This creates the illusion of live probing without actually running 100 API calls during the demo.

---

## 7. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Data Generation** | Python 3.11+ | google-genai SDK, librosa, simple scripting |
| **Frontend** | Next.js 15+ (App Router) | SSR, file-based routing, API routes |
| **Styling** | Tailwind CSS | Fast iteration |
| **Components** | shadcn/ui | Consistent, customizable primitives |
| **Motion** | Framer Motion | Stagger animations, page transitions |
| **Charts** | Recharts | Bar, pie, radar charts |
| **Fonts** | JetBrains Mono + Instrument Serif (Google Fonts) | Distinctive, not "AI default" |
| **Deployment** | Vercel | One-click deploy, serves static assets |

---

## 8. File Structure

```
defaulttaste/
├── scripts/                          # Python data generation
│   ├── generate_websites.py          # Probe Gemini 100x
│   ├── generate_music.py             # Probe Lyria 20x
│   ├── analyze_websites.py           # Self-analysis via Gemini
│   ├── analyze_music.py              # librosa + Gemini audio analysis
│   ├── aggregate_websites.py         # Build website taste profile
│   ├── aggregate_music.py            # Build music taste profile
│   ├── generate_negation.py          # Create correction prompts
│   └── generate_demo.py              # Create before/after artifacts
│
├── data/                             # Generated artifacts (gitignored)
│   ├── websites/
│   │   ├── raw/                      # 001.json - 100.json
│   │   ├── parsed/                   # 001.json - 100.json (analyzed)
│   │   └── profile.json              # Aggregated taste profile
│   ├── music/
│   │   ├── audio/                    # 001.wav - 020.wav
│   │   ├── raw/                      # 001.json - 020.json
│   │   ├── parsed/                   # 001.json - 020.json (analyzed)
│   │   └── profile.json              # Aggregated music taste profile
│   ├── negation/
│   │   ├── website_negation.txt
│   │   └── music_negation.txt
│   └── demo/
│       ├── default_website.html
│       ├── corrected_website.html
│       ├── default_music.wav
│       └── corrected_music.wav
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout, fonts, theme
│   │   ├── page.tsx                  # Landing page
│   │   ├── agent/
│   │   │   └── [agentId]/
│   │   │       └── page.tsx          # Agent profile page
│   │   └── api/
│   │       ├── profile/
│   │       │   └── [agentId]/route.ts
│   │       ├── negation/
│   │       │   └── [agentId]/route.ts
│   │       ├── demo/
│   │       │   └── [agentId]/route.ts
│   │       └── probe/
│   │           └── start/route.ts    # Simulated probing for demo
│   │
│   ├── components/
│   │   ├── landing/
│   │   │   ├── Hero.tsx              # Main headline + tagline
│   │   │   ├── AgentCard.tsx         # Clickable agent profile card
│   │   │   ├── ProbeInput.tsx        # "Plug in your agent" input
│   │   │   └── DefaultsTicker.tsx    # Scrolling stats marquee
│   │   ├── profile/
│   │   │   ├── AgentHeader.tsx       # Agent identity + stats
│   │   │   ├── TasteRadar.tsx        # Overall radar chart
│   │   │   ├── WebTasteCharts.tsx    # Website-specific charts
│   │   │   ├── MusicTasteCharts.tsx  # Music-specific charts
│   │   │   ├── ColorSwatches.tsx     # Color palette visualization
│   │   │   ├── CorrectionPrompt.tsx  # Negation prompt display
│   │   │   └── BeforeAfter.tsx       # Side-by-side demo
│   │   └── ui/                       # shadcn components
│   │
│   └── lib/
│       ├── data.ts                   # Functions to read from data/ directory
│       ├── types.ts                  # TypeScript types for profiles
│       └── mock.ts                   # Mock data for development
│
├── public/
│   └── audio/                        # Symlink or copy of data/music/audio
│
├── .env.local                        # API keys
├── package.json
├── tailwind.config.ts
└── README.md
```

---

## 9. Environment Variables

```env
# === REQUIRED ===

# Google Gemini API Key (used by Python scripts for generation + analysis)
# Claim hackathon credits: https://trygcp.dev/claim/sg-hack-mar7
GEMINI_API_KEY=your_gemini_api_key_here

# === OPTIONAL (for future platform extensibility) ===

# If you want to test other agents:
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

---

## 10. Demo Script

### 3-Minute Pitch

**Minute 1: The Problem (45 sec)**

> "Every AI-coded website looks the same. Purple gradients, Inter font, three feature cards. Every AI-generated song is 120 BPM pop in the key of C. This isn't a coincidence — AI models have hidden taste. Default preferences baked into their training data that silently shape everything they create."
>
> "A March 2025 paper found LLMs pick Python 90-97% of the time. A December 2025 study found image generators converge to just 12 visual motifs. We asked: what happens if we systematically probe an AI's creative defaults?"

**Minute 2: The Demo (90 sec)**

> "This is DefaultTaste. A platform where you plug in any AI agent and we reveal its taste."

*[Show landing page, click into Gemini Flash profile]*

> "We asked Gemini to 'make me a website' 100 times. Same prompt, 100 runs. Here's what emerged."

*[Show taste profile — framework chart, color swatches]*

> "78% React. 62% Inter font. Purple in almost half the outputs. But here's the fix —"

*[Show correction prompt, then before/after websites]*

> "Same prompt, with our correction applied. Completely different aesthetic."

*[Click to Lyria profile]*

> "We did the same with Lyria. 20 music generations. Defaults to pop, 120 BPM, Western instruments. With correction —"

*[Play default audio, then corrected audio]*

> "Sitar, 75 BPM, Eb minor. Same model, different taste."

**Minute 3: The Vision (30 sec)**

> "DefaultTaste works with any agent that accepts a prompt and returns a response. Gemini, Claude, GPT, Llama — they all have taste. In a world where millions are building with AI, knowing your model's defaults is the difference between creating something generic and creating something genuinely yours."