import React, { useMemo, useRef, useState, useEffect } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Star, Server, Copy, ExternalLink, Shield } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from '@/hooks/use-toast';
import { getCountryFlag } from '@/lib/geo';
import type { PNode } from './PNodeTable';

// Country flag mapping
const countryFlagMap: Record<string, string> = {
  'France': '🇫🇷',
  'United States': '🇺🇸',
  'Germany': '🇩🇪',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Japan': '🇯🇵',
  'India': '🇮🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'Netherlands': '🇳🇱',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'South Korea': '🇰🇷',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'China': '🇨🇳',
  'Russia': '🇷🇺',
  'Sweden': '🇸🇪',
  'Switzerland': '🇨🇭',
  'Belgium': '🇧🇪',
  'Austria': '🇦🇹',
  'Norway': '🇳🇴',
  'Poland': '🇵🇱',
  'Czech Republic': '🇨🇿',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'South Africa': '🇿🇦',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Philippines': '🇵🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'New Zealand': '🇳🇿',
  'Ireland': '🇮🇪',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
};

// Local getCountryFlag function removed - importing from geo.ts instead

interface Props {
  nodes: PNode[];
  columnWidth?: number;
  rowHeight?: number;
  onViewDetails?: (node: PNode) => void;
}

function formatPercent(num: number, decimals = 0): string {
  return (Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals) + '%';
}

function formatStake(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toFixed(0);
}

function formatTimeSince(date: Date | string | number | null) {
  const d = date instanceof Date ? date : (date ? new Date(date as string | number) : null);
  if (!d || Number.isNaN(d.getTime())) return '—';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function VirtualizedGrid({ nodes, onViewDetails }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? Math.max(320, window.innerWidth - 24) : 1024
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
      const onResize = () => setContainerWidth(Math.max(320, window.innerWidth - 24));
      window.addEventListener('resize', onResize);
      onResize();
      return () => window.removeEventListener('resize', onResize);
    }

    return () => { if (ro) ro.disconnect(); };
  }, []);

  // Responsive column sizing
  const getColsAndWidth = () => {
    if (containerWidth < 600) return { cols: 1, colWidth: containerWidth };
    if (containerWidth < 900) return { cols: 2, colWidth: Math.floor((containerWidth - 12) / 2) };
    if (containerWidth < 1200) return { cols: 2, colWidth: Math.floor((containerWidth - 12) / 2) };
    return { cols: 3, colWidth: Math.floor((containerWidth - 20) / 3) };
  };

  const { cols, colWidth } = getColsAndWidth();
  const rowHeight = 280; // Taller for detailed cards
  const rowCount = Math.ceil(nodes.length / cols) || 1;
  const gridWidth = containerWidth;
  const gridHeight = Math.min(1200, rowCount * rowHeight);

  const Cell = useMemo(() => ({ columnIndex, rowIndex, style }: any) => {
    const idx = rowIndex * cols + columnIndex;
    if (idx >= nodes.length) return null;
    const node = nodes[idx];

    const copyId = () => {
      navigator.clipboard.writeText(node.id);
      toast({ title: 'Copied', description: 'Node ID copied to clipboard' });
    };

    const getStatusBadge = (status: PNode["status"]) => {
      const styles = {
        online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        offline: "bg-red-500/20 text-red-400 border-red-500/30",
        syncing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
      };
      return (
        <Badge variant="outline" className={`${styles[status]} font-medium text-xs`}>
          <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
            status === "online" ? "bg-emerald-400" :
            status === "offline" ? "bg-red-400" : "bg-amber-400"
          }`} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    };

    return (
      <div style={{ ...style, padding: 6, boxSizing: 'border-box' }}>
        <div className="glass-card rounded-lg sm:rounded-xl p-3 sm:p-4 h-full flex flex-col overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer" onClick={() => onViewDetails && onViewDetails(node)}>
          {/* Header with Node ID and Status */}
          <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-mono font-bold text-xs sm:text-sm truncate">{node.id}</span>
                {node.isTop && <Star className="h-3 w-3 text-xandeum-orange flex-shrink-0" />}
              </div>
              <div className="text-xs text-muted-foreground truncate">{node.address}</div>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(node.status)}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Uptime */}
            <div className="p-2 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Uptime</div>
              <div className={`text-sm sm:text-base font-bold ${node.uptime >= 99 ? "text-emerald-400" : node.uptime >= 95 ? "text-primary" : "text-xandeum-orange"}`}>
                {formatPercent(Number(node.uptime ?? 0), 1)}
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-xandeum-orange" style={{ width: `${node.uptime}%` }} />
              </div>
            </div>

            {/* Capacity */}
            <div className="p-2 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Capacity</div>
              <div className="text-sm sm:text-base font-bold text-primary">
                {formatPercent(Number(node.capacity ?? 0), 1)}
              </div>
              <div className="w-full h-1.5 bg-secondary/50 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: `${Math.min(100, Number(node.capacity ?? 0))}%` }} />
              </div>
            </div>

            {/* Region */}
            <div className="p-2 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Region</div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold truncate">
                <span>{getCountryFlag(node.region || 'Unknown')}</span>
                <span className="truncate">{node.region || 'Unknown'}</span>
              </div>
            </div>

            {/* Stake */}
            <div className="p-2 rounded-lg bg-secondary/20">
              <div className="text-xs text-muted-foreground">Stake</div>
              <div className="text-sm sm:text-base font-bold text-primary">
                {formatStake(node.stake ?? 0)}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex flex-col gap-1.5 text-xs border-t border-border/30 pt-2 mt-auto">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version:</span>
              <span className="font-mono text-xs">{node.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Seen:</span>
              <span className="text-xs">{formatTimeSince(node.lastSeen)}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyId();
              }}
              className="text-primary hover:text-primary/80 text-left text-xs font-medium flex items-center gap-1 mt-1"
            >
              <Copy className="h-3 w-3" />
              Copy ID
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails && onViewDetails(node);
              }}
              className="text-primary hover:text-primary/80 text-left text-xs font-medium flex items-center gap-1 mt-2 pt-2 border-t border-border/30"
            >
              <ExternalLink className="h-3 w-3" />
              View Full Details
            </button>
          </div>
        </div>
      </div>
    );
  }, [cols, nodes, colWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <div style={{ width: '100%', height: gridHeight }}>
        <Grid
          columnCount={cols}
          columnWidth={colWidth}
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
