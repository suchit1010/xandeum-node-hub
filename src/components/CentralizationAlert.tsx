import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

export default function CentralizationAlert({ topRegion, stakePct, capacityPct, threshold = 30 }: { topRegion?: string | null; stakePct?: number; capacityPct?: number; threshold?: number }) {
  const stakeHigh = (stakePct ?? 0) >= threshold;
  const capHigh = (capacityPct ?? 0) >= threshold;
  if (!topRegion || (!stakeHigh && !capHigh)) return null;

  return (
    <div className="glass-card rounded-xl p-3 flex items-center gap-3 border border-amber-400/10 bg-amber-900/5">
      <AlertTriangle className="h-5 w-5 text-amber-400" />
      <div className="flex-1 text-sm">
        <div className="font-semibold">Centralization risk detected</div>
        <div className="text-xs text-muted-foreground">{topRegion} accounts for {stakeHigh ? `${(stakePct ?? 0).toFixed(1)}% stake` : ''}{stakeHigh && capHigh ? ' · ' : ''}{capHigh ? `${(capacityPct ?? 0).toFixed(1)}% capacity` : ''}. Consider rebalancing or further investigation.</div>
      </div>
      <div>
        <button className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs">Investigate</button>
      </div>
    </div>
  );
}
