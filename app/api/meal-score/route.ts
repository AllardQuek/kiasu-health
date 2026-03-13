import { NextResponse } from "next/server";
import { writeMealScore } from "@/lib/elastic";

// POST /api/meal-score
// Accepts: { player_id, league_id, meal_balance_score, week_start_date }
// ONLY writes the balance score to Elastic — never photo_url, calories, or nutrition details
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      player_id?: string;
      league_id?: string;
      meal_balance_score?: number;
      week_start_date?: string;
    };

    const { player_id, league_id, meal_balance_score, week_start_date } = body;

    if (!player_id || !league_id || meal_balance_score === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: player_id, league_id, meal_balance_score" },
        { status: 400 }
      );
    }

    // Validate score range
    const score = Math.max(0, Math.min(10, meal_balance_score));
    const weekStart = week_start_date ?? new Date().toISOString().split("T")[0];

    await writeMealScore(player_id, league_id, score, weekStart);

    return NextResponse.json({
      success: true,
      player_id,
      score_recorded: score,
    });
  } catch (err) {
    console.error("[api/meal-score] error:", err);
    return NextResponse.json({ success: false, error: "Failed to record score" }, { status: 500 });
  }
}
