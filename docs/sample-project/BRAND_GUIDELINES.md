# BRAND_GUIDELINES.md — DefaultTaste Visual Identity

---

## 1. Design Philosophy

DefaultTaste is a tool that exposes AI aesthetic defaults. **Our own aesthetic must be the antithesis of everything we critique.** If AI defaults to purple gradients, we use amber. If AI defaults to Inter, we use a serif. If AI defaults to safe, rounded, friendly layouts — we go sharp, dense, and forensic.

### Aesthetic Direction: **Data Forensics Lab**

Imagine a late-night investigation room. Matte black surfaces. Amber desk lamps casting warm pools of light. Screens dense with data. Printouts pinned to walls. Everything has purpose, nothing is decoration for decoration's sake. The typography is precise. The hierarchy is razor-sharp. You feel like you're uncovering something that was hidden.

**Tone:** Investigative, precise, slightly provocative, confidently technical.
**NOT:** Friendly, corporate, playful, or "clean startup."

### The Irony Principle

We are built with the same tools we critique (Next.js, Tailwind, React). The irony is intentional and should be acknowledged, not hidden. Our site proves that these tools CAN produce distinctive work — the defaults are the problem, not the tools.

---

## 2. Color System

### Core Palette

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  BACKGROUND         SURFACE          ELEVATED           │
│  ███████████        ███████████      ███████████        │
│  #09090B            #18181B          #27272A            │
│  zinc-950           zinc-900         zinc-800           │
│                                                         │
│  ACCENT PRIMARY     ACCENT HOT       ACCENT MUTED      │
│  ███████████        ███████████      ███████████        │
│  #D97706            #EA580C          #92400E            │
│  amber-600          orange-600       amber-800          │
│                                                         │
│  TEXT PRIMARY       TEXT SECONDARY    TEXT GHOST         │
│  ███████████        ███████████      ███████████        │
│  #FAFAFA            #A1A1AA          #52525B            │
│  zinc-50            zinc-400         zinc-600           │
│                                                         │
│  SUCCESS            ERROR            DATA HIGHLIGHT     │
│  ███████████        ███████████      ███████████        │
│  #16A34A            #DC2626          #FBBF24            │
│  green-600          red-600          amber-400          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-primary: #09090B;
  --bg-surface: #18181B;
  --bg-elevated: #27272A;
  --bg-hover: #3F3F46;

  /* Accent */
  --accent: #D97706;
  --accent-hot: #EA580C;
  --accent-muted: #92400E;
  --accent-light: #FBBF24;

  /* Text */
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --text-ghost: #52525B;

  /* Semantic */
  --success: #16A34A;
  --error: #DC2626;

  /* Borders */
  --border: #27272A;
  --border-hover: #3F3F46;
}
```

### Usage Rules

- **Background is always dark.** No light mode. This is a forensics lab, not a café.
- **Amber is the accent, not the primary.** Use it sparingly: for the one number you want someone to see, the active tab, the CTA button, the key stat. If everything is amber, nothing is.
- **Orange-600 (`--accent-hot`) is for emphasis moments only.** Hover states, the "before" label in before/after comparisons, error states.
- **Data labels are always zinc-400.** Let the data values be zinc-50. The contrast creates automatic hierarchy.
- **Never use purple, indigo, or blue anywhere.** These are the AI defaults we're exposing. We must not be what we critique.

### Chart Colors (for Recharts)

When you need multiple colors in a bar/pie chart, use this sequence:

```typescript
const CHART_COLORS = [
  "#D97706", // amber-600 — primary
  "#A1A1AA", // zinc-400 — secondary
  "#EA580C", // orange-600 — tertiary
  "#52525B", // zinc-600 — quaternary
  "#FBBF24", // amber-400 — fifth
  "#78716C", // stone-500 — sixth
];
```

These are deliberately muted after the first two. The chart should guide the eye to the dominant bar (amber), not create a rainbow. Warm tones only. No cool tones.

---

## 3. Typography

### Font Stack

```
Display / Headlines:   Instrument Serif (Google Fonts)
Data / Stats / Code:   JetBrains Mono (Google Fonts)
Body / Prose:          JetBrains Mono at lighter weight
```

**Why Instrument Serif?** It's elegant, editorial, and unexpected in a data-heavy context. The contrast between a refined serif headline and dense monospace data creates visual tension that feels intentional. It also has a slightly "vintage newspaper" quality that fits the investigative theme.

**Why JetBrains Mono?** This is a data product. Numbers, percentages, code snippets, hex colors — they all look best in monospace. JetBrains Mono has excellent number legibility and distinctive character (the ligatures, the slightly squared forms). It's also explicitly NOT the system monospace or Fira Code that AI typically defaults to.

### Font Loading (Next.js)

```tsx
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500", "700"],
});

// For Instrument Serif — use Google Fonts
// Add to <head> or use next/font/google
// font-family: 'Instrument Serif', serif;
```

If Instrument Serif causes issues, fallback to **Playfair Display** (also Google Fonts, also serif, also editorial).

### Type Scale

```
Stat Number (hero):    text-6xl  / 60px  / JetBrains Mono 700
Page Headline:         text-4xl  / 36px  / Instrument Serif 400
Section Headline:      text-2xl  / 24px  / Instrument Serif 400
Card Title:            text-lg   / 18px  / JetBrains Mono 500
Body:                  text-sm   / 14px  / JetBrains Mono 400
Label:                 text-xs   / 12px  / JetBrains Mono 300 uppercase tracking-widest
Ghost / Caption:       text-xs   / 12px  / JetBrains Mono 300 text-zinc-500
```

### Type Rules

- **Stat numbers are the hero.** "78%" should be the largest thing on the card. The label "Framework" should be small and ghost-colored above or below.
- **Use uppercase tracking-widest for labels.** Like `FRAMEWORK PREFERENCE` or `DEFAULT TEMPO`. This creates a "classified document" or "technical readout" feeling.
- **Headlines in Instrument Serif should be set in normal case, not all-caps.** The serif provides its own gravitas. All-caps serif looks like a newspaper masthead — fine for the site title, wrong for section headers.
- **Never bold the serif.** Instrument Serif is beautiful at regular weight. Bolding it loses the delicacy. Use JetBrains Mono 700 when you need bold.
- **Number formatting:** Always use monospace for numbers. Always include units. "118.5 BPM" not "118.5". "78%" not "78 percent".

---

## 4. Spatial Composition

### Grid System

```
Max content width:    1280px (max-w-7xl)
Page padding:         32px on desktop, 16px on mobile
Card grid:            12-column grid, cards span 6 columns (2-up)
Chart height:         200px standard, 120px compact
Card padding:         24px (p-6)
Section gap:          48px (space-y-12)
Card gap:             24px (gap-6)
```

### Layout Principles

- **Density over whitespace.** This is a data product, not a marketing site. Information density is a feature. A screen full of well-organized data feels powerful.
- **Cards have sharp corners.** Use `rounded-none` or `rounded-sm` (2px max). Not `rounded-lg` or `rounded-xl` — those are the AI default. Sharp corners = precision, forensic, intentional.
- **Borders, not shadows.** Cards are delineated by `border border-zinc-800`, not box shadows. Shadows feel soft and "floating" — borders feel structural and precise.
- **Asymmetric where it serves hierarchy.** The stat number can be oversized and left-aligned while the label is small and right-aligned. Don't center everything — centered layouts feel indecisive.

### Component Patterns

**Stat Card:**
```
┌──────────────────────────────┐
│ FRAMEWORK PREFERENCE         │  ← label: text-xs uppercase zinc-500
│                              │
│ 78%                          │  ← value: text-5xl font-bold zinc-50
│ React                        │  ← detail: text-lg amber-600
│                              │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │  ← mini bar chart or progress bar
└──────────────────────────────┘
   border-zinc-800, bg-zinc-900
```

**Color Swatch:**
```
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│    │ │    │ │    │ │    │ │    │
│    │ │    │ │    │ │    │ │    │
└────┘ └────┘ └────┘ └────┘ └────┘
#6366  #8B5C  #3B82  #10B9  #F59E
  32     24     18      9      7    ← count below each
```

Swatches should be square, `rounded-sm`, with hex code in monospace below. The border of each swatch should be `border-zinc-700`. No rounded-full circles — squares are more data-oriented.

**Before/After Comparison:**
```
┌─────────── DEFAULT ───────────┐ ┌────────── CORRECTED ──────────┐
│          label: red-600       │ │         label: green-600       │
│                               │ │                                │
│  [iframe / audio player]      │ │  [iframe / audio player]       │
│                               │ │                                │
│  React • #6366F1 • Inter      │ │  Svelte • #C2703E • Merriweather│
│  120 BPM • Key of C • Pop    │ │  75 BPM • Key of Eb • Ambient  │
└───────────────────────────────┘ └────────────────────────────────┘
```

---

## 5. Texture & Effects

### Grain Overlay

Apply a subtle film grain over the entire page. This adds analog warmth and counteracts the "too clean" digital feeling.

```css
body::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

Keep opacity at 0.03–0.05. It should be felt, not seen. If you zoom in you notice it, but at normal viewing distance it just adds "texture."

### Dot Grid Pattern (optional, for hero section)

A subtle dot grid in the background suggests precision and measurement:

```css
.dot-grid {
  background-image: radial-gradient(circle, #27272A 1px, transparent 1px);
  background-size: 24px 24px;
}
```

### Glow Effect (for accent elements)

Use a soft amber glow behind key stat numbers or the active agent card:

```css
.amber-glow {
  box-shadow: 0 0 40px rgba(217, 119, 6, 0.15);
}
```

Sparingly. One or two elements per page maximum.

### Scanline Effect (optional, for extra forensic feel)

A very subtle horizontal scanline pattern:

```css
.scanlines::before {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 2px,
    rgba(0, 0, 0, 0.03) 4px
  );
  pointer-events: none;
}
```

---

## 6. Motion & Animation

### Philosophy

Motion should feel like **data revealing itself**, not decorative flourish. Think: a terminal printing results, a chart drawing from left to right, a number counting up from zero.

### Entrance Animations (Framer Motion)

Cards and sections stagger in from below:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
>
```

- Stagger delay: **0.08s per element** (fast enough to feel snappy, slow enough to see the sequence)
- Duration: **0.4s** for cards, **0.3s** for smaller elements
- Easing: **easeOut** always (things arrive and stop — they don't bounce or spring)

### Number Count-Up

For the hero stats ("We probed Gemini 100 times"), animate the number counting from 0:

```tsx
function CountUp({ target, duration = 2 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count}</span>;
}
```

### Progress Bar (Probing Simulation)

The probing progress bar should feel like a terminal process:

```
Probing gemini-2.5-flash ████████████████░░░░░░░░ 67/100
```

Use a monospace font, amber fill color (`bg-amber-600`), zinc-800 track. The number updates tick by tick. No smooth transitions on the bar — let it jump in discrete steps to feel "real."

### Chart Animations

Recharts bars should animate in from zero. Use the `isAnimationActive` prop:

```tsx
<Bar dataKey="percentage" isAnimationActive={true} animationDuration={800} animationEasing="ease-out" />
```

### Hover States

Cards: border color transitions from `border-zinc-800` to `border-zinc-600` on hover. Subtle, not dramatic.

Buttons: background shifts from `bg-amber-600` to `bg-amber-500`. Text stays white.

No scale transforms, no bounce effects, no rotation. Everything is flat and precise.

---

## 7. Iconography

**Minimal icons. Prefer text labels.** This is a data product — words are more precise than icons.

When icons are unavoidable, use **Lucide React** (already available):
- Use `strokeWidth={1.5}` (thinner than default — matches the light, precise aesthetic)
- Size: 16px for inline, 20px for buttons, 24px for section headers
- Color: always `text-zinc-400` unless actively selected (`text-amber-600`)

Key icons:
- `Globe` — for web agent
- `Music` — for music agent
- `Plus` — for "Add Agent"
- `Copy` — for copy-to-clipboard
- `Play` — for audio playback
- `ArrowRight` — for navigation

---

## 8. Logo & Wordmark

The DefaultTaste logo is purely typographic. No icon, no symbol.

```
Default              ← Instrument Serif, regular, zinc-50
   Taste             ← Instrument Serif, regular, amber-600
```

Or in a single line:

```
DefaultTaste         ← "Default" in zinc-50, "Taste" in amber-600
```

The word "Taste" is always amber. The word "Default" is always white/zinc-50. This color split IS the logo. No need for a separate mark.

For the smallest contexts (favicon, tab title): just the letters `DT` in JetBrains Mono 700, amber on dark background.

---

## 9. Writing Voice

### Headlines
Short, declarative, slightly provocative. Statement, not question.

✅ "Your AI has taste."
✅ "React. 78% of the time."
✅ "We probed Gemini 100 times."
❌ "Discover your AI's hidden preferences!"
❌ "What does your AI really think?"
❌ "AI taste profiling made easy"

### Data Labels
Uppercase, tracked, ghost-colored. Clinical.

✅ `FRAMEWORK PREFERENCE`
✅ `DEFAULT TEMPO`
✅ `CULTURAL ORIGIN`
❌ `Framework Preference`
❌ `What framework does it prefer?`

### Body Copy
Terse. Technical. No filler words. Write like a research paper abstract, not a blog post.

✅ "Gemini defaults to React in 78% of generations. Inter font appears in 62%. Purple-indigo gradient in 45%. These aren't choices — they're the model's gravitational center."

❌ "We discovered some really interesting patterns in how Gemini generates websites! It turns out that the model has some strong preferences that you might not have known about."

---

## 10. Anti-Patterns (What We NEVER Do)

These are the exact defaults we're exposing. Using them in our own UI would undermine the entire project.

| Anti-Pattern | Why We Avoid It | What We Use Instead |
|-------------|----------------|-------------------|
| Purple/indigo gradients | #1 AI color default | Amber/orange solid accents |
| Inter font | #1 AI font default | Instrument Serif + JetBrains Mono |
| `rounded-xl` / `rounded-2xl` | Generic "friendly" AI aesthetic | `rounded-none` or `rounded-sm` |
| Box shadows (`shadow-lg`) | Floating, soft, generic | Borders (`border-zinc-800`) |
| Hero with centered h1 + subtitle + CTA button | Every AI landing page ever | Asymmetric, left-aligned, dense |
| 3 feature cards in a row with icons | The "SaaS starter kit" default | Data-first layout, no feature cards |
| Gradient text | Overused in AI marketing | Solid amber for emphasis |
| `bg-white` or light backgrounds | We're a dark forensics lab | `bg-zinc-950` always |
| Emojis in headlines | Unprofessional, too casual | No emojis anywhere in UI |
| "Get started", "Learn more" CTAs | Generic SaaS copywriting | "View Profile", "Start Probing" |

---

## 11. Quick Reference — Tailwind Classes

```
Backgrounds:          bg-zinc-950, bg-zinc-900, bg-zinc-800
Text:                 text-zinc-50, text-zinc-400, text-zinc-600
Accent:               text-amber-600, bg-amber-600, border-amber-600
Borders:              border-zinc-800, border-zinc-700
Rounded:              rounded-none or rounded-sm ONLY
Cards:                bg-zinc-900 border border-zinc-800 rounded-sm p-6
Labels:               text-xs uppercase tracking-widest text-zinc-500
Stat numbers:         text-5xl font-bold text-zinc-50
Headline (serif):     font-serif text-4xl (requires Instrument Serif loaded)
Buttons:              bg-amber-600 hover:bg-amber-500 text-white rounded-sm
Ghost buttons:        border border-zinc-700 hover:border-zinc-500 rounded-sm
```

---

## 12. Example Component (Reference Implementation)

Here's what a taste stat card should look like:

```tsx
<div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-3">
    Framework Preference
  </p>
  <div className="flex items-baseline gap-3">
    <span className="text-5xl font-bold text-zinc-50">78%</span>
    <span className="text-lg text-amber-600">React</span>
  </div>
  <div className="mt-4 h-2 bg-zinc-800 rounded-sm overflow-hidden">
    <div className="h-full bg-amber-600 rounded-sm" style={{ width: "78%" }} />
  </div>
  <div className="mt-3 flex gap-4 text-xs text-zinc-500">
    <span>vanilla 12%</span>
    <span>vue 6%</span>
    <span>svelte 3%</span>
    <span>angular 1%</span>
  </div>
</div>
```

This card tells you everything in 2 seconds: the dimension (Framework), the dominant default (78% React), the distribution (bar + breakdown). No decoration, no icons, no filler. Pure signal.