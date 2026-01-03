import { Server, Activity, Wifi, TrendingUp, Copy, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { getCountryFlag } from "@/lib/geo";
import type { PNode } from "./PNodeTable";

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

interface PNodeGridProps {
  nodes: PNode[];
  onViewDetails?: (node: PNode) => void;
}

export function PNodeGrid({ nodes, onViewDetails }: PNodeGridProps) {
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
          onClick={() => onViewDetails && onViewDetails(node)}
          className="glass-card rounded-lg hover:ring-2 hover:ring-primary/50 cursor-pointer transition-all p-4 sm:p-5 relative group h-full flex flex-col"
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

          <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className={`p-2 sm:p-2.5 rounded-lg bg-primary/10 flex-shrink-0`}>
              <Server className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono font-semibold text-xs sm:text-sm truncate">{node.id}</h3>
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${getStatusColor(node.status)}`} />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  copyAddress(node.address);
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="truncate max-w-[120px]">{node.address}</span>
                <Copy className="h-3 w-3 shrink-0" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4 flex-1">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Uptime
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{node.uptime}%</p>
                <div className="progress-bar h-1">
                  <div className="progress-bar-fill" style={{ width: `${node.uptime}%` }} />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3" /> Capacity
              </p>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{node.capacity}%</p>
                <div className="progress-bar h-1">
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

          <div className="flex items-center justify-between text-xs sm:text-sm border-t border-border/50 pt-2 sm:pt-3 mt-auto">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span>{getCountryFlag(node.region || 'Unknown')}</span>
              <span className="truncate">{node.region || 'Unknown'}</span>
            </div>
            <div className="font-mono font-medium text-primary text-xs sm:text-sm">
              {(node.stake / 1000).toFixed(1)}K
            </div>
          </div>

          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails && onViewDetails(node);
            }}
            className="w-full mt-3 sm:mt-4 text-xs sm:text-sm h-8 sm:h-9" 
            variant="secondary"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Full Details
          </Button>
        </div>
      ))}
    </div>
  );
}
