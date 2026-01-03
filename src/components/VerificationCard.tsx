
import React, { useState } from 'react';

interface Props {
  lastFetchTime: number | null;
  sourceUrl?: string;
  rawJson: any;
  podsCount: number;
}

export default function VerificationCard({ lastFetchTime, sourceUrl, rawJson, podsCount }: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const samplePubkey = (() => {
    try {
      if (rawJson?.result && Array.isArray(rawJson.result)) return rawJson.result[0]?.pubkey;
      if (rawJson?.result?.pods && Array.isArray(rawJson.result.pods)) return rawJson.result.pods[0]?.pubkey;
      if (Array.isArray(rawJson)) return rawJson[0]?.pubkey;
      return null;
    } catch {
      return null;
    }
  })();

  // Compute summary metrics from rawJson when available to show uptime/capacity
  const { avgUptimePct, avgCapacityPct, totalPods } = (() => {
    try {
      let arr: any[] | undefined;
      if (rawJson?.result && Array.isArray(rawJson.result)) arr = rawJson.result;
      else if (rawJson?.result?.pods && Array.isArray(rawJson.result.pods)) arr = rawJson.result.pods;
      else if (Array.isArray(rawJson)) arr = rawJson;

      if (!arr || arr.length === 0) return { avgUptimePct: 0, avgCapacityPct: 0, totalPods: podsCount ?? 0 };

      const maxUptimeSeconds = 30 * 24 * 3600;
      const uptimes = arr.map((n: any) => (typeof n.uptime === 'number' ? Math.min(1, n.uptime / maxUptimeSeconds) : 0));
      const avgUptimePct = Math.round((uptimes.reduce((s: number, v: number) => s + v, 0) / uptimes.length) * 100);

      const capacities = arr.map((n: any) => (typeof n.storage_usage_percent === 'number' ? Math.min(1, n.storage_usage_percent) : 0));
      const avgCapacityPct = Math.round((capacities.reduce((s: number, v: number) => s + v, 0) / capacities.length) * 100);

      return { avgUptimePct, avgCapacityPct, totalPods: arr.length };
    } catch {
      return { avgUptimePct: 0, avgCapacityPct: 0, totalPods: podsCount ?? 0 };
    }
  })();

  const copy = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // noop
    });
  };

  return (
    <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="p-2 sm:p-3 rounded-lg bg-secondary/50 flex-shrink-0">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l2 4 4 .5-3 3 .7 4L12 13l-3.7 1.5.7-4-3-3L10 6l2-4z" /></svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold">Verified <span className="inline-block ml-2 h-2 w-2 rounded-full bg-emerald-500" /></h3>
              <div className="font-mono text-xs sm:text-sm text-muted-foreground truncate max-w-[100%] sm:max-w-[420px]">{samplePubkey ?? '—'}</div>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="text-xs text-muted-foreground">{totalPods} pods</div>
              <div className="font-mono font-semibold text-primary text-sm">{podsCount >= 1000 ? `${(podsCount/1000).toFixed(1)}K` : podsCount} verified</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 mt-3 sm:mt-6">
            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">Uptime</p>
              <div className="flex items-center justify-between">
                <div className="text-lg sm:text-2xl font-semibold">{avgUptimePct}%</div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${avgUptimePct}%` }} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">Capacity</p>
              <div className="flex items-center justify-between">
                <div className="text-lg sm:text-2xl font-semibold">{avgCapacityPct}%</div>
              </div>
              <div className="mt-2 sm:mt-3">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${avgCapacityPct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 sm:mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 sm:gap-3">
        <button className="btn btn-ghost text-xs sm:text-sm w-full sm:w-auto" onClick={() => setShowRaw(s => !s)}>{showRaw ? 'Hide JSON' : 'Show raw JSON'}</button>
        {rawJson && (
          <button className="btn btn-outline text-xs sm:text-sm w-full sm:w-auto" onClick={() => {
            const blob = new Blob([JSON.stringify(rawJson, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'prpc-response.json';
            a.click();
            URL.revokeObjectURL(url);
          }}>Download JSON</button>
        )}
      </div>

      {showRaw && rawJson && (
        <pre className="mt-3 sm:mt-4 w-full max-w-full overflow-auto text-xs bg-transparent p-2 sm:p-3 border border-border rounded whitespace-pre-wrap break-words">{JSON.stringify(rawJson, null, 2)}</pre>
      )}
    </div>
  );
}
