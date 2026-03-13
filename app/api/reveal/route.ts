import { NextResponse } from "next/server";
import { getStandings } from "@/lib/elastic";
import { callRefereeAgent } from "@/lib/agent";
import { MOCK_STANDINGS } from "@/lib/mock";

// POST /api/reveal
// Accepts: { league_id, week_start_date }
// Returns standings + winner + loser nudge + reveal message + badges
export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      league_id?: string;
      week_start_date?: string;
    };

    const league_id = body.league_id ?? process.env.DEFAULT_LEAGUE_ID ?? "sg-league-001";
    const week_start_date = body.week_start_date ?? new Date().toISOString().split("T")[0];

    // Step 1: Get standings from Elastic
    const standings = await getStandings(league_id);

    // Step 2: Call KiasuRefereeAgent A2A chain
    const agentResult = await callRefereeAgent({
      league_id,
      week_start_date,
    });

    const winner = standings[0];
    const loser = standings[standings.length - 1];

    return NextResponse.json({
      standings,
      winner: winner
        ? { name: winner.name, score: winner.final_score, badge: winner.badge }
        : null,
      loser_nudge: agentResult.nudge ?? `${loser?.name} — keep pushing this week!`,
      reveal_message: agentResult.standings_text ?? buildRevealText(standings),
      badges: standings.map((s) => ({ player_id: s.player_id, badge: s.badge })),
      reward: agentResult.reward ?? "Free healthier kopi for the winner ☕",
    });
  } catch (err) {
    console.error("[api/reveal] error:", err);
    return NextResponse.json({
      standings: MOCK_STANDINGS,
      winner: { name: "Zing", score: 77.4, badge: "Kiasu Champion 🏆" },
      loser_nudge: "Siti — steps were solid but meal balance dragged you down.",
      reveal_message: buildRevealText(MOCK_STANDINGS),
      badges: MOCK_STANDINGS.map((s) => ({ player_id: s.player_id, badge: s.badge })),
      reward: "Free healthier kopi for the winner ☕",
    });
  }
}

function buildRevealText(standings: typeof MOCK_STANDINGS): string {
  const rows = standings
    .map((s) => `#${s.rank} ${s.name.padEnd(12)} ${s.final_score.toFixed(1)} pts  ${s.badge ?? ""}`)
    .join("\n");
  return `🏆 *Week Reveal — League Challenge*\n\n${rows}\n\nResults powered by KiasuHealth 🇸🇬`;
}
