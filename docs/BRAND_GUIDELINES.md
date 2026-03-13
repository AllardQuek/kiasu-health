# BRAND_GUIDELINES.md — KiasuHealth Visual Identity

---

## 1. Design Philosophy

KiasuHealth is a **social health game**, not a wellness app. The product is about people — groups, competition, accountability, and the joy of seeing your name climb the leaderboard. **The design must feel alive with people and stakes, not sterile with metrics.**

KiasuHealth's core tension: health is serious, but the way we do it here — kiasu, communal, hawker-fuelled — is joyful and irreverent. The design must hold both. Clinical = wrong. Chaotic = wrong. Warm + precise = right.

### Aesthetic Direction: **Kopitiam Noticeboard Meets Sports Scoreboard**

Picture a Sunday morning at a kopitiam. The results from last week's basketball league are pinned to the noticeboard — handwritten tallies, names circled in marker, someone's added a cheeky comment. The ceiling fans hum. It's warm. It's alive. People care about these numbers.

Now put that feeling on a screen: warm background tones (cream, cornsilk), clear hierarchy, scores that feel important, just enough colour to direct the eye to what matters. Not corporate, not clinical. Like something your kaki printed out and stuck on the office notice board.

**Tone:** Warm, competitive, a little cheeky. Numbers-forward but never cold.
**NOT:** Clinical white health app, blue corporate SaaS, generic gamification UI.

### The Platform vs. Chat Principle

- **Telegram** is the ease-of-access layer — quick photo submissions, instant nudges, Sunday reveals, group banter. Bot copy can carry Singlish flavour and emojis.
- **The web dashboard** is the main platform — where you see your league's full standings, history, stats, and profile. The design here is more considered. Singlish flavour is light; numbers and clarity lead.

Design primarily for the web dashboard. The aesthetic should work at a glance on mobile too (the primary Telegram flow happens on phone), but the leaderboard and reveal page are where the design does its heaviest lifting.

---

## 2. Color System

### Working Palette — Option B: "Breezy SG" (Primary)

Warm, light, inviting. Like cornsilk walls and tropical light. Health without the hospital.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  BACKGROUND         SURFACE          ELEVATED           │
│  ███████████        ███████████      ███████████        │
│  #FEFAE0            #FAEDCD          #F4E1B0            │
│  cornsilk           papaya-whip      warm-sand          │
│                                                         │
│  ACCENT PRIMARY     ACCENT HOT       ACCENT MUTED       │
│  ███████████        ███████████      ███████████        │
│  #2A9D8F            #E76F51          #1A6B63            │
│  verdigris          burnt-peach      verdigris-dark     │
│                                                         │
│  TEXT PRIMARY       TEXT SECONDARY   TEXT GHOST         │
│  ███████████        ███████████      ███████████        │
│  #264653            #3B6B6F          #6E9BA3            │
│  charcoal-blue      slate-teal       muted-teal         │
│                                                         │
│  SUCCESS            WARNING          ERROR              │
│  ███████████        ███████████      ███████████        │
│  #2A9D8F            #E9C46A          #E76F51            │
│  verdigris          jasmine          burnt-peach        │
│                                                         │
│  RANK #1            RANK #2          RANK #3            │
│  ███████████        ███████████      ███████████        │
│  #E9C46A            #8AACB4          #D4A373            │
│  jasmine/gold       silver-teal      light-bronze       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### CSS Variables

```css
:root {
  /* Backgrounds */
  --bg-primary: #FEFAE0;      /* cornsilk — page background */
  --bg-surface: #FAEDCD;      /* papaya whip — cards */
  --bg-elevated: #F4E1B0;     /* warm sand — elevated cards, hover */
  --bg-hover: #EDD9A3;        /* deeper sand — active/pressed states */

  /* Accent */
  --accent: #2A9D8F;          /* verdigris — primary brand accent */
  --accent-hot: #E76F51;      /* burnt peach — CTAs, champion badge, alerts */
  --accent-muted: #1A6B63;    /* verdigris dark — hover on accent elements */
  --accent-warm: #E9C46A;     /* jasmine — rank #1 gold, stars, highlights */
  --accent-sand: #D4A373;     /* light bronze — rank #3, secondary highlights */

  /* Text */
  --text-primary: #264653;    /* charcoal blue — all body text */
  --text-secondary: #3B6B6F;  /* slate teal — secondary text, card subtitles */
  --text-ghost: #6E9BA3;      /* muted teal — labels, captions, placeholders */

  /* Semantic */
  --success: #2A9D8F;
  --warning: #E9C46A;
  --error: #E76F51;

  /* Borders */
  --border: #E9C46A;          /* jasmine — default borders */
  --border-subtle: #F0D9A3;   /* very light sand — subtle dividers */
  --border-hover: #D4A373;    /* bronze — hover border */
}
```

### Usage Rules

- **Background is warm and light.** Cornsilk (#FEFAE0) always. No white (`#ffffff`), no dark mode for the dashboard. This is a kopitiam, not a lab.
- **Verdigris is the health brand color** — use it for active states, scores, progress bars, the brand wordmark. It reads as "health" without being generic app-green.
- **Burnt Peach is the CTA and champion accent** — buttons, #1 rank highlights, reward announcements. It has energy without being aggressive.
- **Jasmine/gold is for rank and achievement** — #1 badge, weekly champion, streak rewards. Don't use it for generic highlights.
- **Never use blue, indigo, or purple.** These are generic SaaS and health-app defaults. We are not that.
- **Data labels use `--text-ghost`.** The value uses `--text-primary`. The contrast creates hierarchy without needing bold.

### Alternative Palettes (Preserved for Reference)

**Option A — "Tropical Dark"**: Charcoal Blue (#264653) background, Verdigris (#2A9D8F) accent, Sandy Brown + Burnt Peach for energy. Darker, more dramatic. Better for a "scoreboard at night" feel. Could be used for the weekly reveal page specifically (dark reveal moment, then back to light for daily view).

**Option C — "Score Mode"**: Near-black background, Verdigris + Sandy Brown instead of amber. Data-first scoreboard feel. Closest to DefaultTaste's aesthetic. Consider if the product pivots to feeling more like a sports statistics platform.

### Chart Colors (Recharts)

```typescript
const CHART_COLORS = [
  "#2A9D8F", // verdigris — primary (steps, main metric)
  "#E76F51", // burnt peach — secondary (meal balance)
  "#E9C46A", // jasmine — tertiary (activity/run time)
  "#D4A373", // light bronze — quaternary (sleep)
  "#3B6B6F", // slate teal — fifth (BP, optional metrics)
  "#6E9BA3", // muted teal — sixth (misc)
];
```

Rank podium colors:
```typescript
const RANK_COLORS = {
  1: "#E9C46A", // gold/jasmine
  2: "#6E9BA3", // silver/muted teal
  3: "#D4A373", // bronze/light bronze
};
```

---

## 3. Typography

### Font Stack

```
Brand / Headlines / UI:   Plus Jakarta Sans (Google Fonts)
Scores / Stats / Data:    JetBrains Mono (Google Fonts)
```

**Why Plus Jakarta Sans?** It's warm, rounded, and approachable — feels like a group chat turned product, not a corporate dashboard. It has personality without being quirky. Distinct from Inter and system defaults, but not trying too hard. Works in Latin and renders well at small sizes on mobile.

**Why JetBrains Mono for scores?** Health data is still data. Step counts, calories, rank numbers, streak days — these all benefit from monospace legibility. The contrast between the warm sans-serif brand voice and the precise mono score readout creates the product's core tension: social game (Jakarta Sans), real stakes (JetBrains Mono).

### Font Loading (Next.js)

```tsx
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});
```

Fallback for Plus Jakarta Sans: **DM Sans** (very similar, also Google Fonts).

### Type Scale

```
Rank Number (hero):     text-6xl  / 60px  / JetBrains Mono 700 — charcoal-blue
Score / Stat Number:    text-4xl  / 36px  / JetBrains Mono 700 — charcoal-blue
Page Headline:          text-3xl  / 30px  / Plus Jakarta Sans 700
Section Headline:       text-xl   / 20px  / Plus Jakarta Sans 600
Card Title:             text-base / 16px  / Plus Jakarta Sans 600
Body:                   text-sm   / 14px  / Plus Jakarta Sans 400
Label:                  text-xs   / 12px  / Plus Jakarta Sans 500 uppercase tracking-wide
Mono Label:             text-xs   / 12px  / JetBrains Mono 400 uppercase tracking-widest
Ghost / Caption:        text-xs   / 12px  / Plus Jakarta Sans 400 -- text-ghost
```

### Type Rules

- **Score numbers are the hero on any card.** "10,247" (steps) should be the biggest thing on the leaderboard card. The player name is secondary. The label ("STEPS") is ghost-colored.
- **Use uppercase tracking-wide for stat labels** — `WEEKLY SCORE`, `STEPS THIS WEEK`, `MEAL BALANCE`. It signals "data field" without feeling clinical.
- **Player names and social copy use Plus Jakarta Sans** — warm, readable, human. Never mono for names.
- **Rank numbers use JetBrains Mono** — `#1`, `#2`, `#3`. The monospace character gives weight and finality.
- **Number formatting:** Always include units. `10,247 steps` not `10247`. `3/10` not `3` for meal balance. Use monospace for all numeric readouts.
- **Telegram bot copy:** More casual, can carry Singlish lightly. Keep it brief — this is a notification, not a paragraph.

---

## 4. Spatial Composition

### Grid System

```
Max content width:    1280px (max-w-7xl)
Page padding:         32px desktop, 16px mobile (px-8 / px-4)
Leaderboard:          Single column, full width cards stacked
Stats grid:           3-column on desktop, 1-column on mobile
Card padding:         20–24px (p-5 or p-6)
Section gap:          40px (space-y-10)
Card gap:             16px (gap-4)
```

### Layout Principles

- **Leaderboard first.** The league standings is the hero of the dashboard — not a marketing hero section. Put the league table front and center; stats and history below.
- **Cards have gentle rounding.** Use `rounded-lg` (8px). We are a social product, not a forensics lab. Soft but not pill-shaped.
- **Warm borders over shadows.** Cards use `border border-[var(--border)]` (jasmine/sand) for definition. Subtle `shadow-sm` is acceptable on cards where depth helps (e.g., the leaderboard card). Never `shadow-xl`.
- **Rank is always visible.** The rank number (#1, #2, #3) should be the leftmost, largest element on a player row. Don't bury it.

### Component Patterns

**Leaderboard Row:**
```
┌──────────────────────────────────────────────────────────┐
│  #1  Sarah Tan              1,840 pts        🏆 Champion │
│       ████████████████████░░░░  steps 9,234  meal 8/10  │
└──────────────────────────────────────────────────────────┘
   rank: JetBrains Mono 700 text-4xl, jasmine for #1
   name: Plus Jakarta Sans 600 text-base charcoal-blue
   score: JetBrains Mono 700 text-2xl charcoal-blue
   sub-stats: text-xs mono text-ghost
   border-b border-[--border-subtle]
```

**Metric Stat Card:**
```
┌────────────────────────────┐
│  STEPS THIS WEEK           │  ← Plus Jakarta Sans 500 uppercase xs text-ghost
│                            │
│  10,247                    │  ← JetBrains Mono 700 4xl charcoal-blue
│  steps                     │  ← Plus Jakarta Sans 400 sm text-secondary
│                            │
│  ████████████████░░░░░░░░  │  ← progress bar, verdigris fill, warm-sand bg
│  81% of 10k target         │  ← xs text-ghost
└────────────────────────────┘
   bg-[--bg-surface] border border-[--border] rounded-lg p-6
```

**Badge / Achievement:**
```
[ 🏆 Kiasu Champion ]    ← burnt-peach bg, white text, rounded-full px-3 py-1 text-xs font-600
[ 📈 Most Improved  ]    ← verdigris bg, white text
[ 🔥 3-Week Streak  ]    ← jasmine bg, charcoal-blue text
```

---

## 5. Texture & Effects

### Warm Background Texture (Optional)

A very subtle noise texture on the page background adds analog warmth, preventing the flat cornsilk from feeling sterile. Keep opacity extremely low — it should be imperceptible at first glance.

```css
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.02;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}
```

### Verdigris Glow (Rank #1 card)

The Kiasu Champion's leaderboard card gets a very subtle glow:

```css
.champion-glow {
  box-shadow: 0 0 24px rgba(42, 157, 143, 0.18), 0 1px 3px rgba(0,0,0,0.08);
}
```

Use only for the #1 card. One glow per layout. Not on hover states — it's earned.

### Sunday Reveal — Cinematic Dark Mode

The weekly `/reveal` broadcast in Telegram is a moment. The dashboard reveal page should match that energy. Consider using the **Option A dark palette** for the reveal view only (`/league/[id]/reveal`): charcoal-blue background, verdigris accent, jasmine gold for #1. Like the lights dimming before the winner is announced.

---

## 6. Motion & Animation

### Philosophy

Animations should feel like **scores being revealed**, not smooth SaaS transitions. The leaderboard row entering from the bottom. The rank number counting up. The progress bar filling in. Everything has purpose — it's communicating result, not just decoration.

### Entrance Animations (Framer Motion)

Leaderboard rows stagger in from below, fast enough to feel snappy:

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.06, duration: 0.35, ease: "easeOut" }}
>
```

- Stagger: **0.06s per row** (leaderboard loads fast — this isn't a reveal, it's a refresh)
- Duration: **0.35s** cards, **0.2s** small elements
- Easing: **easeOut** — things arrive and stop, no bounce

### Weekly Reveal Animation (Special Case)

For the Sunday reveal flow specifically, use a slower, more dramatic stagger:

```tsx
transition={{ delay: index * 0.3, duration: 0.5, ease: "easeOut" }}
```

Reveal from last place (#4) to first (#1), building suspense. The #1 card arrives last, with the champion glow appearing after a 0.2s delay post-entrance.

### Score Count-Up

For hero stats in the reveal, count up from 0:

```tsx
function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count.toLocaleString()}</span>;
}
```

### Progress Bar Fill

Health metric progress bars fill from 0% to the actual value on mount. Use CSS transition on `width`, not Framer Motion, for performance:

```tsx
<div
  className="h-2 rounded-full bg-[--accent] transition-all duration-700 ease-out"
  style={{ width: mounted ? `${pct}%` : "0%" }}
/>
```

### Hover States

- Leaderboard rows: `bg-[--bg-elevated]` on hover, transition 150ms
- Buttons: background darkens one step (burnt-peach → verdigris-dark), transition 150ms
- Cards: `shadow-sm` → `shadow-md`, very subtle lift
- No scale transforms on hover. No bounce. No rotation.

---

## 7. Iconography

Use **Lucide React** exclusively. Keep icons minimal — words are clearer than icons for health stats.

- `strokeWidth={1.5}` throughout (matches the airy, light aesthetic)
- Size: 16px inline, 20px buttons, 24px section headers
- Color: `text-[--text-ghost]` default; `text-[--accent]` active/selected; `text-[--accent-hot]` alerts

Key icons:
- `Trophy` — champion badge, rewards
- `TrendingUp` / `TrendingDown` — week-over-week change
- `Users` — league / group
- `Footprints` — steps metric
- `Utensils` — meal balance
- `Timer` — run/activity time
- `Moon` — sleep
- `Medal` — rank
- `Flame` — streak
- `Lock` — private / DM only

---

## 8. Logo & Wordmark

Purely typographic. No icon, no symbol needed for the hackathon.

```
Kiasu          ← Plus Jakarta Sans 800, charcoal-blue (#264653)
Health         ← Plus Jakarta Sans 800, verdigris (#2A9D8F)
```

Inline single-line variant:
```
KiasuHealth    ← "Kiasu" in charcoal-blue, "Health" always in verdigris
```

The color split IS the brand mark. "Kiasu" is the attitude (dark, serious, competitive). "Health" is the purpose (verdigris, alive, vital). No need for a separate mark.

Sub-brand tagline (use below the wordmark in headers):
```
Be kiasu about your health.   ← Plus Jakarta Sans 400, text-secondary, text-sm
```

Favicon / smallest context: `KH` in JetBrains Mono 700, verdigris on cornsilk background. Keep it legible at 16×16.

---

## 9. Writing Voice

### Dashboard / Web Copy

Clear, direct, slightly competitive. Let the numbers do the talking. Short sentences.

✅ "Sarah's ahead by 430 points. Close the gap this week."
✅ "Weekly reveal: Sunday 8 PM. No peeking till then."
✅ "Your meal balance dragged you down. Steps saved you."
❌ "Great job this week! You're making amazing progress on your health journey!"
❌ "Track your wellness metrics and achieve your personal health goals."

### Data Labels

Uppercase, tracked, light-colored. Brief.

✅ `WEEKLY SCORE`
✅ `STEPS THIS WEEK`
✅ `MEAL BALANCE`
✅ `RANK`
❌ `Your Total Score for This Week`
❌ `How many steps did you walk?`

### Telegram Bot Copy (Singlish, Light Touch)

Conversational, relatable, a little cheeky. Not excessive — one touch of Singlish per message is enough. Never parody.

✅ "Your meal balance was 3/10 lah. Swap the nasi lemak for economy rice next time — less coconut milk."
✅ "Confirm you're kiasu-ing this week. Steps: 9,234. Keep going!"
✅ "Sarah beat you by 430 pts. Next week, faster."
❌ "Wah lau eh bro your steps sibei jialat sia cannot make it leh" ← too much, reads as parody
❌ "Congrats on completing your health journey milestone today! 🌟🎉💪" ← zero personality

### CTA Copy

Specific, action-oriented. Not generic.

✅ "Join the league" / "See the reveal" / "Beat your kakis"
✅ "Check standings" / "Submit your meal"
❌ "Get started" / "Learn more" / "Start your journey"

---

## 10. Anti-Patterns (What We Never Do)

| Anti-Pattern | Why | What We Use Instead |
|---|---|---|
| Generic health-app green (`#00B0B9`, `#30D158`) | Every fitness app default — we disappear into the crowd | Verdigris (#2A9D8F) — same family, distinctly ours |
| Clinical white / hospital-bright backgrounds | Cold, demotivating, medical | Warm cornsilk (#FEFAE0) — kopitiam not clinic |
| Blue corporate gradients | Generic SaaS enterprise default | Solid burnt-peach CTAs, warm palette only |
| Inter or system sans-serif | Generic AI font default | Plus Jakarta Sans |
| Emoji overload in the dashboard UI | Infantilises the product, makes data hard to read | Emojis in Telegram bot copy only, sparingly |
| "Start your journey" / "Track your progress" / "Achieve your goals" | Every health app ever, zero personality | Group-first, competitive copy: "Join the league", "Beat your kakis" |
| Fully-rounded pill buttons everywhere (`rounded-full`) | Too friendly, weakens the competitive feel | `rounded-lg` for most buttons; `rounded-full` only for badges/chips |
| Solo-first copy ("your goals", "your steps", "your progress") | Misses the social accountability core | Group-first framing: "your league", "your kaki", "this week's challenge" |
| Full-screen hero section with centered CTA | Generic landing page — wastes space | Leaderboard as hero — standings are immediately visible |
| Purple, indigo, or cool-blue anywhere | No product reason; also a generic AI/SaaS default | Stick to the warm palette — verdigris, burnt peach, jasmine |
| Generic modal dialogs for everything | Heavy, interrupts flow | Inline reveals, expandable rows, Telegram-first for quick actions |

---

## 11. Quick Reference — Tailwind Classes

Since these custom colors aren't in default Tailwind, configure in `tailwind.config.ts`:

```ts
// tailwind.config.ts
extend: {
  colors: {
    cornsilk: "#FEFAE0",
    "papaya-whip": "#FAEDCD",
    "warm-sand": "#F4E1B0",
    verdigris: "#2A9D8F",
    "verdigris-dark": "#1A6B63",
    "burnt-peach": "#E76F51",
    "jasmine": "#E9C46A",
    "sandy-brown": "#F4A261",
    "light-bronze": "#D4A373",
    "charcoal-blue": "#264653",
    "slate-teal": "#4A7C8A",
    "muted-teal": "#8AACB4",
  },
  fontFamily: {
    sans: ["var(--font-sans)", "DM Sans", "sans-serif"],
    mono: ["var(--font-mono)", "monospace"],
  },
}
```

Shorthand reference:
```
Page bg:          bg-cornsilk
Card bg:          bg-papaya-whip
Elevated:         bg-warm-sand
Primary text:     text-charcoal-blue
Secondary text:   text-slate-teal
Ghost / labels:   text-muted-teal
Accent:           text-verdigris  bg-verdigris
CTA / Hot:        text-burnt-peach  bg-burnt-peach
Gold / Rank #1:   text-jasmine  bg-jasmine
Borders:          border-jasmine (default)  border-warm-sand (subtle)
Cards:            bg-papaya-whip border border-jasmine rounded-lg p-6
Labels:           text-xs uppercase tracking-wide text-muted-teal font-sans font-500
Stat numbers:     text-4xl font-mono font-bold text-charcoal-blue
Buttons (CTA):    bg-burnt-peach hover:bg-verdigris text-white rounded-lg px-4 py-2 font-sans font-600
Buttons (ghost):  border border-verdigris text-verdigris hover:bg-verdigris hover:text-white rounded-lg
```

---

## 12. Example Component (Reference Implementation)

A leaderboard card row — this is the core unit of the product:

```tsx
<div className={cn(
  "flex items-center gap-4 p-4 bg-papaya-whip border border-jasmine rounded-lg",
  rank === 1 && "champion-glow border-jasmine"
)}>
  {/* Rank */}
  <span className={cn(
    "font-mono font-bold text-3xl w-10 text-center shrink-0",
    rank === 1 ? "text-jasmine" : rank === 2 ? "text-muted-teal" : "text-light-bronze"
  )}>
    #{rank}
  </span>

  {/* Player + progress */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between mb-1">
      <span className="font-sans font-600 text-base text-charcoal-blue truncate">{name}</span>
      <span className="font-mono font-bold text-xl text-charcoal-blue shrink-0 ml-2">
        {score.toLocaleString()} pts
      </span>
    </div>
    <div className="h-1.5 bg-warm-sand rounded-full overflow-hidden">
      <div
        className="h-full bg-verdigris rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
    <div className="flex gap-3 mt-1 text-xs font-mono text-muted-teal">
      <span>{steps.toLocaleString()} steps</span>
      <span>{mealScore}/10 meal</span>
      {badge && <span className="text-burnt-peach font-sans font-600">{badge}</span>}
    </div>
  </div>
</div>
```

This row tells you everything in one scan: rank, name, total score, breakdown, badge. Warm but precise. Social but data-serious.
