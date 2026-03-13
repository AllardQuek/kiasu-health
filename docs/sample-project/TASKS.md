# TASKS.md — DefaultTaste Hackathon Build Plan

> **Team of 2.** Ilham handles scripts + music + infra. Friend handles frontend + web analysis.
> **Total time:** 7 hours (10am–5pm). Submissions due 5pm sharp.
> **Read ARCHITECTURE.md first** for the full system overview.

---

## Table of Contents

1. [Project Setup (Both)](#task-1-project-setup-both--30-min)
2. [Data Directory + Mock Data (Ilham)](#task-2-data-directory--mock-data-ilham--15-min)
3. [Website Generation Script (Friend)](#task-3-website-generation-script-friend--run-at-1030am)
4. [Music Generation Script (Ilham)](#task-4-music-generation-script-ilham--45-min)
5. [Website Analysis Script (Friend)](#task-5-website-analysis-script-friend--30-min)
6. [Music Analysis Script (Ilham)](#task-6-music-analysis-script-ilham--30-min)
7. [Aggregation Scripts (Both)](#task-7-aggregation-scripts-both--20-min)
8. [Negation Prompt Generator (Ilham)](#task-8-negation-prompt-generator-ilham--15-min)
9. [Before/After Demo Assets (Both)](#task-9-beforeafter-demo-assets-both--20-min)
10. [Frontend — Landing Page (Friend)](#task-10-frontend--landing-page-friend--45-min)
11. [Frontend — Agent Profile Page (Friend)](#task-11-frontend--agent-profile-page-friend--60-min)
12. [Frontend — Before/After Demo (Friend)](#task-12-frontend--beforeafter-demo-friend--30-min)
13. [Polish + Deploy + Video (Both)](#task-13-polish--deploy--video-both--30-min)
14. [Timeline](#task-14-timeline)
15. [Fallback Plans](#task-15-fallback-plans)
16. [Environment Variables](#task-16-environment-variables)

---

## Task 1: Project Setup (Both) — 30 min

### 1.1 Create the Next.js project

```bash
npx create-next-app@latest defaulttaste \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd defaulttaste
```

### 1.2 Install frontend deps

```bash
npx shadcn@latest init
# Style=New York, Base color=Zinc, CSS variables=Yes

npx shadcn@latest add button card badge progress tabs separator
npm install recharts framer-motion
```

### 1.3 Install Python deps (Ilham's machine)

```bash
pip install google-genai librosa soundfile numpy --break-system-packages
```

### 1.4 Create .env.local

```env
GEMINI_API_KEY=your_key_here
```

### 1.5 Create directory structure

```bash
mkdir -p scripts
mkdir -p data/websites/raw data/websites/parsed
mkdir -p data/music/audio data/music/raw data/music/parsed
mkdir -p data/negation data/demo
mkdir -p public/audio
mkdir -p src/components/landing src/components/profile
mkdir -p src/lib
mkdir -p "src/app/agent/[agentId]"
mkdir -p "src/app/api/profile/[agentId]"
```

### 1.6 Set up layout with custom fonts

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DefaultTaste — Your AI has taste",
  description: "Reveal and correct the hidden aesthetic preferences of AI agents",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${mono.variable} font-mono antialiased bg-zinc-950 text-zinc-100`}>
        {children}
      </body>
    </html>
  );
}
```

### ✅ Done when: `npm run dev` works, Python deps installed, both have repo cloned

---

## Task 2: Data Directory + Mock Data (Ilham) — 15 min

Create `src/lib/types.ts` with TypeScript interfaces for `WebsiteProfile`, `MusicProfile`, and `AgentProfile`.

Create `src/lib/mock.ts` with realistic mock data for two agents:
- **Gemini 2.5 Flash** (website profile): React 78%, Tailwind 65%, Inter 62%, purple colors, dark mode 72%, landing-page layout 55%
- **Lyria RealTime** (music profile): avg BPM 118.5, key of C 35%, pop 35%, electronic 25%, Western origin 85%, synth pads 70%

Create `src/lib/data.ts` that loads real data from `data/` directory, falling back to mock when real data doesn't exist yet.

Create `src/app/api/profile/[agentId]/route.ts` that serves the profile JSON.

**See ARCHITECTURE.md for full mock data shapes and the data loading utility.**

### ✅ Done when: `/api/profile/gemini-flash` and `/api/profile/lyria` return data (mock is fine)

---

## Task 3: Website Generation Script (Friend) — Run at 10:30am

Create `scripts/generate_websites.py`. This is the **first thing to run** because it takes ~20-30 min for 100 runs.

**Key features required:**
- Sends "Make me a website" to Gemini 100 times
- Each result saved immediately as `data/websites/raw/001.json` through `100.json`
- **Resumable**: checks which files exist, skips completed runs
- **Retry**: 3 retries per failed call with exponential backoff
- **Batch**: runs 3 concurrent requests, 2s delay between batches
- Clear progress output: `[47/100] Generating... ✅ (3200 chars, 2100ms)`

Each saved JSON:
```json
{
  "id": 47,
  "prompt": "Make me a website...",
  "model": "gemini-2.5-flash-preview-05-20",
  "timestamp": "2026-03-07T10:45:00Z",
  "raw_code": "<!DOCTYPE html>...",
  "generation_time_ms": 2100,
  "code_length": 3200
}
```

Run: `GEMINI_API_KEY=xxx python3 scripts/generate_websites.py`

**Full implementation provided in ARCHITECTURE.md Section 3.2.**

### ✅ Done when: 100 JSON files in `data/websites/raw/`

---

## Task 4: Music Generation Script (Ilham) — 45 min

### ⚠️ TEST LYRIA FIRST (10 minutes)

```python
# scripts/test_lyria.py — quick connection test
import os, asyncio
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"],
                      http_options={"api_version": "v1alpha"})

async def main():
    print("Connecting...")
    async with client.aio.live.music.connect(model="models/lyria-realtime-exp") as session:
        await session.set_weighted_prompts(prompts=[types.WeightedPrompt(text="Make me a song", weight=1.0)])
        await session.play()
        count = 0
        async for msg in session.receive():
            if msg.server_content.audio_chunks: count += 1
            if count >= 50: break
        await session.stop()
    print(f"{'✅' if count > 0 else '❌'} Received {count} chunks")

asyncio.run(main())
```

```bash
GEMINI_API_KEY=xxx python3 scripts/test_lyria.py
```

**If this fails → jump to Task 15 (Fallback) immediately. Don't waste time.**

### If Lyria works: Create `scripts/generate_music.py`

**Key features:**
- 20 probes across 4 sets: pure default (5x "Make me a song"), mood-only (5x), vague prompts (5x), genre-only no config (5x)
- Each track: 12 seconds of audio via WebSocket
- Saves WAV to `data/music/audio/001.wav` and metadata to `data/music/raw/001.json`
- **Resumable + retry** (same pattern as website script)
- Runs SEQUENTIALLY (concurrent WebSocket sessions may conflict)
- 3-second delay between sessions
- Uses `wave` module for WAV file creation (48kHz, stereo, 16-bit PCM)
- **Critical**: client must use `http_options={"api_version": "v1alpha"}`
- **Critical**: do NOT set `musicGenerationConfig` — let Lyria pick its own defaults

**Full implementation provided in ARCHITECTURE.md Section 3.5.**

### ✅ Done when: WAV files in `data/music/audio/`, JSON metadata in `data/music/raw/`

---

## Task 5: Website Analysis Script (Friend) — 30 min

Create `scripts/analyze_websites.py`:
- Reads each `data/websites/raw/NNN.json`
- Sends the raw code to Gemini with the analysis prompt
- Extracts: framework, css_framework, primary_colors, fonts, layout_type, libraries, deployment_platform, has_dark_mode, icon_library, description
- Saves to `data/websites/parsed/NNN.json`
- Same resume/retry pattern

Analysis prompt should ask Gemini to output JSON with the fields matching the `WebsiteProfile` type.

### ✅ Done when: `data/websites/parsed/` has analyzed JSON files

---

## Task 6: Music Analysis Script (Ilham) — 30 min

Create `scripts/analyze_music.py`:
- For each WAV file, runs **two analyses**:
  - **librosa** (programmatic): BPM, key detection via chroma, spectral centroid (brightness), onset density, RMS energy
  - **Gemini audio** (semantic): uploads WAV to Gemini Files API, asks for genre, mood, instruments, tempo_feel, production_style, cultural_origin, energy_level, complexity
- Merges both into `data/music/parsed/NNN.json`
- Resume/retry pattern

Key librosa code:
```python
import librosa, numpy as np
y, sr = librosa.load(wav_path, sr=22050, mono=True)
tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
key_idx = int(np.argmax(chroma.mean(axis=1)))
brightness = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr)))
onsets = librosa.onset.onset_detect(y=y, sr=sr)
```

Key Gemini code:
```python
file = client.files.upload(file=wav_path)
response = client.models.generate_content(model=MODEL, contents=[file, ANALYSIS_PROMPT])
```

### ✅ Done when: `data/music/parsed/` has JSON files with both librosa + Gemini fields

---

## Task 7: Aggregation Scripts (Both) — 20 min

### Website (Friend): `scripts/aggregate_websites.py`
Read all `data/websites/parsed/*.json`, compute frequency distributions for each field, save `data/websites/profile.json`.

### Music (Ilham): `scripts/aggregate_music.py`
Read all `data/music/parsed/*.json`, compute BPM stats (avg, median, std_dev, histogram), key distribution, genre/mood/instrument frequencies, save `data/music/profile.json`.

### ✅ Done when: `profile.json` files exist and match the TypeScript types

---

## Task 8: Negation Prompt Generator (Ilham) — 15 min

Create `scripts/generate_negation.py`:
- Reads both profile.json files
- Sends each to Gemini: "Given this taste profile, write a system prompt that counteracts these defaults"
- Saves to `data/negation/website_negation.txt` and `music_negation.txt`

### ✅ Done when: Negation prompts exist and are specific (names exact frameworks, colors, BPMs, keys)

---

## Task 9: Before/After Demo Assets (Both) — 20 min

Create `scripts/generate_demo.py`:

**Website (Friend's part):**
1. Generate one website with NO system prompt → `data/demo/default_website.html`
2. Generate one website WITH the negation prompt as system instruction → `data/demo/corrected_website.html`

**Music (Ilham's part):**
1. Generate one Lyria track with "Make me a song" and NO config → `data/demo/default_music.wav`
2. Generate one Lyria track with counter-default settings (BPM=75, scale=Eb, density=0.2, prompt="Sitar and tabla, ambient ethereal") → `data/demo/corrected_music.wav`

Copy audio files: `cp data/demo/*.wav public/audio/`

### ✅ Done when: Before/after assets exist and the difference is obvious

---

## Task 10: Frontend — Landing Page (Friend) — 45 min

Build `src/app/page.tsx` as a **platform landing page**. Must convey: "this is a product, not a hack."

Key sections:
1. **Hero** — "Your AI has taste. You just don't know it yet." Bold editorial typography.
2. **Stats reveal** — "We probed Gemini 100 times." with animated counters
3. **Agent cards** — Clickable cards linking to `/agent/gemini-flash` and `/agent/lyria`, plus a ghost "Add Agent +" card
4. **Platform concept** — Input field for "Plug in your agent endpoint", dropdown for REST/WebSocket, probe count slider. Non-functional but shows the vision.
5. **Defaults ticker** — Animated marquee: "React: 78% | Inter: 62% | Purple: 45% | Pop: 35% | 120 BPM | Key of C"

**Design direction** (per frontend-design SKILL): Dark theme (zinc-950), amber/orange accents (#F59E0B), JetBrains Mono, data-dense editorial feel, grain texture overlay, NO purple gradients or Inter font.

---

## Task 11: Frontend — Agent Profile Page (Friend) — 60 min

Build `src/app/agent/[agentId]/page.tsx`. Fetches from `/api/profile/[agentId]`.

Sections:
1. **Header** — Agent name, model, probe count, "Probed on Mar 7, 2026"
2. **Web charts** (if website_profile) — framework horizontal bars, CSS framework bars, color swatch grid, font badges, layout pie chart, library badges, dark mode stat
3. **Music charts** (if music_profile) — BPM big number + histogram, key pie, genre bars, mood badges, instrument badges, cultural origin bar, brightness/density gauges
4. **Correction prompt** — code block + copy button
5. **Before/After** — website iframes or audio players (Task 12)

Use Recharts for charts. Framer Motion for stagger entrance animations (each card animates in with 100ms delay).

---

## Task 12: Frontend — Before/After Demo (Friend) — 30 min

Bottom of the agent profile page:

**For gemini-flash:** Two iframes side-by-side. Left = "Default Output" (red label), Right = "Corrected Output" (green label). Load HTML from `/api/demo/gemini-flash`.

**For lyria:** Two `<audio>` elements side-by-side. Left = default track, Right = corrected track. Metadata labels below each (BPM, key, genre detected).

---

## Task 13: Polish + Deploy + Video (Both) — 30 min

1. Ensure real data overrides mock: verify `data/` files are read by `src/lib/data.ts`
2. `cp data/demo/*.wav public/audio/`
3. `npx vercel` → deploy
4. Add `GEMINI_API_KEY` in Vercel dashboard → Settings → Environment Variables
5. Record 1-min video (screen recording of the flow: landing → click agent → profile → before/after)
6. Submit at the hackathon submission link
7. Practice the 3-min pitch (see ARCHITECTURE.md Section 10)

---

## Task 14: Timeline

| Time | Ilham (Scripts + Music + Infra) | Friend (Frontend + Web Analysis) |
|------|------|------|
| **10:00–10:30** | Setup, claim credits, test Lyria | Setup, install deps, push to GitHub |
| **10:30–11:00** | Start `generate_music.py` | Start `generate_websites.py` |
| **11:00–11:30** | Create mock data, types, data.ts, API routes | Start landing page (Hero, AgentCards) |
| **11:30–12:00** | Write `analyze_music.py` | Landing page (ProbeInput, Ticker) |
| **12:00–12:30** | 🍜 Lunch. Scripts running. | 🍜 Lunch. Scripts running. |
| **12:30–1:00** | Run `analyze_music.py` | Write + run `analyze_websites.py` |
| **1:00–1:30** | `aggregate_music.py` | `aggregate_websites.py` |
| **1:30–2:00** | `generate_negation.py` + `generate_demo.py` | Agent profile page — charts |
| **2:00–2:30** | Copy real data → `data/`, verify frontend | Profile page — music charts |
| **2:30–3:00** | Debug data issues, help with frontend | Correction prompt + before/after |
| **3:00–3:30** | Polish, deploy to Vercel | Final styling, animations |
| **3:30–4:00** | Practice pitch | Record demo video |
| **4:00–5:00** | ✅ Submit + pitch prep | ✅ Submit + pitch prep |

### Critical Milestones

| By When | What Must Be Done |
|---------|-------------------|
| 10:30 | Lyria tested (or fallback decided) |
| 11:00 | Both generation scripts running in background |
| 12:00 | Landing page rendering with mock data |
| 2:00 | Real profile data visible in frontend |
| 3:30 | Before/after demo working, app deployed |
| 4:30 | Video recorded, submission ready |

---

## Task 15: Fallback Plans

### If Lyria doesn't work
Replace with text-only probing: ask Gemini "If you were composing a song, describe it in JSON: genre, bpm, key, instruments, mood." Run 50x. Still builds a music taste profile from text descriptions. Before/after becomes two contrasting text descriptions.

### If generation scripts don't finish in time
Use mock data. Frontend falls back automatically. Mock is based on real research — credible in a demo.

### If Vercel deployment fails
Demo from localhost. Totally fine for hackathon judging.

### If $20 credits run out
100 Flash calls ≈ $3-5. Lyria is free. You have plenty of margin. If worried, reduce to 50 website probes.

---

## Task 16: Environment Variables

`.env.local`:

```env
# ============================================
# DefaultTaste — Environment Variables
# ============================================

# REQUIRED: Google Gemini API Key
# Claim hackathon credits first: https://trygcp.dev/claim/sg-hack-mar7
GEMINI_API_KEY=

# OPTIONAL: Override defaults
# GEMINI_MODEL=gemini-2.5-flash-preview-05-20
# WEBSITE_PROBE_COUNT=100
# MUSIC_PROBE_COUNT=20
```

For Python scripts, pass the key inline:
```bash
GEMINI_API_KEY=your_key python3 scripts/generate_websites.py
```

For Next.js, `.env.local` is auto-loaded.