// scripts/seed-elastic.ts — 4-week deterministic persona seeder
//
// Usage:
//   pnpm seed           — create/update indices, seed all data
//   WIPE=1 pnpm seed    — delete all kiasuhealth-* indices first, then re-seed
//
// Generates 4 weeks × 4 players × 7 days = 112 metric docs.
// Deterministic: same input → same output every run (Mulberry32 PRNG).

import path from "path";
import dotenv from "dotenv";
import { Client } from "@elastic/elasticsearch";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL ?? "",
  auth: { apiKey: process.env.ELASTICSEARCH_API_KEY ?? "" },
});

const IDX = {
  players: process.env.ELASTIC_INDEX_PLAYERS ?? "kiasuhealth-players",
  metrics:  process.env.ELASTIC_INDEX_METRICS  ?? "kiasuhealth-metrics",
  leagues:  process.env.ELASTIC_INDEX_LEAGUES  ?? "kiasuhealth-leagues",
  reveals:  process.env.ELASTIC_INDEX_REVEALS  ?? "kiasuhealth-reveals",
};

const LEAGUE_ID = process.env.DEFAULT_LEAGUE_ID ?? "sg-league-001";

// ── Mulberry32 PRNG ───────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function ri(rng: () => number, mn: number, mx: number) {
  return mn + Math.floor(rng() * (mx - mn + 1));
}

// ── Persona profiles ──────────────────────────────────────────────────────────

interface Persona {
  player_id: string;
  name: string;
  age: number;
  gender: "M" | "F";
  home_location: { lat: number; lon: number };
  total_wins: number;
  // Steps
  steps_base: number;
  steps_variance: number;     // ±fraction applied to base
  weekend_boost: number;
  // step multipliers by week index: [current, -1wk, -2wk, -3wk]
  step_week_mults: [number, number, number, number];
  // Meals (score 1–10)
  meal_base: number;
  meal_variance: number;
  meal_week_mults: [number, number, number, number];
  // Runs
  run_days: number[];                     // 0=Mon … 6=Sun
  run_duration_range: [number, number];   // [min, max] minutes
}

const PERSONAS: Persona[] = [
  {
    // Ahmad — Most Improved badge. Weak prev weeks → strong current week (+40% steps).
    player_id: "player1", name: "Ahmad", age: 35, gender: "M",
    home_location: { lat: 1.365, lon: 103.820 }, total_wins: 1,
    steps_base: 10500, steps_variance: 0.14, weekend_boost: 1.05,
    step_week_mults: [1.00, 0.70, 0.73, 0.75],
    meal_base: 7.2, meal_variance: 1.5,
    meal_week_mults: [1.00, 0.96, 0.94, 0.92],
    run_days: [1, 4], run_duration_range: [22, 32],
  },
  {
    // Priya — Healthy Kaki badge. Best avg meal score. Age ×1.05 (age 42).
    player_id: "player2", name: "Priya", age: 42, gender: "F",
    home_location: { lat: 1.353, lon: 103.943 }, total_wins: 0,
    steps_base: 8500, steps_variance: 0.12, weekend_boost: 1.10,
    step_week_mults: [1.00, 0.95, 0.92, 0.90],
    meal_base: 7.8, meal_variance: 1.0,
    meal_week_mults: [1.00, 0.96, 0.95, 0.93],
    run_days: [2, 5], run_duration_range: [18, 28],
  },
  {
    // Wei Ming — Kiasu Champion. Highest overall score.
    // Steps + run = calibrated from Apple Health GPX (Yishun, ~4:30/km, ~27min sessions).
    player_id: "player3", name: "Wei Ming", age: 28, gender: "M",
    home_location: { lat: 1.422, lon: 103.827 }, total_wins: 2,
    steps_base: 9800, steps_variance: 0.12, weekend_boost: 1.08,
    step_week_mults: [1.00, 0.93, 0.89, 0.86],
    meal_base: 7.5, meal_variance: 1.2,
    meal_week_mults: [1.00, 0.95, 0.93, 0.91],
    run_days: [0, 2, 5], run_duration_range: [22, 35],
  },
  {
    // Siti — nudge target. Low meals; age ×1.1 (age 51).
    player_id: "player4", name: "Siti", age: 51, gender: "F",
    home_location: { lat: 1.345, lon: 103.740 }, total_wins: 0,
    steps_base: 6500, steps_variance: 0.15, weekend_boost: 1.00,
    step_week_mults: [1.00, 0.97, 1.03, 0.95],
    meal_base: 3.8, meal_variance: 1.5,
    meal_week_mults: [1.00, 0.96, 1.05, 0.90],
    run_days: [6], run_duration_range: [15, 22],
  },
];

// ── Week utilities ────────────────────────────────────────────────────────────

/** ISO date strings for Mon–Sun of the week starting at weekStart (UTC). */
function weekDates(weekStart: string): string[] {
  const origin = new Date(weekStart + "T00:00:00Z").getTime();
  return Array.from({ length: 7 }, (_, i) =>
    new Date(origin + i * 86_400_000).toISOString().split("T")[0]
  );
}

/** The n most recent Mon dates, newest first. */
function recentMondays(n = 4): string[] {
  const now = new Date();
  const dow = now.getUTCDay(); // 0=Sun
  const lastMon = new Date(now.getTime() - (dow === 0 ? 6 : dow - 1) * 86_400_000);
  lastMon.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) =>
    new Date(lastMon.getTime() - i * 7 * 86_400_000).toISOString().split("T")[0]
  );
}

// ── Metric generator ──────────────────────────────────────────────────────────

interface MetricDoc {
  player_id: string; league_id: string; date: string;
  steps: number; run_time_minutes: number; meal_balance_score: number; source: string;
}

function generateMetrics(personas: Persona[], leagueId: string): MetricDoc[] {
  const weeks = recentMondays(4); // [current, -1, -2, -3]
  const docs: MetricDoc[] = [];

  for (const p of personas) {
    // Seed from player_id so same player always produces same sequence
    const seed = p.player_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 7919;
    const rng = mulberry32(seed);

    for (let wi = 0; wi < weeks.length; wi++) {
      const dates = weekDates(weeks[wi]);
      const sMult = p.step_week_mults[wi];
      const mMult = p.meal_week_mults[wi];

      for (let di = 0; di < 7; di++) {
        const weekend = di >= 5 ? p.weekend_boost : 1.0;
        const stepTarget = p.steps_base * sMult * weekend;
        const stepNoise  = 1 + (rng() - 0.5) * 2 * p.steps_variance;
        const steps = Math.round(Math.max(1500, stepTarget * stepNoise));

        const isRunDay = p.run_days.includes(di);
        const run_time_minutes = isRunDay ? ri(rng, p.run_duration_range[0], p.run_duration_range[1]) : 0;
        // Advance RNG uniformly whether run day or not, to keep meal scores consistent
        if (!isRunDay) rng();

        const mealRaw = p.meal_base * mMult + (rng() - 0.5) * 2 * p.meal_variance;
        const meal_balance_score = Math.round(Math.min(10, Math.max(1, mealRaw)) * 10) / 10;

        docs.push({ player_id: p.player_id, league_id: leagueId, date: dates[di], steps, run_time_minutes, meal_balance_score, source: "mock" });
      }
    }
  }

  return docs;
}

// ── Index helpers ─────────────────────────────────────────────────────────────

async function ensureIndex(name: string, mappings: Record<string, unknown>) {
  const exists = await esClient.indices.exists({ index: name });
  if (!exists) {
    await (esClient.indices.create as (p: unknown) => Promise<unknown>)({ index: name, mappings });
    console.log(`  ✦ Created: ${name}`);
  } else {
    console.log(`  · Exists:  ${name}`);
  }
}

async function wipeIndex(name: string) {
  try {
    if (await esClient.indices.exists({ index: name })) {
      await esClient.indices.delete({ index: name });
      console.log(`  ✗ Wiped:   ${name}`);
    }
  } catch { /* ignore 404 */ }
}

async function bulkIndex(
  index: string,
  docs: unknown[],
  idFn?: (doc: unknown, i: number) => string
) {
  if (!docs.length) return;
  const ops = docs.flatMap((doc, i) => [
    { index: { _index: index, ...(idFn ? { _id: idFn(doc, i) } : {}) } },
    doc,
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res = await esClient.bulk({ operations: ops, refresh: true } as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errs = (res.items as any[]).filter((it) => it.index?.error);
  console.log(`  ✅ ${index}: ${docs.length - errs.length}/${docs.length} docs`);
  if (errs.length) console.warn("  ⚠️", errs.map((e: any) => e.index?.error));
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  const wipe = !!process.env.WIPE;
  console.log(`\n🌱 KiasuHealth seed${wipe ? " [WIPE mode]" : ""}\n`);

  if (wipe) {
    console.log("Wiping indices...");
    for (const name of Object.values(IDX)) await wipeIndex(name);
    console.log();
  }

  // ── Indices ───────────────────────────────────────────────────────────────
  console.log("Ensuring indices...");
  await ensureIndex(IDX.players, { properties: {
    player_id:     { type: "keyword" },
    name:          { type: "text", fields: { keyword: { type: "keyword" } } },
    telegram_id:   { type: "keyword" },
    telegram_handle: { type: "keyword" },
    league_id:     { type: "keyword" },
    age:           { type: "integer" },
    gender:        { type: "keyword" },
    home_location: { type: "geo_point" },
    total_wins:    { type: "integer" },
    created_at:    { type: "date" },
  }});

  await ensureIndex(IDX.metrics, { properties: {
    player_id:          { type: "keyword" },
    league_id:          { type: "keyword" },
    date:               { type: "date" },
    steps:              { type: "integer" },
    run_time_minutes:   { type: "float" },
    meal_balance_score: { type: "float" },
    source:             { type: "keyword" },
  }});

  await ensureIndex(IDX.leagues, { properties: {
    league_id:  { type: "keyword" },
    name:       { type: "text" },
    join_code:  { type: "keyword" },
    player_ids: { type: "keyword" },
    created_at: { type: "date" },
    current_week_start: { type: "date" },
  }});

  await ensureIndex(IDX.reveals, { properties: {
    league_id:      { type: "keyword" },
    week_start:     { type: "date" },
    standings_text: { type: "text" },
    winner_name:    { type: "keyword" },
    nudge:          { type: "text" },
    reward:         { type: "text" },
    processed_at:   { type: "date" },
  }});

  console.log();

  // ── League ────────────────────────────────────────────────────────────────
  console.log("Seeding league...");
  const weeks = recentMondays(4);
  await bulkIndex(IDX.leagues, [{
    league_id: LEAGUE_ID,
    name: "KiasuHealth SG Pilot",
    join_code: "KIASU01",
    player_ids: PERSONAS.map((p) => p.player_id),
    created_at: new Date().toISOString(),
    current_week_start: weeks[0],
  }], () => LEAGUE_ID);

  // ── Players ───────────────────────────────────────────────────────────────
  console.log("Seeding players...");
  const playerDocs = PERSONAS.map((p) => ({
    player_id: p.player_id, name: p.name, age: p.age, gender: p.gender,
    league_id: LEAGUE_ID, home_location: p.home_location, total_wins: p.total_wins,
    created_at: new Date().toISOString(),
  }));
  await bulkIndex(IDX.players, playerDocs, (d) => (d as typeof playerDocs[0]).player_id);

  // ── Metrics: 4 × 4 × 7 = 112 docs ────────────────────────────────────────
  console.log(`Seeding metrics (weeks: ${weeks.join(", ")})...`);
  const metrics = generateMetrics(PERSONAS, LEAGUE_ID);
  await bulkIndex(IDX.metrics, metrics);

  console.log(`\n🎉 Seed complete! ${metrics.length} metric docs across ${weeks.length} weeks.`);
  console.log("   pnpm dev → http://localhost:3000\n");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});