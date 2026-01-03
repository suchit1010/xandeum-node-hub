import React from 'react';
import { PNode } from '@/components/PNodeTable';
import { getCountryFlag } from '@/lib/geo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Download, Copy, ExternalLink, Share2, AlertCircle } from 'lucide-react';

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

interface NodeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: PNode | null;
}

export default function NodeDetailsModal({ open, onOpenChange, node }: NodeProps) {
  if (!node) return null;

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(node, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnode-${node.id || node.pubkey || 'node'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyPubkey = () => {
    const text = node.id || node.pubkey || '';
    if (text) navigator.clipboard.writeText(text);
  };

  const copyAddress = () => {
    const text = node.address || '';
    if (text) navigator.clipboard.writeText(text);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'syncing': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-secondary/20';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background/95 backdrop-blur pb-4 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl sm:text-2xl truncate">pNode Details</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">Comprehensive metrics and node information</DialogDescription>
            </div>
            <Badge variant="outline" className={`flex-shrink-0 text-xs sm:text-sm ${getStatusColor(node.status)}`}>
              {node.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Node Identification */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Node Identification
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Public Key (ID)</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs sm:text-sm break-all">{node.id || node.pubkey || '—'}</p>
                  <Button variant="ghost" size="sm" onClick={copyPubkey} className="flex-shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground mb-1">Wallet Address</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-xs sm:text-sm break-all">{node.address || '—'}</p>
                  <Button variant="ghost" size="sm" onClick={copyAddress} className="flex-shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Performance Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                <p className="font-semibold text-sm sm:text-base">{typeof node.uptime === 'number' ? `${node.uptime}%` : '—'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Capacity</p>
                <p className="font-semibold text-sm sm:text-base">{typeof node.capacity === 'number' ? `${node.capacity}%` : '—'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Peers</p>
                <p className="font-semibold text-sm sm:text-base">{node.peers ?? '—'}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Stake</p>
                <p className="font-semibold text-sm sm:text-base text-primary">{(node.stake || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Region</p>
                <p className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
                  <span>{getCountryFlag(node.region || 'Unknown')}</span>
                  <span>{node.region || '—'}</span>
                </p>
              </div>
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Version</p>
                <Badge variant="secondary" className="font-mono text-xs">{node.version || '—'}</Badge>
              </div>
            </div>
          </div>

          {/* Network Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Network Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">Last Seen</p>
                <p className="font-semibold text-xs sm:text-sm">{node.lastSeen ? format(new Date(node.lastSeen), 'PPpp') : '—'}</p>
              </div>
              {node.country && (
                <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                  <p className="text-xs text-muted-foreground mb-1">Country</p>
                  <p className="font-semibold text-xs sm:text-sm flex items-center gap-2">
                    <span>{getCountryFlag(node.region || node.country)}</span>
                    <span>{node.country}</span>
                  </p>
                </div>
              )}
              {node.isDuplicate && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-red-400 font-semibold">Duplicate Node Detected</p>
                    <p className="text-xs text-red-300">This node shares the same IP with other pNodes</p>
                  </div>
                </div>
              )}
              {node.isPublic && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-emerald-400 font-semibold">Public Node</p>
                    <p className="text-xs text-emerald-300">This node is publicly accessible</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Raw JSON */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm sm:text-base">Raw Data</h3>
            <div className="p-3 bg-popover border border-border rounded-lg overflow-auto max-h-60">
              <pre className="whitespace-pre-wrap break-words text-xs font-mono">{JSON.stringify(node, null, 2)}</pre>
            </div>
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/50 pt-4 mt-6 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download JSON</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
