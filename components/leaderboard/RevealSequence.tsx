"use client";

import { motion } from "framer-motion";
import { LeaderboardCard } from "./LeaderboardCard";
import type { StandingsEntry } from "@/lib/types";
import { useState, useEffect } from "react";

interface RevealSequenceProps {
  standings: StandingsEntry[];
  winnerName?: string;
  reward?: string;
}

function CountUp({ target, duration = 1.5 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <span>{count.toLocaleString()}</span>;
}

export function RevealSequence({ standings, reward }: RevealSequenceProps) {
  const [champGlow, setChampGlow] = useState(false);
  const maxScore = Math.max(...standings.map((s) => s.final_score), 1);

  // Reverse for reveal: last to first
  const revealOrder = [...standings].sort((a, b) => b.rank - a.rank);
  const champion = standings.find((s) => s.rank === 1);

  // Glow appears after champion entrance (delay: (n-1) * 0.3 + 0.5 + 0.2s)
  const championDelay = (revealOrder.length - 1) * 0.3 + 0.5 + 0.2;
  useEffect(() => {
    const t = setTimeout(() => setChampGlow(true), championDelay * 1000);
    return () => clearTimeout(t);
  }, [championDelay]);

  return (
    <div className="flex flex-col gap-4">
      {/* Reveal header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center mb-2"
      >
        <p className="text-xs font-mono uppercase tracking-widest text-muted-teal mb-1">
          Sunday Reveal
        </p>
        <h1 className="text-3xl font-sans font-bold text-white">
          Week&apos;s Results
        </h1>
      </motion.div>

      {/* Cards in reverse order */}
      {revealOrder.map((entry, index) => {
        const isChamp = entry.rank === 1;
        return (
          <motion.div
            key={entry.player_id}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isChamp && champGlow ? 1.02 : 1,
            }}
            transition={{
              delay: index * 0.3,
              duration: 0.5,
              ease: "easeOut",
              scale: { delay: isChamp ? championDelay : 0, duration: 0.2 },
            }}
            className={isChamp && champGlow ? "champion-glow rounded-lg" : ""}
          >
            <LeaderboardCard entry={entry} maxScore={maxScore} isReveal />
          </motion.div>
        );
      })}

      {/* Champion score count-up */}
      {champion && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: championDelay + 0.3, duration: 0.5 }}
          className="text-center mt-4 p-6 rounded-xl border border-jasmine/30 bg-white/5"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-muted-teal mb-1">
            Winning Score
          </p>
          <p className="text-6xl font-mono font-bold text-jasmine tabular-nums">
            <CountUp target={champion.final_score} duration={1.5} />
          </p>
          <p className="text-sm font-sans text-white/70 mt-1">points — {champion.name}</p>
          {reward && (
            <p className="text-sm font-sans text-verdigris mt-3 font-semibold">{reward}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}
