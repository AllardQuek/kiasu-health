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

  // Standard top-down reveal: rank 1, 2, 3...
  const revealOrder = [...standings].sort((a, b) => a.rank - b.rank);
  const champion = standings.find((s) => s.rank === 1);

  // Glow appears immediately for the first card (rank 1)
  const championDelay = 0.5;
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

      {/* Champion Celebration Section */}
      {champion && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ 
            opacity: 1, 
            scale: 1, 
            y: 0,
            boxShadow: ["0px 0px 0px rgba(233,196,106,0)", "0px 0px 40px rgba(233,196,106,0.2)", "0px 0px 20px rgba(233,196,106,0.1)"]
          }}
          transition={{ 
            delay: championDelay + 0.3, 
            duration: 0.8,
            ease: "easeOut"
          }}
          className="relative overflow-hidden mt-8 p-8 rounded-2xl border-2 border-jasmine/50 bg-gradient-to-br from-charcoal-blue/80 to-slate-teal/50 backdrop-blur-md"
        >
          {/* Decorative Winner Badge */}
          <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
            <div className="absolute top-4 -right-8 bg-burnt-peach text-white font-mono font-bold px-10 py-1.5 rotate-45 shadow-lg border-b-2 border-white/20 z-10 text-[10px] tracking-[0.2em] flex items-center justify-center">
              CHAMPION
            </div>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-jasmine mb-2">
              The Week&apos;s King/Queen
            </p>
            <h2 className="text-4xl font-sans font-black text-white mb-2 tracking-tight uppercase">
              {champion.name}
            </h2>
            
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-7xl font-mono font-black text-jasmine tabular-nums leading-none">
                <CountUp target={Math.round(champion.final_score)} duration={2} />
              </span>
              <span className="text-sm font-mono text-jasmine/60 uppercase tracking-tighter">points</span>
            </div>

            {/* The Reward / Social Stakes */}
            <div className="w-full bg-white/5 rounded-xl p-5 border border-white/10 relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-charcoal-blue px-3 py-0.5 border border-white/10 rounded-full text-[9px] font-mono text-muted-teal uppercase tracking-widest">
                The Prize
              </div>
              <p className="text-xl font-sans font-bold text-verdigris leading-tight">
                🏆 {reward || "Kakis buy you a Salmon Bowl lunch!"}
              </p>
              <p className="text-[11px] font-sans text-white/40 mt-2 italic px-4">
                Redeem this at tomorrow&apos;s lunch. No escape!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Accountability / Stragglers nudge */}
      {standings.length > 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: (revealOrder.length - 1) * 0.3 + 0.5, duration: 1 }}
          className="mt-6 pt-6 border-t border-white/5 text-center px-4"
        >
          <p className="text-[10px] font-mono text-muted-teal uppercase tracking-[0.2em] mb-3">
            Wait, don&apos;t forget...
          </p>
          <div className="inline-flex items-center gap-2 bg-burnt-peach/10 border border-burnt-peach/20 px-4 py-2 rounded-full">
            <span className="text-xs font-sans text-white/70">
              🚨 <span className="font-bold text-burnt-peach">{standings[standings.length - 1].name}</span> is buying the Kopi-O Kosong round tomorrow.
            </span>
          </div>
          <p className="text-[9px] font-mono text-white/30 mt-3 italic">
            &quot;Sian, next week better exercise more.&quot;
          </p>
        </motion.div>
      )}
    </div>
  );
}
