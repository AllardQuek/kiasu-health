// ─── Elastic Cloud Client + Helper Functions ─────────────────────────────────
// Uses ES|QL for weekly standings. Falls back to MOCK_STANDINGS on any error.
// NEVER writes photo_url, calories, or nutrition details to Elastic.

import { Client } from "@elastic/elasticsearch";
import type { StandingsEntry, Player, League, PlayerTrends, RevealRecord, NearbySuggestion } from "./types";
import { MOCK_STANDINGS, MOCK_PLAYERS } from "./mock";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL ?? "https://localhost:9200",
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY ?? "",
  },
});

const ageMultiplier = (age: number): number =>
  age >= 50 ? 1.1 : age >= 40 ? 1.05 : 1.0;

const PLAYERS_INDEX = process.env.ELASTIC_INDEX_PLAYERS ?? "kiasuhealth-players";
const METRICS_INDEX = process.env.ELASTIC_INDEX_METRICS ?? "kiasuhealth-metrics";
const LEAGUES_INDEX = process.env.ELASTIC_INDEX_LEAGUES ?? "kiasuhealth-leagues";
const REVEALS_INDEX = process.env.ELASTIC_INDEX_REVEALS ?? "kiasuhealth-reveals";

// ── Geodata config ────────────────────────────────────────────────────────────
// Maps coaching_focus → the most relevant maps-geojson-* index for nearby suggestions.
// To support a new category or swap an index, add/edit one line here — nothing else changes.
export const GEODATA_INDEX: Record<string, string> = {
  meal:     "maps-geojson-healthiereateries",  // 1829 HPB Healthier Dining Programme venues
  steps:    "maps-geojson-parkssg",            // 52 NParks parks
  activity: "maps-geojson-gymssggeojson",      // 159 ActiveSG gyms
};

export async function getStandings(leagueId: string): Promise<StandingsEntry[]> {
  try {
    // Run ES|QL weekly standings query
    const esqlQuery = `
FROM ${METRICS_INDEX}
| WHERE league_id == "${leagueId}"
  AND recorded_at >= DATE_TRUNC(1, "week", NOW())
| STATS
    total_steps      = SUM(steps),
    avg_meal_balance = AVG(meal_balance_score),
    total_run_mins   = SUM(run_time_minutes),
    days_active      = COUNT_DISTINCT(date)
  BY player_id
| EVAL
    steps_score    = LEAST(total_steps / 70000.0, 1.0) * 40,
    meal_score     = avg_meal_balance / 10.0 * 40,
    activity_score = LEAST(total_run_mins / 150.0, 1.0) * 20,
    raw_score      = steps_score + meal_score + activity_score
| SORT raw_score DESC
| KEEP player_id, total_steps, avg_meal_balance, total_run_mins, days_active, raw_score
    `.trim();

    const result = await esClient.esql.query({ query: esqlQuery });

    // ES|QL returns columns + values format
    const columns: Array<{ name: string }> = result.columns as Array<{ name: string }>;
    const rows: unknown[][] = result.values as unknown[][];

    // Fetch player info separately (age, name) to apply age multiplier
    const pidIdx = columns.findIndex((c) => c.name === "player_id");
    const playerIds = rows.map((r) => String(r[pidIdx]));
    const playerDocs = await esClient.mget({
      index: PLAYERS_INDEX,
      ids: playerIds,
    });

    const playerMap = new Map<string, { name: string; age: number }>();
    for (const hit of playerDocs.docs) {
      if ("found" in hit && hit.found && "_source" in hit) {
        const src = hit._source as { player_id?: string; name?: string; age?: number };
        if (src.player_id) {
          playerMap.set(src.player_id, {
            name: src.name ?? "Unknown",
            age: src.age ?? 30,
          });
        }
      }
    }

    const colName = (name: string) => columns.findIndex((c) => c.name === name);

    const standings: StandingsEntry[] = rows.map((row, i) => {
      const playerId = String(row[colName("player_id")]);
      const rawScore = Number(row[colName("raw_score")]) ?? 0;
      const player = playerMap.get(playerId);
      const age = player?.age ?? 30;
      const multiplier = ageMultiplier(age);
      const finalScore = Math.round(rawScore * multiplier * 10) / 10;

      return {
        rank: i + 1,
        player_id: playerId,
        name: player?.name ?? playerId,
        total_steps: Number(row[colName("total_steps")]) ?? 0,
        avg_meal_balance: Math.round((Number(row[colName("avg_meal_balance")]) ?? 0) * 100) / 100,
        total_run_mins: Number(row[colName("total_run_mins")]) ?? 0,
        days_active: Number(row[colName("days_active")]) ?? 0,
        raw_score: rawScore,
        final_score: finalScore,
        age_adjusted: multiplier > 1,
        age_multiplier: multiplier,
        badge: getBadge(i + 1),
      };
    });

    return standings;
  } catch (err) {
    console.error("[elastic] getStandings failed, using mock data:", err);
    return MOCK_STANDINGS;
  }
}

function getBadge(rank: number): string {
  switch (rank) {
    case 1: return "Kiasu Champion 🏆";
    case 2: return "Most Improved 📈";
    case 3: return "Healthy Kaki 🥗";
    default: return "Steady Lah 🔥";
  }
}

export async function writeMealScore(
  playerId: string,
  leagueId: string,
  score: number,
  weekStart: string
): Promise<void> {
  try {
    // ONLY write the balance score — never photo_url, calories, or nutrition details
    await esClient.index({
      index: METRICS_INDEX,
      body: {
        player_id: playerId,
        league_id: leagueId,
        meal_balance_score: score,   // 0–10 only
        week_start_date: weekStart,
        recorded_at: new Date().toISOString(),
        source: "manual",
      },
    });
  } catch (err) {
    console.error("[elastic] writeMealScore failed:", err);
    // Silently fail — meal score write is best-effort; demo continues
  }
}

// Seed helpers for scripts/seed-elastic.ts
export { MOCK_PLAYERS, MOCK_STANDINGS };

// ── Date helpers ────────────────────────────────────────────────────────────

export function getCurrentWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split("T")[0];
}

function getPrevWeekStart(): string {
  const ms = new Date(getCurrentWeekStart()).getTime() - 7 * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().split("T")[0];
}

// ── Player helpers ──────────────────────────────────────────────────────────

export async function getPlayerByTelegramId(telegramId: string): Promise<Player | null> {
  try {
    const result = await esClient.search<Player>({
      index: PLAYERS_INDEX,
      query: { term: { telegram_id: telegramId } },
      size: 1,
    });
    return result.hits.hits[0]?._source ?? null;
  } catch (err) {
    console.error("[elastic] getPlayerByTelegramId failed:", err);
    return null;
  }
}

export async function upsertPlayer(player: Omit<Player, "created_at">): Promise<void> {
  await esClient.update({
    index: PLAYERS_INDEX,
    id: player.player_id,
    doc: { ...player, updated_at: new Date().toISOString() },
    upsert: { ...player, created_at: new Date().toISOString() },
  });
  // Let errors surface — /join must know if registration failed
}

// ── League helpers ───────────────────────────────────────────────────────────

export async function getLeagueByJoinCode(joinCode: string): Promise<League | null> {
  try {
    const result = await esClient.search<League>({
      index: LEAGUES_INDEX,
      query: { term: { join_code: joinCode.toUpperCase() } },
      size: 1,
    });
    return result.hits.hits[0]?._source ?? null;
  } catch (err) {
    console.error("[elastic] getLeagueByJoinCode failed:", err);
    return null;
  }
}

// ── Trends ──────────────────────────────────────────────────────────────────

export async function getPlayerTrends(playerId: string, leagueId: string): Promise<PlayerTrends> {
  const currentWeekStart = getCurrentWeekStart();
  const prevWeekStart = getPrevWeekStart();

  const makeQuery = (dateGte: string, dateLt?: string) => `
FROM ${METRICS_INDEX}
| WHERE player_id == "${playerId}"
  AND league_id == "${leagueId}"
  AND date >= "${dateGte}"${dateLt ? `\n  AND date < "${dateLt}"` : ""}
| STATS
    total_steps = SUM(steps),
    avg_meal    = AVG(meal_balance_score),
    total_run   = SUM(run_time_minutes),
    days_active = COUNT_DISTINCT(date)
`.trim();

  const zeroWeek = { total_steps: 0, avg_meal_balance: 0, total_run_mins: 0, days_active: 0 };

  try {
    const [curRes, prevRes] = await Promise.all([
      esClient.esql.query({ query: makeQuery(currentWeekStart) }),
      esClient.esql.query({ query: makeQuery(prevWeekStart, currentWeekStart) }),
    ]);

    const parseRow = (res: typeof curRes) => {
      const cols = (res.columns as Array<{ name: string }>).map((c) => c.name);
      const row = (res.values as unknown[][])[0] ?? [0, 0, 0, 0];
      return {
        total_steps: Number(row[cols.indexOf("total_steps")]) || 0,
        avg_meal_balance: Math.round((Number(row[cols.indexOf("avg_meal")]) || 0) * 100) / 100,
        total_run_mins: Number(row[cols.indexOf("total_run")]) || 0,
        days_active: Number(row[cols.indexOf("days_active")]) || 0,
      };
    };

    const cur = parseRow(curRes);
    const prev = parseRow(prevRes);

    const stepsDeltaPct =
      prev.total_steps > 0
        ? Math.round(((cur.total_steps - prev.total_steps) / prev.total_steps) * 1000) / 10
        : 0;
    const mealDelta = Math.round((cur.avg_meal_balance - prev.avg_meal_balance) * 100) / 100;
    const runDelta = cur.total_run_mins - prev.total_run_mins;

    // Coaching focus = the weakest metric (normalised to 0–100 scale)
    const stepsNorm = Math.min(cur.total_steps / 70000, 1) * 100;
    const mealNorm = (cur.avg_meal_balance / 10) * 100;
    const actNorm = Math.min(cur.total_run_mins / 150, 1) * 100;
    const coachingFocus =
      stepsNorm <= mealNorm && stepsNorm <= actNorm
        ? "steps"
        : mealNorm <= actNorm
          ? "meal"
          : "activity";

    return {
      player_id: playerId,
      league_id: leagueId,
      current_week: cur,
      prev_week: prev,
      trends: {
        steps_delta_pct: stepsDeltaPct,
        meal_delta: mealDelta,
        run_delta_mins: runDelta,
        improving: stepsDeltaPct > 0 || mealDelta > 0,
      },
      coaching_focus: coachingFocus,
    };
  } catch (err) {
    console.error("[elastic] getPlayerTrends failed, returning zero trends:", err);
    return {
      player_id: playerId,
      league_id: leagueId,
      current_week: zeroWeek,
      prev_week: zeroWeek,
      trends: { steps_delta_pct: 0, meal_delta: 0, run_delta_mins: 0, improving: false },
      coaching_focus: "steps",
    };
  }
}

// ── Reveal cache ────────────────────────────────────────────────────────────

export async function getRevealCache(leagueId: string, weekStart: string): Promise<RevealRecord | null> {
  try {
    const result = await esClient.get<RevealRecord>({
      index: REVEALS_INDEX,
      id: `${leagueId}_${weekStart}`,
    });
    return result._source ?? null;
  } catch {
    return null; // 404 = not cached yet; swallow silently
  }
}

export async function writeRevealCache(record: RevealRecord): Promise<void> {
  try {
    await esClient.index({
      index: REVEALS_INDEX,
      id: `${record.league_id}_${record.week_start}`,
      document: record,
    });
  } catch (err) {
    console.error("[elastic] writeRevealCache failed:", err);
    // Non-fatal — reveal already in-flight, cache miss next time at worst
  }
}

// ── Geodata / nearby venues ──────────────────────────────────────────────────

// Returns the nearest venue in the geodata index for a given coaching category,
// within radiusKm of the player's home_location. Returns null on any failure.
//
// Uses a geo_shape envelope (bounding box) query — works against geo_shape fields.
// At Singapore's latitude (≈1.4°N), 1° ≈ 111 km in both axes, so the box is isotropic.
// Scaling to new categories: add an entry to GEODATA_INDEX above — nothing else needed.
export async function getNearbyVenues(
  playerId: string,
  category: string,
  radiusKm = 3,
): Promise<NearbySuggestion | null> {
  const indexName = GEODATA_INDEX[category];
  if (!indexName) return null;

  try {
    const playerDoc = await esClient.get<Player>({ index: PLAYERS_INDEX, id: playerId });
    const loc = playerDoc._source?.home_location as { lat: number; lon: number } | undefined;
    if (!loc) return null;

    const { lat, lon } = loc;
    const delta = radiusKm / 111; // degrees (~isotropic at SG latitude)

    const result = await esClient.search({
      index: indexName,
      size: 1,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: {
        geo_shape: {
          geometry: {
            shape: {
              type: "envelope",
              coordinates: [
                [lon - delta, lat + delta], // top-left  [lon, lat]
                [lon + delta, lat - delta], // bottom-right [lon, lat]
              ],
            },
            relation: "intersects",
          },
        },
      } as any,
    });

    const hit = result.hits.hits[0];
    if (!hit) return null;

    const src = (hit._source ?? {}) as Record<string, unknown>;
    const pick = (...keys: string[]): string => {
      for (const k of keys) if (src[k]) return String(src[k]);
      return "";
    };

    // Property names differ across OpenGov SG datasets — try common variants
    const name    = pick("name", "Name", "NAME", "PROGRAMME_NAME", "LIC_NAME");
    const address = pick("address", "Address", "ADDRESS", "ADDRESSSTREETNAME", "ADDRESSBUILDINGNAME");

    if (!name) return null;

    return {
      name,
      address,
      category: indexName.replace("maps-geojson-", ""),
    };
  } catch (err) {
    console.error("[elastic] getNearbyVenues failed:", err);
    return null;
  }
}
