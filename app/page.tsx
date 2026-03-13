"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Users, ChevronRight, Footprints, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

const PREVIEW_STANDINGS = [
  { rank: 1, name: "Nick",     score: 77.4, steps: 69200, meal: 7.4, badge: "Kiasu Champion", pct: 100 },
  { rank: 2, name: "Chris",    score: 74.5, steps: 72500, meal: 7.1, badge: "Most Improved",  pct: 96  },
  { rank: 3, name: "Komal",    score: 65.4, steps: 66000, meal: 6.3, badge: "Healthy Kaki",   pct: 84  },
  { rank: 4, name: "Gaby",     score: 56.3, steps: 52600, meal: 4.0, badge: "Steady Lah",     pct: 68  },
];

const RANK_COLOR: Record<number, string> = {
  1: "text-jasmine",
  2: "text-muted-teal",
  3: "text-light-bronze",
  4: "text-slate-teal",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-cornsilk flex flex-col">
      {/* Nav */}
      <header className="w-full border-b border-jasmine/40">
        <nav className="max-w-5xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="font-sans font-extrabold text-xl leading-none">
            <span className="text-charcoal-blue">Kiasu</span>
            <span className="text-verdigris">Health</span>
          </div>
          <Link
            href="/league/sg-league-001"
            className="text-sm font-sans font-medium text-slate-teal hover:text-charcoal-blue transition-colors"
          >
            League &rarr;
          </Link>
        </nav>
      </header>

      {/* Hero - split layout */}
      <main className="max-w-5xl w-full mx-auto px-8 pt-12 pb-24 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left: copy + CTAs */}
          <div className="pt-4">
            <p className="text-xs font-sans font-medium uppercase tracking-widest text-muted-teal mb-5">
              Singapore &middot; Weekly Health Challenge
            </p>
            <h1 className="font-sans font-extrabold text-5xl leading-tight mb-4">
              <span className="text-charcoal-blue">Kiasu</span>
              <span className="text-verdigris">Health</span>
            </h1>
            <p className="font-sans text-2xl font-medium text-slate-teal mb-5 leading-snug">
              Out-healthy your kakis,<br />one week at a time.
            </p>
            <p className="font-sans text-base text-slate-teal mb-8 leading-relaxed max-w-md">
              Compete in small-group weekly challenges. Steps, meal balance, activity.
              An AI referee scores everything. Sunday reveal decides the winner.
            </p>

            {/* Inline stat chips */}
            <div className="grid grid-cols-3 divide-x divide-jasmine/40 border border-jasmine/40 rounded-lg overflow-hidden mb-8">
              <div className="bg-papaya-whip px-4 py-3">
                <p className="font-mono font-bold text-2xl text-charcoal-blue">10,247</p>
                <p className="text-xs font-sans uppercase tracking-wide text-muted-teal mt-1 flex items-center gap-1">
                  <Footprints size={10} strokeWidth={1.5} /> steps
                </p>
              </div>
              <div className="bg-papaya-whip px-4 py-3">
                <p className="font-mono font-bold text-2xl text-charcoal-blue">
                  7.4<span className="text-base text-slate-teal">/10</span>
                </p>
                <p className="text-xs font-sans uppercase tracking-wide text-muted-teal mt-1 flex items-center gap-1">
                  <Utensils size={10} strokeWidth={1.5} /> meal
                </p>
              </div>
              <div className="bg-papaya-whip px-4 py-3">
                <p className="font-mono font-bold text-2xl text-charcoal-blue">4</p>
                <p className="text-xs font-sans uppercase tracking-wide text-muted-teal mt-1 flex items-center gap-1">
                  <Users size={10} strokeWidth={1.5} /> kakis
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/league/sg-league-001"
                className="inline-flex items-center gap-2 bg-burnt-peach hover:bg-verdigris text-white font-sans font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
              >
                View Leaderboard
                <ChevronRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/league/sg-league-001/reveal"
                className="inline-flex items-center gap-2 border border-verdigris text-verdigris hover:bg-verdigris hover:text-white font-sans font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
              >
                <Trophy size={16} strokeWidth={1.5} />
                Sunday Reveal
              </Link>
            </div>
          </div>

          {/* Right: animated leaderboard preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-sans font-medium uppercase tracking-widest text-muted-teal">
                This week&apos;s standings
              </p>
              <span className="text-xs font-mono text-verdigris bg-verdigris/10 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            </div>
            <div className="space-y-3">
              {PREVIEW_STANDINGS.map((p, i) => (
                <motion.div
                  key={p.rank}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.09, duration: 0.35, ease: "easeOut" }}
                  className={cn(
                    "bg-papaya-whip border border-jasmine rounded-lg p-4",
                    p.rank === 1 && "champion-glow"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn("font-mono font-bold text-2xl w-8 shrink-0 text-center", RANK_COLOR[p.rank])}>
                      #{p.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-sans font-semibold text-sm text-charcoal-blue">{p.name}</span>
                        <span className="font-mono font-bold text-sm text-charcoal-blue">{p.score} pts</span>
                      </div>
                      <div className="h-1.5 bg-warm-sand rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-verdigris rounded-full"
                          style={{ width: `${p.pct}%`, animation: "progress-fill 0.7s ease-out" }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs font-mono text-muted-teal">
                          <span>{p.steps.toLocaleString()} steps</span>
                          <span>{p.meal}/10 meal</span>
                        </div>
                        <span className="text-xs font-sans font-semibold text-burnt-peach">{p.badge}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs font-sans text-muted-teal mt-3 text-right">
              Week of 9&ndash;15 Mar 2026 &middot; sg-league-001
            </p>
          </div>
        </div>

        {/* How it works - horizontal strip */}
        <div className="mt-24 pt-10 border-t border-jasmine/40">
          <p className="text-xs font-sans font-medium uppercase tracking-widest text-muted-teal mb-8 text-center">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Join a league", text: "4-8 friends on Telegram. One group chat is all you need." },
              { step: "02", title: "Track & submit", text: "Steps via Apple Health. Meal photos in DM - only your score is shared, never the photo." },
              { step: "03", title: "AI referee scores", text: "Elastic Agent Builder aggregates steps, meals, and activity. Ranked weekly." },
              { step: "04", title: "Sunday reveal", text: "Cinematic leaderboard reveal. Winner gets health perks. Everyone else gets a nudge." },
            ].map(({ step, title, text }) => (
              <div key={step} className="flex flex-col gap-2">
                <span className="font-mono font-bold text-2xl text-jasmine">{step}</span>
                <p className="font-sans font-semibold text-sm text-charcoal-blue">{title}</p>
                <p className="font-sans text-xs text-slate-teal leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-jasmine/40 bg-papaya-whip">
        <div className="max-w-5xl mx-auto px-8 py-5 flex items-center justify-between">
          <span className="font-sans font-extrabold text-sm">
            <span className="text-charcoal-blue">Kiasu</span>
            <span className="text-verdigris">Health</span>
          </span>
          <span className="text-xs font-sans text-muted-teal">
            Elastic Forge The Future Singapore &middot; March 2026
          </span>
        </div>
      </footer>
    </div>
  );
}
