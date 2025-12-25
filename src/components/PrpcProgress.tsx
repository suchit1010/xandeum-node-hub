import React from 'react';

export default function PrpcProgress({ progress }: { progress: any | null }) {
  if (!progress) return null;
  const attempted = progress.attempted ?? 0;
  const responded = progress.responded ?? 0;
  const pct = attempted > 0 ? Math.round((responded / attempted) * 100) : 0;
  const label = `Probe: ${responded}/${attempted} endpoints replied`;

  return (
    <div className="mb-4 p-2 rounded-md bg-secondary/30 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <div>{label}</div>
        <div className="text-xs text-muted-foreground">{pct}%</div>
      </div>
      <div className="w-full bg-secondary/20 h-2 rounded mt-2 overflow-hidden">
        <div className="h-2 bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
