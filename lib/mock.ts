// ─── KiasuHealth Mock Data ───────────────────────────────────────────────────
// 4 seed players × 7 days (Mon 9 Mar – Sun 15 Mar 2026)
// Used as fallback whenever Elastic or Agent Builder is unavailable.

import type { Player, WeeklyMetric, StandingsEntry, MealPhotoResult } from "./types";

export const MOCK_PLAYERS: Player[] = [
  { player_id: "player1", name: "Ahmad",    league_id: "sg-league-001", age: 35, gender: "M", home_location: { lat: 1.365, lon: 103.820 }, total_wins: 1 },
  { player_id: "player2", name: "Priya",    league_id: "sg-league-001", age: 42, gender: "F", home_location: { lat: 1.353, lon: 103.943 }, total_wins: 0 },
  { player_id: "player3", name: "Wei Ming", league_id: "sg-league-001", age: 28, gender: "M", home_location: { lat: 1.422, lon: 103.827 }, total_wins: 2 },
  { player_id: "player4", name: "Siti",     league_id: "sg-league-001", age: 51, gender: "F", home_location: { lat: 1.345, lon: 103.740 }, total_wins: 0 },
];

// 7-Day metrics (Mon 9 Mar – Sun 15 Mar 2026)
// run_time_minutes: Ahmad 45, Priya 30, Wei Ming 60, Siti 20 (totals split across days)
export const MOCK_METRICS: WeeklyMetric[] = [
  // Ahmad (player1)
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-09", steps: 11200, meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-10", steps: 9500,  meal_balance_score: 6, run_time_minutes: 15, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-11", steps: 10800, meal_balance_score: 8, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-12", steps: 12100, meal_balance_score: 7, run_time_minutes: 20, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-13", steps: 9900,  meal_balance_score: 9, run_time_minutes: 10, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-14", steps: 10300, meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-15", steps: 8700,  meal_balance_score: 6, run_time_minutes: 0,  source: "mock" },

  // Priya (player2)
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-09", steps: 8500,  meal_balance_score: 6, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-10", steps: 10200, meal_balance_score: 7, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-11", steps: 9100,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-12", steps: 8800,  meal_balance_score: 8, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-13", steps: 11500, meal_balance_score: 6, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-14", steps: 9700,  meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-15", steps: 8200,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },

  // Wei Ming (player3)
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-09", steps: 9800,  meal_balance_score: 8, run_time_minutes: 0,  source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-10", steps: 8900,  meal_balance_score: 7, run_time_minutes: 20, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-11", steps: 11200, meal_balance_score: 9, run_time_minutes: 0,  source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-12", steps: 7500,  meal_balance_score: 6, run_time_minutes: 15, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-13", steps: 10100, meal_balance_score: 7, run_time_minutes: 10, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-14", steps: 12300, meal_balance_score: 8, run_time_minutes: 15, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-15", steps: 9400,  meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },

  // Siti (player4)
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-09", steps: 7200,  meal_balance_score: 4, run_time_minutes: 0,  source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-10", steps: 6800,  meal_balance_score: 3, run_time_minutes: 10, source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-11", steps: 8100,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-12", steps: 9200,  meal_balance_score: 4, run_time_minutes: 10, source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-13", steps: 7600,  meal_balance_score: 3, run_time_minutes: 0,  source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-14", steps: 6400,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },
  { player_id: "player4", league_id: "sg-league-001", date: "2026-03-15", steps: 7300,  meal_balance_score: 4, run_time_minutes: 0,  source: "mock" },
];

// Pre-computed standings (sorted by final_score DESC)
// Score formula: steps_score(0-40) + meal_score(0-40) + activity_score(0-20) × age_multiplier
export const MOCK_STANDINGS: StandingsEntry[] = [
  {
    rank: 1,
    player_id: "player3",
    name: "Wei Ming",
    total_steps: 69200,
    avg_meal_balance: 7.43,
    total_run_mins: 60,
    days_active: 7,
    raw_score: 77.4,
    final_score: 77.4,
    age_adjusted: false,
    badge: "Kiasu Champion 🏆",
  },
  {
    rank: 2,
    player_id: "player1",
    name: "Ahmad",
    total_steps: 72500,
    avg_meal_balance: 7.14,
    total_run_mins: 45,
    days_active: 7,
    raw_score: 74.5,
    final_score: 74.5,
    age_adjusted: false,
    badge: "Most Improved 📈",
  },
  {
    rank: 3,
    player_id: "player2",
    name: "Priya",
    total_steps: 66000,
    avg_meal_balance: 6.29,
    total_run_mins: 30,
    days_active: 7,
    raw_score: 65.4,
    final_score: 65.4,
    age_adjusted: false,
    badge: "Healthy Kaki 🥗",
  },
  {
    rank: 4,
    player_id: "player4",
    name: "Siti",
    total_steps: 52600,
    avg_meal_balance: 4.0,
    total_run_mins: 20,
    days_active: 7,
    raw_score: 51.2,
    final_score: 56.3,  // × 1.1 age multiplier (age 51)
    age_adjusted: true,
    badge: "Steady Lah 🔥",
  },
];

// Example photo analysis response (returned by Agent Builder or as fallback)
export const MOCK_MEAL_RESULT: MealPhotoResult = {
  player_id: "unknown",
  calories: 780,
  balance_score: 3,
  meal_balance_score: 3,
  tip: "High sodium detected — swap skin-on chicken for soup to cut ~200 kcal and reduce sodium.",
  hawker_detected: true,
  calories_estimate: 780,
  balance_tip: "Try economy rice with more vegetables next time.",
  agent_commentary: "Looks like a typical kopitiam meal — not bad, but the fried options are dragging your balance score down.",
  league_score_entry: { meal_balance_score: 3 },
};

export const MOCK_MENTAIKO_SALMON: MealPhotoResult = {
  player_id: "unknown",
  calories: 520,
  balance_score: 8,
  meal_balance_score: 8,
  tip: "Excellent choice! The salmon provides Omega-3s, and the seaweed/pickles add micronutrients without many calories. Watch the mentaiko sauce portion to keep fats in check.",
  hawker_detected: false,
  calories_estimate: 520,
  balance_tip: "Swap white rice for brown rice next time for even better sustained energy.",
  agent_commentary: "I see a delicious Mentaiko Salmon dish! 🍣 The protein-to-veg ratio is solid thanks to those pickles and seaweed. A very balanced meal that keeps you in the Kiasu Champion race!",
  league_score_entry: { meal_balance_score: 8 },
};

/**
 * Enhanced Mock Bot Responses for DM /ask Queries
 * Organized by common query types (steps, activity, weight, nutrition)
 */
export const MOCK_ASK_RESPONSES = {
  steps: 
    "Wah, you're doing steady lah! 🏃‍♂️\n\n" +
    "*Your Trends (Past 7 Days):*\n" +
    "• Average Steps: 10,245 (Up 15% from last week!)\n" +
    "• Most Active: Wednesday (14,200 steps at MacRitchie Treetop Walk)\n\n" +
    "You're currently *Rank #2* in your league. Ahmad is only 5 points ahead of you! 🏆\n\n" +
    "*Recommendation:* Since you're near Ang Mo Kio, why not try the *AMK Heritage Trail* later? It's a nice 4km loop that'll help you overtake Ahmad by tonight. Don't play play! 🔥",
    
  activity:
    "Strong effort this week! 🏸\n\n" +
    "You've clocked **145 active minutes**, mostly from your badminton session at *Tampines Hub* on Tuesday.\n\n" +
    "Actually, you're only *30 mins away* from hitting your weekly intensity goal. If you hit the *Bedok Reservoir* for a quick jog tomorrow morning, you'll earn the 'Weekend Warrior' badge. Steady, can one! 🦾",

  weight:
    "Body weight is just one number, don't stress too much! ⚖️\n\n" +
    "I see your weight has stayed constant at 72kg, but your **step count and run volume are trending up**. This is good — focusing on the habits is how you win the long game.\n\n" +
    "Remember: Siti (your league kaki) is 51 and still hitting 10k steps daily. If she can, you also can! Why not try a light swim at **Jurong East Swimming Complex** this weekend? 🏊‍♂️",

  nutrition:
    "Your meal balance is improving! 🥗\n\n" +
    "Average score: **6.8/10** (last week was 5.2/10).\n" +
    "I noticed you're eating more at *hawker centres* lately. Pro-tip: At the *Maxwell Food Centre*, look for the 'Healthier Choice' logo! \n\n" +
    "Swap one 'Fried Kway Teow' for a 'Slicied Fish Soup' and you'll climb to Rank #1 for the nutrition category. Let's go! 🚀",

  default: 
    "Steady lah! Everything is looking good. You're *Rank #2* and only a few points behind the leader. Just keep hitting your steps and logging those healthy meals. Kiasu spirit on! 🔥"
};

// Legacy for backward compatibility
export const MOCK_HEALTH_QUERY_RESPONSE = MOCK_ASK_RESPONSES.steps;
