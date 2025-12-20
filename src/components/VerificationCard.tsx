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

  const copy = (text: string | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      // noop
    });
  };

  return (
    <div className="glass-card rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-lg bg-secondary/50">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l2 4 4 .5-3 3 .7 4L12 13l-3.7 1.5.7-4-3-3L10 6l2-4z" /></svg>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Data Source</div>
          <div className="font-mono font-semibold">{podsCount ?? 0} pods</div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row md:items-center md:justify-center gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Last fetch</div>
          <div className="font-semibold">{lastFetchTime ? new Date(lastFetchTime).toLocaleString() : '—'}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Source</div>
          <div className="font-mono text-sm">{sourceUrl ?? 'proxy'}</div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground">Sample pubkey</div>
          <div className="font-mono text-sm flex items-center gap-2">
            <span>{samplePubkey ?? '—'}</span>
            {samplePubkey && (
              <button className="text-xs text-primary underline" onClick={() => copy(samplePubkey)}>Copy</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="btn btn-ghost" onClick={() => setShowRaw(s => !s)}>
          {showRaw ? 'Hide JSON' : 'Show raw JSON'}
        </button>
        {rawJson && (
          <a
            className="btn btn-outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(rawJson, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'prpc-response.json';
              a.click();
              URL.revokeObjectURL(url);
            }}
          >Download JSON</a>
        )}
      </div>

      {showRaw && rawJson && (
        <pre className="mt-4 md:mt-0 w-full overflow-auto text-xs bg-transparent p-3 border border-border rounded">{JSON.stringify(rawJson, null, 2)}</pre>
      )}
    </div>
  );
}
