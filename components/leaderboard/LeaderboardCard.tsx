"use client";

import { cn } from "@/lib/utils";
import type { StandingsEntry } from "@/lib/types";
import { useState, useEffect } from "react";

interface LeaderboardCardProps {
  entry: StandingsEntry;
  maxScore: number;
  isReveal?: boolean;
}

const RANK_COLORS: Record<number, string> = {
  1: "text-jasmine",
  2: "text-muted-teal",
  3: "text-light-bronze",
};

export function LeaderboardCard({ entry, maxScore, isReveal = false }: LeaderboardCardProps) {
  const [mounted, setMounted] = useState(false);
  const pct = Math.min((entry.final_score / Math.max(maxScore, 1)) * 100, 100);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  const rankColor = RANK_COLORS[entry.rank] ?? "text-charcoal-blue";
  const isChampion = entry.rank === 1;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-lg border transition-all duration-150",
        isReveal
          ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
          : "bg-papaya-whip border-jasmine hover:bg-warm-sand",
        isChampion && !isReveal && "champion-glow",
        isChampion && isReveal && "border-jasmine/50"
      )}
    >
      {/* Rank */}
      <span
        className={cn(
          "font-mono font-bold text-4xl w-12 text-center shrink-0 leading-none",
          isReveal ? (isChampion ? "text-jasmine" : "text-white/60") : rankColor
        )}
      >
        #{entry.rank}
      </span>

      {/* Player info + progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "font-sans font-semibold text-base truncate",
                isReveal ? "text-white" : "text-charcoal-blue"
              )}
            >
              {entry.name}
            </span>
            {entry.age_adjusted && (
              <span
                className={cn(
                  "text-[10px] font-mono px-1.5 py-0.5 rounded-full border tracking-tight",
                  isReveal 
                    ? "bg-white/10 text-white border-white/20" 
                    : "bg-verdigris/10 text-verdigris border-verdigris/20"
                )}
                title={`Pioneer Bonus: ${entry.age_multiplier}x multiplier applied for ages 40+`}
              >
                Pioneer Bonus
              </span>
            )}
          </div>
          <span
            className={cn(
              "font-mono font-bold text-xl shrink-0 ml-2 tabular-nums",
              isReveal ? "text-white" : "text-charcoal-blue"
            )}
          >
            {entry.final_score.toFixed(1)} pts
          </span>
        </div>

        {/* Progress bar */}
        <div
          className={cn(
            "h-1.5 rounded-full overflow-hidden mb-1.5",
            isReveal ? "bg-white/10" : "bg-warm-sand"
          )}
        >
          <div
            className={cn(
              "h-full rounded-full progress-fill",
              isReveal ? "bg-verdigris" : "bg-verdigris"
            )}
            style={{ width: mounted ? `${pct}%` : "0%" }}
          />
        </div>

        {/* Sub-stats */}
        <div
          className={cn(
            "flex items-center gap-3 text-xs font-mono",
            isReveal ? "text-white/50" : "text-muted-teal"
          )}
        >
          <span>{entry.total_steps.toLocaleString()} steps</span>
          <span>{entry.avg_meal_balance.toFixed(1)}/10 meal</span>
          {entry.total_run_mins > 0 && <span>{entry.total_run_mins} min run</span>}
          {entry.badge && (
            <span
              className={cn(
                "font-sans font-semibold ml-auto",
                isReveal ? "text-jasmine" : "text-burnt-peach"
              )}
            >
              {entry.badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
