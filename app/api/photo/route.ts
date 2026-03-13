import { NextResponse } from "next/server";
import { MOCK_MEAL_RESULT } from "@/lib/mock";

// POST /api/photo
// Test/fallback endpoint only.
//
// In production, meal photo analysis is performed by MealAnalyzerAgent inside Elastic Agent Builder
// (Amazon Bedrock Claude Haiku, configured as a Kibana tool). The bot calls HealthCoachAgent A2A
// directly — this route is never called by Agent Builder in the live flow.
//
// Use this route to:
//   • Verify the API is reachable during Prep Day
//   • Test Agent Builder tool connectivity (Tool 1 in KiasuRefereeAgent)
//   • Provide a static fallback response if Bedrock is unavailable
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      photo_url?: string;
      player_id?: string;
      league_id?: string;
    };

    // Return mock analysis — Bedrock sees the real image inside Kibana
    return NextResponse.json({
      player_id: body.player_id ?? "unknown",
      meal_balance_score: MOCK_MEAL_RESULT.balance_score,
      calories_estimate: MOCK_MEAL_RESULT.calories,
      balance_tip: MOCK_MEAL_RESULT.tip,
      agent_commentary: MOCK_MEAL_RESULT.agent_commentary,
      hawker_detected: MOCK_MEAL_RESULT.hawker_detected,
    });
  } catch {
    return NextResponse.json({
      player_id: "unknown",
      meal_balance_score: MOCK_MEAL_RESULT.balance_score,
      calories_estimate: MOCK_MEAL_RESULT.calories,
      balance_tip: MOCK_MEAL_RESULT.tip,
      agent_commentary: MOCK_MEAL_RESULT.agent_commentary,
      hawker_detected: MOCK_MEAL_RESULT.hawker_detected,
    });
  }
}
