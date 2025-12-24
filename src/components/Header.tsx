import { useState, useEffect } from "react";
import { Search, RefreshCw, Bell, Settings, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import xandeumLogo from "@/assets/xandeum-logo.png";
import VerificationCard from "@/components/VerificationCard";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  // header props
  // refresh control
  refreshInterval: number;
  setRefreshInterval: (ms: number) => void;
  // search control
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export function Header({ onRefresh, isLoading, refreshInterval, setRefreshInterval, searchQuery, setSearchQuery }: HeaderProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-border/50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <img src={xandeumLogo} alt="Xandeum" className="h-10 w-auto" />
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pNodes by ID or address..."
                value={searchQuery ?? ''}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground mr-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 pulse-dot" />
              <span>Live</span>
              <span className="text-border">•</span>
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              className="hover:bg-secondary"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            
            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Auto-refresh:</span>
              <Select value={String(refreshInterval)} onValueChange={(v) => setRefreshInterval(Number(v))}>
                <SelectTrigger className="w-[110px] h-8 bg-secondary/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="0">Off</SelectItem>
                  <SelectItem value="30000">30s</SelectItem>
                  <SelectItem value="60000">60s</SelectItem>
                  <SelectItem value="300000">5m</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <Bell className="h-4 w-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <Settings className="h-4 w-4" />
            </Button>

            <Button 
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => window.open("https://www.xandeum.network/docs?_gl=1*1g85y28*_gcl_au*MTI4NDY0NTA3OC4xNzY1MzQ4NzEy", "_blank")}
            >
              <span>Docs</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {/* Verification card placed in header for quick access */}
        {/* Verification card removed from header — placed in All pNodes section for visual consistency */}
      </div>
    </header>
  );
}
