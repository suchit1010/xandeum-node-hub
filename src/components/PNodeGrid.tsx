import { Server, Activity, Wifi, TrendingUp, Copy, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import type { PNode } from "./PNodeTable";

interface PNodeGridProps {
  nodes: PNode[];
}

export function PNodeGrid({ nodes }: PNodeGridProps) {
  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({ title: "Address copied to clipboard" });
  };

  const getStatusColor = (status: PNode["status"]) => {
    switch (status) {
      case "online": return "bg-emerald-500";
      case "offline": return "bg-red-500";
      case "syncing": return "bg-amber-500";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {nodes.map((node, index) => (
        <div 
          key={node.id} 
          className="glass-card-hover rounded-xl p-5 relative group"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {node.isTop && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-xandeum-orange/20 text-xandeum-orange border-xandeum-orange/30">
                <Star className="h-3 w-3 mr-1" />
                Top Node
              </Badge>
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className={`p-2.5 rounded-lg bg-primary/10`}>
              <Server className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-semibold truncate">{node.id}</h3>
                <span className={`h-2 w-2 rounded-full ${getStatusColor(node.status)}`} />
              </div>
              <button 
                onClick={() => copyAddress(node.address)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="truncate max-w-[120px]">{node.address}</span>
                <Copy className="h-3 w-3 shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Uptime
              </p>
              <div className="space-y-1">
                <p className="font-semibold">{node.uptime}%</p>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${node.uptime}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Capacity
              </p>
              <div className="space-y-1">
                <p className="font-semibold">{node.capacity}%</p>
                <div className="progress-bar">
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
            </div>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-border/50 pt-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wifi className="h-3 w-3" />
              <span>{node.peers} peers</span>
            </div>
            <div className="font-mono font-medium text-primary">
              {(node.stake / 1000).toFixed(1)}K staked
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-card to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <Button className="w-full" size="sm" variant="secondary">
              <ExternalLink className="h-3 w-3 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
