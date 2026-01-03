import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

export default function CentralizationAlert({ topRegion, stakePct, capacityPct, threshold = 30 }: { topRegion?: string | null; stakePct?: number; capacityPct?: number; threshold?: number }) {
  const stakeHigh = (stakePct ?? 0) >= threshold;
  const capHigh = (capacityPct ?? 0) >= threshold;
  if (!topRegion || (!stakeHigh && !capHigh)) return null;

  return (
    <div className="glass-card rounded-lg sm:rounded-xl p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border border-amber-400/10 bg-amber-900/5">
      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 flex-shrink-0" />
      <div className="flex-1 text-xs sm:text-sm">
        <div className="font-semibold">Centralization risk detected</div>
        <div className="text-xs text-muted-foreground">{topRegion} accounts for {stakeHigh ? `${(stakePct ?? 0).toFixed(1)}% stake` : ''}{stakeHigh && capHigh ? ' · ' : ''}{capHigh ? `${(capacityPct ?? 0).toFixed(1)}% capacity` : ''}. Consider rebalancing or further investigation.</div>
      </div>
      <div className="flex-shrink-0">
        <button className="px-2 sm:px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs whitespace-nowrap">Investigate</button>
      </div>
    </div>
  );
}
