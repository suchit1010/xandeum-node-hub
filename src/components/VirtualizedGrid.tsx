import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Star, Server, Copy, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import type { PNode } from './PNodeTable';

interface Props {
  nodes: PNode[];
  columnWidth?: number;
  rowHeight?: number;
}

export function VirtualizedGrid({ nodes, columnWidth = 340, rowHeight = 160 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(320, window.innerWidth - 48) : 1024
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Prefer ResizeObserver when available
    let ro: ResizeObserver | null = null;
    if ((window as any).ResizeObserver) {
      ro = new (window as any).ResizeObserver((entries: any) => {
        for (const entry of entries) {
          setContainerWidth(Math.floor(entry.contentRect.width));
        }
      });
      ro.observe(el);
    } else {
      // Fallback to window resize
      const onResize = () => setContainerWidth(Math.max(320, window.innerWidth - 48));
      window.addEventListener('resize', onResize);
      onResize();
      return () => window.removeEventListener('resize', onResize);
    }

    return () => { if (ro) ro.disconnect(); };
  }, []);

  const cols = Math.max(1, Math.floor(containerWidth / columnWidth));
  const rowCount = Math.ceil(nodes.length / cols) || 1;
  const gridWidth = Math.min(containerWidth, cols * columnWidth);
  const gridHeight = Math.min(600, rowCount * rowHeight);

  const Cell = useMemo(() => ({ columnIndex, rowIndex, style }: any) => {
    const idx = rowIndex * cols + columnIndex;
    if (idx >= nodes.length) return null;
    const node = nodes[idx];

    return (
      <div style={{ ...style, padding: 10, boxSizing: 'border-box' }}>
        <div className="glass-card-hover rounded-xl p-4 h-full">
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2.5 rounded-lg bg-primary/10`}>
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-semibold truncate">{node.id}</h3>
                {node.isTop && <Badge className="bg-xandeum-orange/20 text-xandeum-orange border-xandeum-orange/30"><Star className="h-3 w-3 mr-1" />Top</Badge>}
              </div>
              <div className="text-xs text-muted-foreground mt-1 truncate max-w-[220px]">{node.address}</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="text-xs text-muted-foreground">Uptime <div className="font-semibold">{node.uptime}%</div></div>
            <div className="font-mono font-medium text-primary">{(node.stake/1000).toFixed(1)}K</div>
          </div>
        </div>
      </div>
    );
  }, [cols, nodes, columnWidth, rowHeight]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ width: '100%', height: gridHeight }}>
        <Grid
          columnCount={cols}
          columnWidth={columnWidth}
          height={gridHeight}
          rowCount={rowCount}
          rowHeight={rowHeight}
          width={gridWidth}
        >
          {Cell}
        </Grid>
      </div>
    </div>
  );
}
