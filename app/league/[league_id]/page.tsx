import { notFound } from "next/navigation";
import Link from "next/link";
import { LeagueTable } from "@/components/leaderboard/LeagueTable";
import { MetricCard } from "@/components/stats/MetricCard";
import { Footprints, Utensils, Timer, Trophy, RefreshCw } from "lucide-react";
import type { StandingsEntry } from "@/lib/types";

interface LeaguePageProps {
  params: Promise<{ league_id: string }>;
}

async function fetchStandings(leagueId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/standings/${leagueId}`, {
      next: { revalidate: 30 }, // ISR: refresh every 30s
    });
    if (!res.ok) throw new Error("Failed to fetch standings");
    return await res.json() as { standings: StandingsEntry[]; league_id: string; week_start: string };
  } catch {
    // Fallback to direct import of mock data
    const { MOCK_STANDINGS } = await import("@/lib/mock");
    return {
      standings: MOCK_STANDINGS,
      league_id: leagueId,
      week_start: "2026-03-09",
    };
  }
}

export default async function LeaguePage({ params }: LeaguePageProps) {
  const { league_id } = await params;
  const data = await fetchStandings(league_id);
  const { standings } = data;
  const top = standings[0];

  if (standings.length === 0) notFound();

  const weekLabel = formatWeek(data.week_start);

  return (
    <div className="min-h-screen bg-cornsilk">
      {/* Nav */}
      <nav className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between border-b border-jasmine/30">
        <Link href="/" className="font-sans font-extrabold text-xl leading-none">
          <span className="text-charcoal-blue">Kiasu</span>
          <span className="text-verdigris">Health</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono uppercase tracking-wide text-muted-teal hidden sm:block">
            {weekLabel}
          </span>
          <Link
            href={`/league/${league_id}/reveal`}
            className="inline-flex items-center gap-1.5 text-sm font-sans font-medium bg-burnt-peach hover:bg-verdigris text-white px-4 py-2 rounded-lg transition-colors duration-150"
          >
            <Trophy size={14} strokeWidth={1.5} />
            Reveal
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-sans font-medium uppercase tracking-widest text-muted-teal mb-1">
                League · {league_id}
              </p>
              <h1 className="font-sans font-bold text-3xl text-charcoal-blue">
                Weekly Standings
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-sans text-muted-teal">
              <RefreshCw size={12} strokeWidth={1.5} />
              <span>Auto-refreshes every 30s</span>
            </div>
          </div>
        </div>

        {/* Leaderboard (client — animated) */}
        <LeagueTable standings={standings} leagueId={league_id} />

        {/* Top player metrics */}
        {top && (
          <div className="mt-10">
            <p className="text-xs font-sans font-medium uppercase tracking-widest text-muted-teal mb-4">
              Leader · {top.name}&apos;s Week
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Steps This Week"
                value={top.total_steps}
                unit="steps"
                target={70000}
                targetLabel="70k goal"
                icon={<Footprints size={16} strokeWidth={1.5} />}
              />
              <MetricCard
                label="Meal Balance"
                value={top.avg_meal_balance.toFixed(1)}
                unit="/ 10"
                target={10}
                targetLabel="perfect balance"
                icon={<Utensils size={16} strokeWidth={1.5} />}
              />
              <MetricCard
                label="Run Time"
                value={top.total_run_mins}
                unit="min"
                target={150}
                targetLabel="150 min goal"
                icon={<Timer size={16} strokeWidth={1.5} />}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function formatWeek(weekStart: string): string {
  try {
    const d = new Date(weekStart + "T00:00:00");
    return `Week of ${d.toLocaleDateString("en-SG", { day: "numeric", month: "short" })}`;
  } catch {
    return "Current Week";
  }
}
