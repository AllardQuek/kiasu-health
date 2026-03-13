"use client";

import { motion } from "framer-motion";
import { LeaderboardCard } from "./LeaderboardCard";
import type { StandingsEntry } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface LeagueTableProps {
  standings: StandingsEntry[];
  leagueId?: string;
}

export function LeagueTable({ standings }: LeagueTableProps) {
  const router = useRouter();
  const maxScore = Math.max(...standings.map((s) => s.final_score), 1);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-teal font-sans">
        No standings yet. Seed some data to get started.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {standings.map((entry, index) => (
        <motion.div
          key={entry.player_id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.06,
            duration: 0.35,
            ease: "easeOut",
          }}
        >
          <LeaderboardCard entry={entry} maxScore={maxScore} />
        </motion.div>
      ))}
    </div>
  );
}
