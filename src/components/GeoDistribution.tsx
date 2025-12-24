import React from 'react';

interface Props {
  nodes: Array<{ region?: string }>;
}

export default function GeoDistribution({ nodes }: Props) {
  const counts: Record<string, number> = { 'North America': 0, 'Europe': 0, 'Asia Pacific': 0, Unknown: 0 };
  nodes.forEach(n => {
    const r = n.region || 'Unknown';
    if (r.includes('North')) counts['North America'] += 1;
    else if (r.includes('Europe')) counts['Europe'] += 1;
    else if (r.includes('Asia')) counts['Asia Pacific'] += 1;
    else counts['Unknown'] += 1;
  });

  const total = Math.max(1, nodes.length);

  const regions = [
    { key: 'North America', x: 80, y: 60, color: '#38bdf8' },
    { key: 'Europe', x: 220, y: 40, color: '#a78bfa' },
    { key: 'Asia Pacific', x: 360, y: 80, color: '#34d399' },
  ];

  return (
    <div className="glass-card rounded-xl p-4">
      <h3 className="text-lg font-semibold mb-2">Regional Distribution</h3>
      <p className="text-sm text-muted-foreground mb-3">Approximate distribution by region (derived from node metadata)</p>
      <svg width={460} height={140} viewBox={`0 0 460 140`}>
        {/* background subtle world-like rectangle */}
        <rect x={0} y={0} width={460} height={140} rx={8} fill="url(#g)" />
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#0f1724" stopOpacity={0.02} />
            <stop offset="100%" stopColor="#0f1724" stopOpacity={0.04} />
          </linearGradient>
        </defs>

        {regions.map(r => {
          const count = counts[r.key] || 0;
          const radius = 12 + (count / total) * 48; // scale
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <g key={r.key} transform={`translate(${r.x}, ${r.y})`}>
              <circle r={radius} fill={r.color} fillOpacity={0.18} stroke={r.color} strokeOpacity={0.6} />
              <text x={radius + 10} y={4} fill="#cbd5e1" fontSize={12} fontFamily="Inter, sans-serif">{r.key}</text>
              <text x={radius + 10} y={20} fill="#94a3b8" fontSize={11} fontFamily="Inter, sans-serif">{count} nodes — {pct}%</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex gap-3">
        {regions.map(r => (
          <div key={r.key} className="flex items-center gap-2">
            <span style={{ width: 12, height: 12, background: r.color, display: 'inline-block', borderRadius: 3 }} />
            <div className="text-sm">
              <div className="font-medium">{r.key}</div>
              <div className="text-xs text-muted-foreground">{counts[r.key] || 0} nodes</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
