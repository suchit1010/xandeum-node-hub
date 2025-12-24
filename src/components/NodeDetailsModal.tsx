import React from 'react';
import { PNode } from '@/components/PNodeTable';
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
import { format } from 'date-fns';
import { Download, Copy } from 'lucide-react';

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
    const text = node.id || node.pubkey || node.pub_key || '';
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Node Details</DialogTitle>
          <DialogDescription>Full pRPC fields and derived metrics for this pNode</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono font-semibold break-all">{node.id || node.pubkey || '—'}</div>
              <div className="text-sm text-muted-foreground">{node.address}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyPubkey}><Copy className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={handleDownload}><Download className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/20 rounded">
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-semibold">{node.status}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded">
              <p className="text-xs text-muted-foreground">Peers</p>
              <p className="font-semibold">{node.peers ?? '—'}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded">
              <p className="text-xs text-muted-foreground">Uptime</p>
              <p className="font-semibold">{typeof node.uptime === 'number' ? `${node.uptime}%` : '—'}</p>
            </div>
            <div className="p-3 bg-secondary/20 rounded">
              <p className="text-xs text-muted-foreground">Capacity</p>
              <p className="font-semibold">{typeof node.capacity === 'number' ? `${node.capacity}%` : '—'}</p>
            </div>
          </div>

          <div className="p-3 bg-secondary/10 rounded">
            <p className="text-xs text-muted-foreground">Version</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="font-mono">{node.version || '—'}</Badge>
              <span className="text-sm text-muted-foreground">Last seen: {node.lastSeen ? format(new Date(node.lastSeen), 'PPpp') : '—'}</span>
            </div>
          </div>

          <div className="p-3 bg-popover border border-border rounded text-sm overflow-auto">
            <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(node, null, 2)}</pre>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
