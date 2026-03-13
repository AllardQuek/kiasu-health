"use client";

import { useState, useEffect } from "react";

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  target?: number;
  targetLabel?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ label, value, unit, target, targetLabel, icon }: MetricCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const numericValue = typeof value === "number" ? value : parseFloat(String(value));
  const pct = target ? Math.min((numericValue / target) * 100, 100) : undefined;

  return (
    <div className="bg-papaya-whip border border-jasmine rounded-lg p-6 flex flex-col gap-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-sans font-medium uppercase tracking-wide text-muted-teal">
          {label}
        </span>
        {icon && (
          <span className="text-muted-teal">{icon}</span>
        )}
      </div>

      {/* Hero number */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-mono font-bold text-charcoal-blue tabular-nums leading-none">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-sm font-sans text-slate-teal">{unit}</span>
        )}
      </div>

      {/* Progress bar */}
      {pct !== undefined && (
        <div>
          <div className="h-1.5 bg-warm-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-verdigris rounded-full progress-fill"
              style={{ width: mounted ? `${pct}%` : "0%" }}
            />
          </div>
          {targetLabel && (
            <p className="text-xs font-sans text-muted-teal mt-1">
              {Math.round(pct)}% of {targetLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
