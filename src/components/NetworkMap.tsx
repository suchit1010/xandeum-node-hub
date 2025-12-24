import React, { useState } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import NodeDetailsModal from './NodeDetailsModal';

interface NetworkMapProps {
  nodes: any[];
}

const REGION_COORDS: Record<string, { x: number; y: number }> = {
  'North America': { x: 22, y: 40 },
  'Europe': { x: 52, y: 28 },
  'Asia Pacific': { x: 82, y: 42 },
  'Unknown': { x: 60, y: 60 },
};

export default function NetworkMap({ nodes }: NetworkMapProps) {
  const [openRegion, setOpenRegion] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const counts = nodes.reduce((acc: Record<string, number>, n) => {
    const r = n.region || 'Unknown';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const regions = Object.keys(REGION_COORDS);

  return (
    <div className="glass-card rounded-xl p-6">
      <h4 className="font-semibold mb-4 flex items-center gap-2">Network Geography</h4>

      <div className="relative w-full h-[260px] bg-gradient-to-br from-[#061826] to-[#07182a] rounded-lg overflow-hidden border border-border/30">
        {/* Stylized world silhouette background (minimal) */}
        <svg viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <rect x="0" y="0" width="100" height="60" fill="transparent" />
          {/* Simple continents blobs for visual context */}
          <path d="M5 20 C12 12, 20 10, 30 12 C40 14, 48 18, 55 16 C62 14, 70 12, 78 16 C86 20, 92 28, 95 36 L95 44 L5 44 Z" fill="rgba(255,255,255,0.02)" />
          <path d="M40 6 C46 8, 52 9, 58 12 C63 15, 68 18, 72 22 C76 26, 80 30, 84 34" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" fill="none" />
          {/* Region markers */}
          {regions.map((r) => {
            const coord = REGION_COORDS[r];
            const count = counts[r] || 0;
            if (count === 0) return null;
            return (
              <g key={r} transform={`translate(${coord.x}, ${coord.y})`} style={{ cursor: 'pointer' }} onClick={() => setOpenRegion(r)}>
                <circle r={3.8} fill="rgba(59,130,246,0.95)" stroke="#0ea5e9" strokeWidth={0.6} />
                <text x={6} y={2} fontSize={3.6} fill="#cbd5e1">{r} ({count})</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Region Modal: lists nodes in region and allows opening NodeDetailsModal for a node */}
      <Dialog open={!!openRegion} onOpenChange={(o) => { if (!o) setOpenRegion(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{openRegion} Nodes</DialogTitle>
            <DialogDescription>Click a node to view full details</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-60 overflow-auto">
            {(openRegion ? nodes.filter(n => (n.region || 'Unknown') === openRegion) : []).map((n) => (
              <div key={n.id || n.pubkey} className="p-2 rounded hover:bg-secondary/30 flex items-center justify-between">
                <div className="truncate">
                  <div className="font-mono font-semibold">{n.id}</div>
                  <div className="text-xs text-muted-foreground">{n.address}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setSelectedNode(n)}>View</Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="mt-4">
            <Button onClick={() => setOpenRegion(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Node Details modal for selected node from region list */}
      <NodeDetailsModal open={!!selectedNode} onOpenChange={(o) => { if (!o) setSelectedNode(null); }} node={selectedNode} />
    </div>
  );
}
