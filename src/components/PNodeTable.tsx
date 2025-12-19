import { useState } from "react";
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Copy, 
  MoreHorizontal,
  Star,
  Shield
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export interface PNode {
  id: string;
  address: string;
  status: "online" | "offline" | "syncing";
  uptime: number;
  capacity: number;
  peers: number;
  lastSeen: Date;
  region: string;
  version: string;
  stake: number;
  isTop: boolean;
}

interface PNodeTableProps {
  nodes: PNode[];
}

type SortField = "uptime" | "capacity" | "peers" | "stake" | "lastSeen";
type SortDirection = "asc" | "desc";

export function PNodeTable({ nodes }: PNodeTableProps) {
  const [sortField, setSortField] = useState<SortField>("stake");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedNodes = [...nodes].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    if (sortField === "lastSeen") {
      return (a.lastSeen.getTime() - b.lastSeen.getTime()) * multiplier;
    }
    return (a[sortField] - b[sortField]) * multiplier;
  });

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

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-12">#</TableHead>
              <TableHead>Node</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("uptime")}>
                  Uptime <SortIcon field="uptime" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("capacity")}>
                  Capacity <SortIcon field="capacity" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("peers")}>
                  Peers <SortIcon field="peers" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("stake")}>
                  Stake <SortIcon field="stake" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" size="sm" className="h-8 px-2 -ml-2" onClick={() => handleSort("lastSeen")}>
                  Last Seen <SortIcon field="lastSeen" />
                </Button>
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodes.map((node, index) => (
              <TableRow key={node.id} className="data-table-row border-border/30">
                <TableCell className="font-mono text-muted-foreground">
                  {node.isTop && <Star className="h-3 w-3 text-xandeum-orange inline mr-1" />}
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{node.id}</span>
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
                    <span className="font-medium">{node.uptime}%</span>
                    <div className="progress-bar w-20">
                      <div className="progress-bar-fill" style={{ width: `${node.uptime}%` }} />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <span className="font-medium">{node.capacity}%</span>
                    <div className="progress-bar w-20">
                      <div 
                        className="progress-bar-fill" 
                        style={{ 
                          width: `${node.capacity}%`,
                          background: node.capacity > 80 ? 
                            "linear-gradient(135deg, hsl(35 95% 55%), hsl(20 90% 50%))" :
                            undefined
                        }} 
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono">{node.peers}</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-primary font-medium">
                    {(node.stake / 1000).toFixed(1)}K
                  </span>
                </TableCell>
                <TableCell>
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
                      <DropdownMenuItem className="cursor-pointer">
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
    </div>
  );
}
