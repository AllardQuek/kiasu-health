// scripts/parse-apple-health.ts
// Streams export.xml + Singapore GPX routes to extract Zing's health baselines.
// Output: JSON to stdout. Calibration summary to stderr.
//
// Usage:  npx tsx scripts/parse-apple-health.ts
//         npx tsx scripts/parse-apple-health.ts 2>/dev/null   ← JSON only

import fs from "fs";
import path from "path";
import readline from "readline";

const EXPORT_XML = path.resolve("data/apple_health_export/export.xml");
const ROUTES_DIR = path.resolve("data/apple_health_export/workout-routes");

interface DayBucket {
  steps: number;
  heart_rates: number[];
  active_energy_kcal: number;
  sleep_minutes: number;
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  return sorted[Math.min(Math.floor((p / 100) * sorted.length), sorted.length - 1)];
}

async function parseExportXml(): Promise<Map<string, DayBucket>> {
  const days = new Map<string, DayBucket>();
  const get = (d: string): DayBucket => {
    if (!days.has(d)) days.set(d, { steps: 0, heart_rates: [], active_energy_kcal: 0, sleep_minutes: 0 });
    return days.get(d)!;
  };

  const rl = readline.createInterface({ input: fs.createReadStream(EXPORT_XML), crlfDelay: Infinity });
  let lines = 0;
  let records = 0;

  for await (const line of rl) {
    if (++lines % 250_000 === 0) process.stderr.write(`  … ${lines.toLocaleString()} lines\n`);
    if (!line.includes("<Record ")) continue;

    const type = line.match(/\btype="([^"]+)"/)?.[1] ?? "";
    const date = line.match(/\bstartDate="(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
    const val  = parseFloat(line.match(/\bvalue="([^"]+)"/)?.[1] ?? "NaN");
    if (!date) continue;
    records++;

    if (type === "HKQuantityTypeIdentifierStepCount" && !isNaN(val)) {
      get(date).steps += val;
    } else if (type === "HKQuantityTypeIdentifierHeartRate" && val > 30 && val < 220) {
      get(date).heart_rates.push(val);
    } else if (type === "HKQuantityTypeIdentifierActiveEnergyBurned" && !isNaN(val)) {
      get(date).active_energy_kcal += val;
    } else if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
      const start = line.match(/\bstartDate="([^"]+)"/)?.[1];
      const end   = line.match(/\bendDate="([^"]+)"/)?.[1];
      if (start && end) {
        const dur = (new Date(end).getTime() - new Date(start).getTime()) / 60_000;
        if (dur > 10 && dur < 720) get(date).sleep_minutes += dur;
      }
    }
  }

  process.stderr.write(`  Done: ${lines.toLocaleString()} lines, ${records.toLocaleString()} records\n`);
  return days;
}

function parseGpx(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const file = path.basename(filePath);
  const date = file.match(/route_(\d{4}-\d{2}-\d{2})/)?.[1] ?? "unknown";

  const lines = content.split("\n").filter((l) => l.includes("<trkpt "));
  if (lines.length < 10) return null;

  const firstLat = parseFloat(lines[0].match(/lat="([\d.]+)"/)?.[1] ?? "0");
  if (firstLat < 1.2 || firstLat > 1.5) return null; // filter: Singapore only

  const times: number[] = [];
  const speeds: number[] = [];
  for (const l of lines) {
    const t = l.match(/<time>([^<]+)<\/time>/)?.[1];
    const s = parseFloat(l.match(/<speed>([\d.]+)<\/speed>/)?.[1] ?? "NaN");
    if (t) times.push(new Date(t).getTime());
    if (!isNaN(s) && s > 0.5 && s < 8) speeds.push(s);
  }
  if (times.length < 2 || !speeds.length) return null;

  const duration_min = (times[times.length - 1] - times[0]) / 60_000;
  if (duration_min < 5) return null;
  const avg_ms = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const distance_km = (avg_ms * duration_min * 60) / 1000;
  const pace = 1000 / (avg_ms * 60);

  return {
    file,
    date,
    duration_min: Math.round(duration_min),
    distance_km: Math.round(distance_km * 10) / 10,
    pace_min_per_km: Math.round(pace * 10) / 10,
    avg_speed_ms: Math.round(avg_ms * 100) / 100,
  };
}

async function main() {
  process.stderr.write("⏳ Streaming export.xml…\n");
  const days = await parseExportXml();

  const stepDays  = [...days.values()].map((d) => d.steps).filter((s) => s > 500).sort((a, b) => a - b);
  const allHR     = [...days.values()].flatMap((d) => d.heart_rates);
  const restHR    = allHR.filter((h) => h >= 40 && h < 80).sort((a, b) => a - b);
  const activeHR  = allHR.filter((h) => h >= 120).sort((a, b) => a - b);
  const energyD   = [...days.values()].map((d) => d.active_energy_kcal).filter((e) => e > 50).sort((a, b) => a - b);
  const sleepD    = [...days.values()].map((d) => Math.round((d.sleep_minutes / 60) * 10) / 10).filter((h) => h >= 3 && h <= 12).sort((a, b) => a - b);

  process.stderr.write("⏳ Scanning GPX routes…\n");
  const gpxFiles = fs.readdirSync(ROUTES_DIR).filter((f) => f.endsWith(".gpx")).sort();
  const runs = gpxFiles.map((f) => parseGpx(path.join(ROUTES_DIR, f))).filter(Boolean) as NonNullable<ReturnType<typeof parseGpx>>[];

  const durations = runs.map((r) => r.duration_min).sort((a, b) => a - b);
  const paces     = runs.map((r) => r.pace_min_per_km).filter((p) => p > 3.5 && p < 9).sort((a, b) => a - b);
  const distances = runs.map((r) => r.distance_km).sort((a, b) => a - b);

  const result = {
    summary: "Zing (player3) baseline — derived from Apple Health export",
    step_stats: {
      coverage_days: stepDays.length,
      avg: mean(stepDays), p25: pct(stepDays, 25), p50: pct(stepDays, 50),
      p75: pct(stepDays, 75), p90: pct(stepDays, 90), max: stepDays[stepDays.length - 1] ?? 0,
    },
    heart_rate: { resting_avg: mean(restHR), resting_p25: pct(restHR, 25), resting_p75: pct(restHR, 75), active_avg: mean(activeHR) },
    active_energy_kcal: { avg: mean(energyD), p25: pct(energyD, 25), p75: pct(energyD, 75) },
    sleep: { nights: sleepD.length, avg_hours: mean(sleepD), p25: pct(sleepD, 25), p75: pct(sleepD, 75) },
    sg_runs: {
      total: runs.length,
      avg_duration_min: mean(durations), p25_duration: pct(durations, 25), p75_duration: pct(durations, 75),
      avg_distance_km: mean(distances),
      avg_pace_min_per_km: mean(paces), p25_pace: pct(paces, 25), p75_pace: pct(paces, 75),
      recent_5: runs.slice(-5),
    },
  };

  process.stderr.write(`\n📊 Seed calibration:\n`);
  process.stderr.write(`  Steps: avg ${result.step_stats.avg}, p25 ${result.step_stats.p25}, p75 ${result.step_stats.p75}\n`);
  process.stderr.write(`  Resting HR: ${result.heart_rate.resting_avg} bpm\n`);
  process.stderr.write(`  SG runs: ${result.sg_runs.total} total, avg ${result.sg_runs.avg_duration_min}min @ ${result.sg_runs.avg_pace_min_per_km}min/km\n\n`);

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => { console.error(err); process.exit(1); });
