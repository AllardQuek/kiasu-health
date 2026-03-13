import { NextResponse } from "next/server";
import { getStandings } from "@/lib/elastic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ league_id: string }> }
) {
  const { league_id } = await params;

  const weekStart = getWeekStart();
  const standings = await getStandings(league_id);

  return NextResponse.json({
    league_id,
    week_start: weekStart,
    generated_at: new Date().toISOString(),
    standings,
  });
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  // Monday = start of week
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}
