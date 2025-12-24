import { useState, useMemo, useEffect } from "react";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Copy, 
  MoreHorizontal,
  Star,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export interface PNode {
  id: string;
  address: string;
  status: "online" | "offline" | "syncing";
  uptime: number;
  capacity: number;
  peers: number;
  lastSeen: Date | string;
  region: string;
  pubkey?: string;
  country?: string;
  version: string;
  stake: number;
  isTop: boolean;
}

interface PNodeTableProps {
  nodes: PNode[];
  onViewDetails?: (node: PNode) => void;
}

type SortField = "uptime" | "capacity" | "peers" | "stake" | "lastSeen";
type SortDirection = "asc" | "desc";

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function PNodeTable({ nodes, onViewDetails }: PNodeTableProps) {
  const [sortField, setSortField] = useState<SortField>("stake");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [globeFilter, setGlobeFilter] = useState<string | null>(null);

  // listen for globe selection events to filter table by region/country
  useEffect(() => {
    const handler = (e: Event) => {
        try {
          const d = (e as CustomEvent)?.detail;
          if (!d) return;
          const name = d.name || d.region || (d.nodes && d.nodes[0]?.region) || null;
          if (name) setGlobeFilter(String(name));
        } catch (err) {
          // ignore
        }
      };
      window.addEventListener('xandeum:globe-select', handler as EventListener);
      return () => window.removeEventListener('xandeum:globe-select', handler as EventListener);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1); // Reset to first page on sort
  };

  const filteredNodes = useMemo(() => {
    if (!globeFilter) return nodes;
    const f = globeFilter.toLowerCase();
    return nodes.filter((n) => {
      const region = (n.region || "").toLowerCase();
      const country = ((n as any).country || "").toLowerCase();
      return region.includes(f) || country.includes(f) || String(n.id).toLowerCase().includes(f);
    });
  }, [nodes, globeFilter]);

  const maxCapacity = useMemo(() => {
    return Math.max(1, ...nodes.map(n => Number(n.capacity) || 0));
  }, [nodes]);

  const sortedNodes = useMemo(() => {
    const getFieldValue = (node: PNode, field: SortField) => {
      if (field === 'lastSeen') return new Date(node.lastSeen).getTime();
      if (field === 'uptime') return Number(node.uptime ?? 0);
      if (field === 'capacity') return Number(node.capacity ?? 0);
      if (field === 'peers') return Number(node.peers ?? 0);
      if (field === 'stake') return Number(node.stake ?? 0);
      return 0;
    };

    return [...filteredNodes].sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      const av = getFieldValue(a, sortField);
      const bv = getFieldValue(b, sortField);
      return (av - bv) * multiplier;
    });
  }, [filteredNodes, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedNodes.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedNodes = sortedNodes.slice(startIndex, startIndex + rowsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3" />;
    return sortDirection === "asc" ? 
      <ArrowUp className="h-3 w-3 text-primary" /> : 
      <ArrowDown className="h-3 w-3 text-primary" />;
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address copied to clipboard" });
  };

  const copyPubkey = (pubkey: string) => {
    navigator.clipboard.writeText(pubkey);
    toast({ title: "Pubkey copied to clipboard" });
  };

  // Export sorted + filtered view (not paginated) — listen for global export event
  useEffect(() => {
    const handler = () => {
      try {
        const headers = ["ID", "Address", "Status", "Uptime", "Capacity", "Peers", "Stake", "Version", "Region"];
        const rows = sortedNodes.map(n => [n.id, n.address, n.status, n.uptime, n.capacity, n.peers, n.stake, n.version, n.region]);
        const csvContent = [headers, ...rows]
          .map(r => r.map(c => String(c ?? '').replace(/"/g, '""')).map(c => `"${c}"`).join(','))
          .join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Exported CSV', description: `${sortedNodes.length} rows exported` });
      } catch (e) {
        console.error('Export failed', e);
        toast({ title: 'Export failed' });
      }
    };
    window.addEventListener('xandeum:export-csv', handler);

    const jsonHandler = () => {
      try {
        const payload = sortedNodes.map(n => ({ id: n.id, address: n.address, status: n.status, uptime: n.uptime, capacity: n.capacity, peers: n.peers, stake: n.stake, version: n.version, region: n.region }));
        const jsonContent = JSON.stringify(payload, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xandeum-pnodes-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: 'Exported JSON', description: `${sortedNodes.length} rows exported` });
      } catch (e) {
        console.error('JSON export failed', e);
        toast({ title: 'Export failed' });
      }
    };

    window.addEventListener('xandeum:export-json', jsonHandler);

    return () => {
      window.removeEventListener('xandeum:export-csv', handler);
      window.removeEventListener('xandeum:export-json', jsonHandler);
    };
  }, [sortedNodes]);

  const getStatusBadge = (status: PNode["status"]) => {
    const styles = {
      online: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      offline: "bg-red-500/20 text-red-400 border-red-500/30",
      syncing: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return (
      <Badge variant="outline" className={`${styles[status]} font-medium`}>
        <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
          status === "online" ? "bg-emerald-400" :
          status === "offline" ? "bg-red-400" : "bg-amber-400"
        }`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimeSince = (date: Date | string | number | null) => {
    // Accept Date, string, number, or null; normalize to Date
    const d = date instanceof Date ? date : (date ? new Date(date as any) : null);
    if (!d || Number.isNaN(d.getTime())) return '—';
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  const formatVersion = (version: string) => {
    // Group versions for readability
    const parts = version.split(".");
    if (parts.length >= 2) {
      return `v${parts[0]}.${parts[1]}.x`;
    }
    return version;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      {/* Table Header Info */}
      <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between bg-secondary/20">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Showing</span>
          <span className="font-semibold text-foreground">{startIndex + 1}-{Math.min(startIndex + rowsPerPage, sortedNodes.length)}</span>
          <span>of</span>
          <span className="font-semibold text-foreground">{sortedNodes.length}</span>
          <span>pNodes</span>
          {globeFilter && (
            <div className="ml-3 inline-flex items-center gap-2 bg-secondary/40 border border-border rounded-full px-3 py-1 text-xs text-foreground">
              <span className="font-medium">Filter:</span>
              <span className="font-mono">{globeFilter}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setGlobeFilter(null); setCurrentPage(1); }}>
                ✕
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows:</span>
          <Select value={String(rowsPerPage)} onValueChange={(val) => { setRowsPerPage(Number(val)); setCurrentPage(1); }}>
            <SelectTrigger className="w-[70px] h-8 bg-secondary/50 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {ROWS_PER_PAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Node
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border-border">
                        <p>pNode ID and wallet address from pRPC</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("uptime")}>
                  Uptime <SortIcon field="uptime" />
                </Button>
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("capacity")}>
                  Capacity <SortIcon field="capacity" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("peers")}>
                  Peers <SortIcon field="peers" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">Credits</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("stake")}>
                  Stake <SortIcon field="stake" />
                </Button>
              </TableHead>
              <TableHead className="hidden xl:table-cell">Version</TableHead>
              <TableHead className="hidden sm:table-cell">
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("lastSeen")}>
                  Last Seen <SortIcon field="lastSeen" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedNodes.map((node, index) => (
              <TableRow key={node.id} className="data-table-row border-border/30">
                <TableCell className="font-mono text-muted-foreground">
                  {node.isTop && <Star className="h-3 w-3 text-xandeum-orange inline mr-1" />}
                  {startIndex + index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{node.id}</span>
                      <button onClick={() => copyPubkey(node.id)} className="ml-2 text-xs text-muted-foreground hover:text-foreground">Copy pubkey</button>
                      {node.isTop && <Shield className="h-3 w-3 text-primary" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <span className="truncate max-w-[120px]">{node.address}</span>
                      <button onClick={() => copyAddress(node.address)} className="hover:text-foreground">
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(node.status)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className={`font-medium ${node.uptime >= 99 ? "text-emerald-400" : node.uptime >= 95 ? "text-primary" : "text-xandeum-orange"}`}>
                      {node.uptime}%
                    </span>
                    <div className="progress-bar w-16 sm:w-20">
                      <div className="progress-bar-fill" style={{ width: `${node.uptime}%` }} />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="space-y-1">
                    <span className="font-medium">{Number(node.capacity).toFixed(1)} GB</span>
                    <div className="progress-bar w-20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${Math.min(100, Math.round((Number(node.capacity) / maxCapacity) * 100))}%`,
                        }} 
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="font-mono">{node.peers === null || node.peers === undefined ? 'N/A' : node.peers}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="font-mono">{node.stake ?? 0}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-primary font-medium">
                    {(node.stake / 1000).toFixed(1)}K
                  </span>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <Badge variant="secondary" className="font-mono text-xs">
                    {formatVersion(node.version)}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span className="text-muted-foreground text-sm">
                    {formatTimeSince(node.lastSeen)}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => onViewDetails && onViewDetails(node)}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Star className="h-4 w-4 mr-2" />
                        Add to Watchlist
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Node ID
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between bg-secondary/20">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "ghost"}
                    size="icon"
                    className={`h-8 w-8 ${currentPage === pageNum ? "bg-primary text-primary-foreground" : ""}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
