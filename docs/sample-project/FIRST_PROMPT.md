# FIRST_PROMPT.md — Copy this into Claude Code to bootstrap the project

Copy everything below the line into Claude Code as your first prompt.

---

Read CLAUDE.md, ARCHITECTURE.md, TASKS.md, and BRAND_GUIDELINES.md carefully. Then bootstrap the DefaultTaste project in one go.

## What to build

### 1. Project setup
- Create a Next.js project with TypeScript, Tailwind, App Router, src directory
- Install: shadcn/ui (New York style, Zinc base, CSS variables), recharts, framer-motion
- Add shadcn components: button, card, badge, progress, tabs, separator
- Set up JetBrains Mono (via next/font/google) and Instrument Serif (via Google Fonts CDN in layout)
- Configure the dark theme in layout.tsx and globals.css per BRAND_GUIDELINES.md
- Add the grain overlay CSS from BRAND_GUIDELINES.md

### 2. Directory structure
Create all directories per ARCHITECTURE.md: scripts/, data/ (with subdirs), src/components/landing/, src/components/profile/, src/lib/, src/app/agent/[agentId]/, src/app/api/profile/[agentId]/

### 3. Core lib files
- `src/lib/types.ts` — Full TypeScript interfaces for WebsiteProfile, MusicProfile, BpmStats, TasteEntry, ColorEntry, AgentProfile per ARCHITECTURE.md
- `src/lib/mock.ts` — Complete mock data for both agents (Gemini Flash + Lyria) with realistic numbers from the research. Use the exact mock data from TASKS.md Task 2
- `src/lib/data.ts` — Data loading utility that reads from data/ directory and falls back to mock

### 4. API route
- `src/app/api/profile/[agentId]/route.ts` — GET route that returns agent profile JSON using data.ts

### 5. Landing page (`src/app/page.tsx`)
Build the full landing page per BRAND_GUIDELINES.md. This is the most important page for first impressions:

- **Hero section**: Large "DefaultTaste" wordmark (Instrument Serif, "Default" in zinc-50, "Taste" in amber-600). Below it: "Your AI has taste. You just don't know it yet." in text-xl text-zinc-400. Below that: a stat line like "We probed Gemini 100 times. Here's what we found." with the "100" animated as a count-up.

- **Agent cards section**: Two cards side by side linking to /agent/gemini-flash and /agent/lyria. Each card shows: agent name, model, probe count, 2-3 key stats pulled from mock data (e.g., "React: 78%" or "Pop: 35%, 120 BPM"). Plus a ghost "Add Agent +" card with dashed border. Cards use: bg-zinc-900 border border-zinc-800 rounded-sm p-6. Hover: border-zinc-700.

- **Platform concept section**: A non-functional form that shows the vision: text input labeled "AGENT ENDPOINT" with placeholder "wss://your-agent-endpoint...", a dropdown for "REST / WebSocket", a number input for probe count, and an amber "Start Probing" button. Below it, small text: "Supports any agent that accepts a prompt and returns a response." This doesn't need to work — it's conceptual.

- **Defaults ticker**: A horizontal scrolling marquee at the bottom with stats: "React: 78% · Inter: 62% · Purple: 45% · Tailwind: 65% · Dark Mode: 72% · Pop: 35% · 120 BPM · Key of C · Western: 85%". Use CSS animation for the scroll. Monospace, text-xs, text-zinc-500, with amber highlights on the percentages.

- All entrance animations via Framer Motion: stagger in from below, 0.08s delay per element.

### 6. Agent profile page (`src/app/agent/[agentId]/page.tsx`)
Build the full agent profile page. Fetch data from /api/profile/[agentId].

- **Header**: Agent name (Instrument Serif, text-4xl), model name in zinc-400, probe count, timestamp. Left-aligned, not centered.

- **For gemini-flash (website_profile)**: 
  - Framework bar chart (horizontal, Recharts, CHART_COLORS from brand guidelines)
  - CSS framework bar chart
  - Color swatches grid (square swatches with hex codes below, rounded-sm not rounded-full)
  - Font badges (Badge component, top font gets default variant, rest get secondary)
  - Layout type pie chart (Recharts)
  - Library badges
  - Dark mode percentage (large stat number)

- **For lyria (music_profile)**:
  - BPM: three big numbers (average, median, ±std_dev) + histogram bar chart
  - Key distribution pie chart
  - Genre horizontal bar chart
  - Mood badges
  - Instrument badges
  - Cultural origin horizontal bar chart
  - Brightness + density as labeled gauges or stat numbers

- **Correction prompt section**: Display the negation_prompt in a pre/code block with bg-zinc-900 border. "Copy" button that copies to clipboard.

- **Before/After section**: For gemini-flash: two side-by-side cards, left "DEFAULT" (red-600 label) with an iframe placeholder, right "CORRECTED" (green-600 label) with an iframe placeholder. For lyria: same layout but with audio player placeholders. Show mock metadata below each (framework/colors for web, BPM/key/genre for music).

- All sections animate in with Framer Motion stagger.

### 7. .env.example and .gitignore
Create .env.example with GEMINI_API_KEY placeholder. Create .gitignore that ignores node_modules, .next, .env.local, data/websites/raw/, data/music/raw/ but NOT data/*/profile.json or data/negation/ or data/demo/.

## Design rules (non-negotiable)
Follow BRAND_GUIDELINES.md exactly:
- Dark theme only (bg-zinc-950 page background)
- Amber-600 accent, used sparingly
- JetBrains Mono for all data/body, Instrument Serif for headlines only
- Sharp corners (rounded-sm max), borders not shadows
- Labels: text-xs uppercase tracking-widest text-zinc-500
- Stat numbers: text-5xl font-bold text-zinc-50
- Chart colors: ["#D97706", "#A1A1AA", "#EA580C", "#52525B", "#FBBF24", "#78716C"]
- NEVER use purple, Inter, rounded-lg, shadow-lg, light backgrounds, centered hero+CTA layouts
- Add the grain overlay CSS on body

Build everything. Make it production-grade and visually striking. This is a hackathon demo that needs to impress judges on creativity and originality.