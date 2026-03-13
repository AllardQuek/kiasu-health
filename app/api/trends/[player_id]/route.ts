import { NextResponse } from "next/server";
import { getPlayerTrends, getNearbyVenues } from "@/lib/elastic";

// GET /api/trends/[player_id]?league_id=sg-league-001
//
// Used by the DataAggregatorAgent (Kibana tool: get_player_metrics) to give
// HealthCoachAgent and KiasuRefereeAgent trend context about each player.
//
// Returns: current week vs previous week metrics + deltas + coaching_focus + nearby_suggestion.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ player_id: string }> }
) {
  const { player_id } = await params;
  const { searchParams } = new URL(request.url);
  const league_id = searchParams.get("league_id") ?? process.env.DEFAULT_LEAGUE_ID ?? "sg-league-001";

  const trends = await getPlayerTrends(player_id, league_id);
  const nearby_suggestion = await getNearbyVenues(player_id, trends.coaching_focus);

  return NextResponse.json({ ...trends, nearby_suggestion });
}
