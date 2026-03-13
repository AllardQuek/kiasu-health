// ─── KiasuHealth TypeScript Interfaces ──────────────────────────────────────
// Field names match Elastic index mappings exactly (ARCHITECTURE.md §2)

export interface Player {
  player_id: string;
  name: string;
  league_id: string;
  age: number;
  gender: "M" | "F";
  telegram_id?: string;          // set when user runs /join; links Telegram account to player record
  home_location?: { lat: number; lon: number };  // geo_point; derived from run route centroid
  total_wins?: number;           // incremented by KiasuRefereeAgent on weekly win
  created_at?: string;
}

export interface WeeklyMetric {
  player_id: string;
  league_id: string;
  date: string;                  // ISO date string e.g. "2026-03-09"
  steps: number;
  meal_balance_score: number;    // 0–10; only this score is stored, never raw photo/nutrition
  run_time_minutes: number;
  sleep_hours?: number;
  source: "apple_health" | "strava" | "manual" | "mock";
}

export interface League {
  league_id: string;
  name: string;
  chat_id?: string;              // Telegram group chat ID
  join_code?: string;            // short alphanumeric code users type in /join (e.g. "KIASU01")
  config: {
    steps_weight: number;        // default: 0.4
    meal_weight: number;         // default: 0.4
    activity_weight: number;     // default: 0.2
  };
  created_at?: string;
}

// ── Geodata / nearby suggestions ─────────────────────────────────────────────

export interface NearbySuggestion {
  name: string;
  address: string;
  category: string;              // human-readable label derived from the maps-geojson-* index name
}

// ── Trends & aggregation types ────────────────────────────────────────────────

export interface WeekAggregate {
  total_steps: number;
  avg_meal_balance: number;
  total_run_mins: number;
  days_active: number;
}

export interface PlayerTrends {
  player_id: string;
  league_id: string;
  current_week: WeekAggregate;
  prev_week: WeekAggregate;
  trends: {
    steps_delta_pct: number;     // % change week-over-week (positive = improving)
    meal_delta: number;          // absolute change in avg meal score
    run_delta_mins: number;      // absolute change in total run minutes
    improving: boolean;          // true if overall trajectory is positive
  };
  coaching_focus: "steps" | "meal" | "activity";  // weakest metric for the coach to address
  nearby_suggestion?: NearbySuggestion | null;     // nearest relevant venue based on home_location + coaching_focus
}

// ── Reveal cache ──────────────────────────────────────────────────────────────

export interface RevealRecord {
  league_id: string;
  week_start: string;            // ISO date e.g. "2026-03-09"
  standings_text: string;        // formatted Telegram markdown text
  winner_name: string;
  nudge: string;                 // personalised nudge for lowest scorer
  reward: string;                // winner reward message
  processed_at: string;          // ISO timestamp of when the reveal was generated
}

export interface StandingsEntry {
  rank: number;
  player_id: string;
  name: string;
  total_steps: number;
  avg_meal_balance: number;
  total_run_mins: number;
  days_active?: number;
  raw_score?: number;
  final_score: number;
  age_adjusted?: boolean;
  age_multiplier?: number;
  badge?: string;
}

export interface MealPhotoResult {
  player_id?: string;
  calories: number;
  balance_score: number;         // alias for meal_balance_score in agent responses
  meal_balance_score?: number;
  tip: string;
  hawker_detected?: boolean;
  league_score_entry?: { meal_balance_score: number };
  // Agent Builder response fields
  calories_estimate?: number;
  balance_tip?: string;
  agent_commentary?: string;
  estimates?: {
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
  };
}

export interface AgentBuilderRequest {
  photo_url?: string;
  player_id?: string;
  league_id?: string;
  week_start_date?: string;
  [key: string]: unknown;
}

export interface AgentBuilderResponse {
  // HealthCoachAgent — meal analysis + personalised coaching
  // (A2A: MealAnalyzerAgent → Bedrock vision + DataAggregatorAgent → Elastic trends)
  calories?: number;
  balance_score?: number;
  tip?: string;
  hawker_detected?: boolean;
  message?: string;              // full coaching reply to send to the user
  coaching_focus?: string;       // "steps" | "meal" | "activity"
  league_score_entry?: { meal_balance_score: number };

  // KiasuRefereeAgent — group-facing weekly judgment
  // (A2A: DataAggregatorAgent → Elastic trends)
  standings_text?: string;
  winner_name?: string;
  nudge?: string;
  reward?: string;

  // Generic passthrough
  [key: string]: unknown;
}
