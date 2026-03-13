"use client";

import { RevealSequence } from "@/components/leaderboard/RevealSequence";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { StandingsEntry } from "@/lib/types";
import { MOCK_STANDINGS } from "@/lib/mock";

interface RevealData {
  standings: StandingsEntry[];
  winner?: { name: string; score: number; badge?: string };
  reveal_message?: string;
  loser_nudge?: string;
  reward?: string;
}

interface RevealPageProps {
  params: Promise<{ league_id: string }>;
}

export default function RevealPage({ params }: RevealPageProps) {
  const [data, setData] = useState<RevealData | null>(null);
  const [leagueId, setLeagueId] = useState("sg-league-001");

  useEffect(() => {
    params.then((p) => {
      setLeagueId(p.league_id);
      fetchReveal(p.league_id);
    });
  }, [params]);

  async function fetchReveal(lgId: string) {
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ league_id: lgId }),
      });
      if (!res.ok) throw new Error("Reveal failed");
      const json = await res.json() as RevealData;
      setData(json);
    } catch {
      // Fallback to mock
      setData({
        standings: MOCK_STANDINGS,
        winner: { name: "Zing", score: 77.4, badge: "Kiasu Champion 🏆" },
        reward: "Free healthier kopi for a week ☕",
        loser_nudge: "Siti — steps were solid but meal balance dragged you down.",
      });
    }
  }

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: "#264653" }} // charcoal-blue — cinematic dark
    >
      {/* Subtle radial gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(42,157,143,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 max-w-3xl mx-auto px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-sans font-extrabold text-lg leading-none">
          <span className="text-white/90">Kiasu</span>
          <span className="text-verdigris">Health</span>
        </Link>
        <Link
          href={`/league/${leagueId}`}
          className="text-sm font-sans text-white/50 hover:text-white/80 transition-colors"
        >
          ← Back to standings
        </Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-8 pt-4 pb-20">
        {data ? (
          <RevealSequence
            standings={data.standings}
            winnerName={data.winner?.name}
            reward={data.reward}
          />
        ) : (
          <div className="flex items-center justify-center py-32">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-verdigris border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-sans text-white/50">Loading reveal...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
