// ─── KiasuHealth Mock Data ───────────────────────────────────────────────────
// 4 seed players × 7 days (Mon 9 Mar – Sun 15 Mar 2026)
// Used as fallback whenever Elastic or Agent Builder is unavailable.

import type { Player, WeeklyMetric, StandingsEntry, MealPhotoResult } from "./types";

export const MOCK_PLAYERS: Player[] = [
  { player_id: "player1", name: "Chris",    league_id: "sg-league-001", age: 35, gender: "M", home_location: { lat: 1.365, lon: 103.820 }, total_wins: 1 },
  { player_id: "player2", name: "Komal",    league_id: "sg-league-001", age: 42, gender: "F", home_location: { lat: 1.353, lon: 103.943 }, total_wins: 0 },
  { player_id: "player3", name: "Nick",     league_id: "sg-league-001", age: 28, gender: "M", home_location: { lat: 1.422, lon: 103.827 }, total_wins: 2 },
  { player_id: "player4", name: "Gaby",     league_id: "sg-league-001", age: 51, gender: "F", home_location: { lat: 1.345, lon: 103.740 }, total_wins: 0 },
];

// 7-Day metrics (Mon 9 Mar – Sun 15 Mar 2026)
// run_time_minutes: Chris 45, Komal 30, Nick 60, Gaby 20 (totals split across days)
export const MOCK_METRICS: WeeklyMetric[] = [
  // Chris (player1)
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-09", steps: 11200, meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-10", steps: 9500,  meal_balance_score: 6, run_time_minutes: 15, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-11", steps: 10800, meal_balance_score: 8, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-12", steps: 12100, meal_balance_score: 7, run_time_minutes: 20, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-13", steps: 9900,  meal_balance_score: 9, run_time_minutes: 10, source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-14", steps: 10300, meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player1", league_id: "sg-league-001", date: "2026-03-15", steps: 8700,  meal_balance_score: 6, run_time_minutes: 0,  source: "mock" },

  // Komal (player2)
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-09", steps: 8500,  meal_balance_score: 6, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-10", steps: 10200, meal_balance_score: 7, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-11", steps: 9100,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-12", steps: 8800,  meal_balance_score: 8, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-13", steps: 11500, meal_balance_score: 6, run_time_minutes: 10, source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-14", steps: 9700,  meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },
  { player_id: "player2", league_id: "sg-league-001", date: "2026-03-15", steps: 8200,  meal_balance_score: 5, run_time_minutes: 0,  source: "mock" },

  // Nick (player3)
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-09", steps: 9800,  meal_balance_score: 8, run_time_minutes: 0,  source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-10", steps: 8900,  meal_balance_score: 7, run_time_minutes: 20, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-11", steps: 11200, meal_balance_score: 9, run_time_minutes: 0,  source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-12", steps: 7500,  meal_balance_score: 6, run_time_minutes: 15, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-13", steps: 10100, meal_balance_score: 7, run_time_minutes: 10, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-14", steps: 12300, meal_balance_score: 8, run_time_minutes: 15, source: "mock" },
  { player_id: "player3", league_id: "sg-league-001", date: "2026-03-15", steps: 9400,  meal_balance_score: 7, run_time_minutes: 0,  source: "mock" },

  // Gaby (player4)
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
    player_id: "player1",
    name: "Chris",
    total_steps: 72500,
    avg_meal_balance: 7.14,
    total_run_mins: 45,
    days_active: 7,
    raw_score: 82.5,
    final_score: 82.5,
    age_adjusted: false,
    badge: "Kiasu Champion 🏆",
  },
  {
    rank: 2,
    player_id: "player3",
    name: "Nick",
    total_steps: 69200,
    avg_meal_balance: 7.43,
    total_run_mins: 60,
    days_active: 7,
    raw_score: 77.4,
    final_score: 77.4,
    age_adjusted: false,
    badge: "Most Improved 📈",
  },
  {
    rank: 3,
    player_id: "player2",
    name: "Komal",
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
    name: "Gaby",
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
  tip: "Aiyoh, too oily lah! Swap that fried stuff for some soup or steamed fish. We want a Healthier SG, and that starts with your plate. Cutting ~200 calories is a win!",
  hawker_detected: true,
  calories_estimate: 780,
  balance_tip: "Try economy rice but take 2 veg and 1 steamed meat. Less curry sauce, more success. Follow the Healthier Choice logos!",
  agent_commentary: "Uncle Ong see your plate... wah, deep fried food again. We need to make sustainable changes for your long-term health. Don't let the calorie count 'chiong' too high!",
  league_score_entry: { meal_balance_score: 3 },
};

export const MOCK_MENTAIKO_SALMON: MealPhotoResult = {
  player_id: "unknown",
  calories: 520,
  balance_score: 8,
  meal_balance_score: 8,
  estimates: {
    protein: "32g",
    carbs: "45g",
    fat: "22g",
    fiber: "4g"
  },
  tip: "Very good choice! Mentaiko high in fat but salmon is healthy oil. This is exactly what we mean by a balanced diet. Ask for less sauce next time, then even better. Keep it up!",
  hawker_detected: false,
  calories_estimate: 520,
  balance_tip: "Brown rice is your best friend for fiber. This is how we build a Healthier SG, one meal at a time!",
  agent_commentary: "Wah, premium leh! 🍣 Uncle Ong approves this Mentaiko Salmon. Good balance, and plenty of protein. This is the Healthier Choice in action. You're leading by example!",
  league_score_entry: { meal_balance_score: 8 },
};

/**
 * Enhanced Mock Bot Responses for DM /ask Queries
 * Organized by common query types (steps, activity, weight, nutrition)
 */
export const MOCK_ASK_RESPONSES = {
  steps: 
    "Wah, you're doing steady lah! 🏃‍♂️ We are building a Healthier SG together.\n\n" +
    "*Your Trends (Past 7 Days):*\n" +
    "• Average Steps: 10,245 (Up 15%! This is the kind of progress we need!)\n" +
    "• Most Active: Wednesday (MacRitchie Treetop Walk - a great place for health!)\n\n" +
    "You're currently *Rank #2*. Nick is only 5 points ahead. 🏆\n\n" +
    "*Minister's Advice:* Why not take the *AMK Heritage Trail* later? It's good for the soul and the heart. Let's make every step count! 🔥",
    
  activity:
    "Strong effort this week! 🏸 Uncle Ong is proud to see your commitment to an active lifestyle.\n\n" +
    "You've clocked **145 active minutes**, mostly from your session at *Tampines Hub*.\n\n" +
    "Listen ah, you're only *30 mins away* from hitting our national goal. Go to *Bedok Reservoir* tomorrow. Remember: our health is our responsibility. Don't be the one treating the kakis Kopi and Kaya Toast on Monday! ☕️🍞",

  weight:
    "Weight is just one indicator, focus on the overall health journey. ⚖️ Uncle also watching his health closely.\n\n" +
    "Your weight is steady at 72kg, but your habits are improving. That's the key. \n\n" +
    "Gaby is hit 10k steps daily at age 51. If she can lead a Healthier SG, you also can! Go for a swim at **Jurong East** this weekend? Focus on the fitness, and the results will follow! 🍱",

  nutrition:
    "Uncle Ong see your nutrition scores improving! 🥗 This is the foundation of a healthy life.\n\n" +
    "Average score: **6.8/10**. \n" +
    "When at hawker centres, look for the 'Healthier Choice' logo! Maxwell Food Centre has many good options. \n\n" +
    "Swap 'Fried Kway Teow' for 'Sliced Fish Soup'. Your rank will rise, and your health will too. Huat ah! 🚀",

  kakibash:
    "Eh, you want the progress report on your kakis? 🧐 Transparency helps everyone improve.\n\n" +
    "*Uncle's Intelligence:* \n" +
    "• **Chris** is 'Chionging' — he's leading the way for Healthier SG today! \n" +
    "• **Gaby** with the economy rice (Score: 9/10). She's making very wise choices.\n" +
    "• **Nick** is consistent. Consistency is how we transform our health.\n\n" +
    "*Uncle's Pro-tip:* 20 mins at **ActiveSG Gym** tonight will secure your lead. Let's build healthy habits, not just temporary scores! 🏆",

  nearby:
    "Near **Marina Bay**? 🌉 It's a beautiful place for a Healthier SG walk.\n\n" +
    "Your activity score needs a small boost. Go to the **Waterfront Promenade** now. \n\n" +
    "🚶‍♂️ **Uncle's Challenge:** A full loop is ~3.5km. \n" +
    "🔥 **The Stakes:** Finish it, and you're leading the charge for health. If not, don't complain when you have to buy Chris's lunch! \n\n" +
    "Get moving for a Healthier SG! 🏢",

  default: 
    "Steady lah! We are making progress. You're *Rank #2* and leading the way for your kakis. Uncle Ong is with you. Healthier SG starts now! 🔥"
};

// Legacy for backward compatibility
export const MOCK_HEALTH_QUERY_RESPONSE = MOCK_ASK_RESPONSES.steps;
